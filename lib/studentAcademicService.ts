export interface SgpaTrendItem {
  name: string;
  Student: number | null;
  ClassAvg: number;
}

export interface BacklogTrendItem {
  name: string;
  Backlogs: number;
}

export interface PlacementCheck {
  label: string;
  value: string;
  passed: boolean;
  warning: boolean;
}

export interface PlacementEligibility {
  status: 'Eligible' | 'Conditional' | 'Ineligible' | 'Not Updated';
  statusColor: string;
  statusText: string;
  reason: string;
  checks: PlacementCheck[];
}

export interface StudentAcademicSummary {
  sgpaVal: number | null;
  cgpaVal: number | null;
  backlogsVal: number | null;
  attendanceVal: number | null;
  sgpaTrendData: SgpaTrendItem[];
  backlogChartData: BacklogTrendItem[];
  placementEligibility: PlacementEligibility;
  skillsList: Array<{ name: string; level: number }>;
  subjects: any[];
  clubs: any[];
  certifications: any[];
  hasAcademicData: boolean;
}

export const convertGradeToGP = (gpaStr: string | number | undefined | null): number | null => {
  if (gpaStr === undefined || gpaStr === null) return null;
  const str = String(gpaStr).trim().toUpperCase();
  const num = parseFloat(str);
  if (!isNaN(num)) return num;

  switch (str) {
    case 'O': case 'S': case '10': return 10.0;
    case 'A+': case '9': return 9.0;
    case 'A': case '8': return 8.0;
    case 'B+': case '7': return 7.0;
    case 'B': case '6': return 6.0;
    case 'C': case '5': return 5.0;
    case 'D': case 'P': case '4': return 4.0;
    case 'F': return 0.0;
    default: return null;
  }
};

export const parseSkillsFromInterests = (rawInterests: string): Array<{ name: string; level: number }> => {
  if (!rawInterests || !rawInterests.includes('||skills:')) return [];
  const parts = rawInterests.split('||skills:');
  const skillStr = parts[1]?.trim();
  if (!skillStr) return [];
  try {
    const parsed = JSON.parse(skillStr);
    if (Array.isArray(parsed)) {
      return parsed
        .map((item: any) => {
          if (typeof item === 'string') return { name: item, level: 80 };
          return { name: item.name || '', level: item.level || 80 };
        })
        .filter((item: any) => item.name);
    }
  } catch {
    return skillStr
      .split(',')
      .map((s: string) => {
        const item = s.trim();
        if (item.includes(':')) {
          const [name, lvl] = item.split(':');
          return { name: name.trim(), level: parseInt(lvl) || 80 };
        }
        return { name: item, level: 80 };
      })
      .filter((item: any) => item.name);
  }
  return [];
};

export const getStudentAcademicData = (profileRaw: any): StudentAcademicSummary => {
  const profile = profileRaw || {};
  const subjects = Array.isArray(profile.academic_subjects) ? profile.academic_subjects : [];
  const clubs = Array.isArray(profile.clubs) ? profile.clubs : [];
  const certifications = Array.isArray(profile.certifications) ? profile.certifications : [];
  const skillsList = parseSkillsFromInterests(profile.interests || '');

  // 1. Calculate dynamic statistics from academic_subjects JSON
  let totalCgpaCredits = 0;
  let totalCgpaPoints = 0;
  let backlogCount = 0;

  subjects.forEach((sub: any) => {
    const gp = convertGradeToGP(sub.gpa ?? sub.grade ?? sub.gradeSecured);
    const credits = parseFloat(sub.credits) || 0;
    if (gp !== null && credits > 0) {
      totalCgpaCredits += credits;
      totalCgpaPoints += gp * credits;
    }
    const isF = sub.gpa === 'F' || sub.result === 'F' || sub.result === 'FAIL' || (gp !== null && gp < 4.0);
    if (isF) backlogCount++;
  });

  const calculatedCgpa = totalCgpaCredits > 0 ? Number((totalCgpaPoints / totalCgpaCredits).toFixed(2)) : null;

  // Prioritize stored profile values if present, else fallback to calculated
  const cgpaVal = profile.cgpa !== undefined && profile.cgpa !== null && profile.cgpa !== '' 
    ? Number(profile.cgpa) 
    : calculatedCgpa;

  const backlogsVal = profile.backlogs !== undefined && profile.backlogs !== null && profile.backlogs !== '' 
    ? Number(profile.backlogs) 
    : (subjects.length > 0 ? backlogCount : null);

  const attendanceVal = profile.attendance_percentage !== undefined && profile.attendance_percentage !== null && profile.attendance_percentage !== '' 
    ? Number(profile.attendance_percentage) 
    : null;

  // 2. Generate SGPA Trend Data
  const semMap: Record<number, any[]> = {};
  subjects.forEach((sub: any) => {
    const sem = parseInt(sub.semester || sub.sem);
    if (!isNaN(sem)) {
      semMap[sem] = semMap[sem] || [];
      semMap[sem].push(sub);
    }
  });

  const maxSemInSubjects = Math.max(...subjects.map((s: any) => parseInt(s.semester || s.sem) || 0), 0);
  const chartLength = Math.max(maxSemInSubjects, subjects.length > 0 ? 4 : 0);

  const sgpaTrendData: SgpaTrendItem[] = Array.from({ length: chartLength }, (_, i) => {
    const semNum = i + 1;
    const subjectsInSem = semMap[semNum] || [];
    let studentSGPA: number | null = null;

    const firstSubWithSgpa = subjectsInSem.find((sub: any) => sub.sgpa && !isNaN(parseFloat(sub.sgpa)));
    if (firstSubWithSgpa) {
      studentSGPA = Number(parseFloat(firstSubWithSgpa.sgpa).toFixed(2));
    } else if (subjectsInSem.length > 0) {
      const validGPs = subjectsInSem
        .map((sub: any) => convertGradeToGP(sub.gpa ?? sub.grade ?? sub.gradeSecured))
        .filter((gp: any): gp is number => gp !== null);

      if (validGPs.length > 0) {
        studentSGPA = Number((validGPs.reduce((a, b) => a + b, 0) / validGPs.length).toFixed(2));
      }
    }

    return {
      name: `Sem ${semNum}`,
      Student: studentSGPA,
      ClassAvg: Number((7.4 + Math.sin(semNum) * 0.2 + semNum * 0.05).toFixed(2))
    };
  });

  // 3. Generate Backlog Trend Data
  const backlogSemMap: Record<number, number> = {};
  if (chartLength > 0) {
    for (let i = 1; i <= chartLength; i++) {
      backlogSemMap[i] = 0;
    }
  }

  subjects.forEach((sub: any) => {
    const sem = parseInt(sub.semester || sub.sem);
    const gp = convertGradeToGP(sub.gpa ?? sub.grade ?? sub.gradeSecured);
    const isF = sub.gpa === 'F' || sub.result === 'F' || sub.result === 'FAIL' || (gp !== null && gp < 4.0);
    if (!isNaN(sem) && sem > 0) {
      if (isF) {
        backlogSemMap[sem] = (backlogSemMap[sem] || 0) + 1;
      }
    }
  });

  const backlogChartData: BacklogTrendItem[] = Object.keys(backlogSemMap)
    .map(Number)
    .sort((a, b) => a - b)
    .map((sem: number) => ({
      name: `Sem ${sem}`,
      Backlogs: backlogSemMap[sem]
    }));

  // 4. Determine Placement Eligibility
  const minCgpa = 6.5;
  const maxBacklogs = 0;
  const minAttendance = 75;

  let placementEligibility: PlacementEligibility;

  if (cgpaVal === null || backlogsVal === null || attendanceVal === null) {
    placementEligibility = {
      status: 'Not Updated',
      statusColor: 'text-slate-600 bg-slate-100 border-slate-200',
      statusText: 'Pending Data Update',
      reason: 'Academic, backlog, or attendance records have not been uploaded or verified yet.',
      checks: [
        { label: `CGPA Metric (Min ${minCgpa})`, value: cgpaVal !== null ? `${cgpaVal.toFixed(2)}` : 'Not Set', passed: cgpaVal !== null && cgpaVal >= minCgpa, warning: false },
        { label: 'Active Backlogs (Max 0)', value: backlogsVal !== null ? `${backlogsVal}` : 'Not Set', passed: backlogsVal !== null && backlogsVal <= maxBacklogs, warning: false },
        { label: `Class Attendance (Min ${minAttendance}%)`, value: attendanceVal !== null ? `${attendanceVal}%` : 'Not Set', passed: attendanceVal !== null && attendanceVal >= minAttendance, warning: false }
      ]
    };
  } else {
    const hasCgpaOk = cgpaVal >= minCgpa;
    const hasBacklogsOk = backlogsVal <= maxBacklogs;
    const hasAttendanceOk = attendanceVal >= minAttendance;

    let status: 'Eligible' | 'Conditional' | 'Ineligible' = 'Eligible';
    let statusColor = 'text-emerald-700 bg-emerald-50/50 border-emerald-200';
    let statusText = 'Eligible for Campus Placements';
    let reason = 'Meets all academic, attendance, and backlog clearance criteria.';

    if (!hasCgpaOk && !hasBacklogsOk) {
      status = 'Ineligible';
      statusColor = 'text-rose-700 bg-rose-50/50 border-rose-200';
      statusText = 'Currently Ineligible';
      reason = 'Does not meet CGPA criteria and has active backlogs.';
    } else if (!hasBacklogsOk) {
      if (backlogsVal <= 2) {
        status = 'Conditional';
        statusColor = 'text-amber-700 bg-amber-50/50 border-amber-205';
        statusText = 'Conditional Eligibility';
        reason = 'Eligible for select companies. Must clear active backlogs.';
      } else {
        status = 'Ineligible';
        statusColor = 'text-rose-700 bg-rose-50/50 border-rose-200';
        statusText = 'Currently Ineligible';
        reason = 'Ineligible due to multiple (>2) active backlogs.';
      }
    } else if (!hasCgpaOk) {
      if (cgpaVal >= 6.0) {
        status = 'Conditional';
        statusColor = 'text-amber-700 bg-amber-50/50 border-amber-205';
        statusText = 'Conditional Eligibility';
        reason = 'Eligible for mass recruiters. Needs to improve CGPA to >= 6.5.';
      } else {
        status = 'Ineligible';
        statusColor = 'text-rose-700 bg-rose-50/50 border-rose-200';
        statusText = 'Currently Ineligible';
        reason = 'CGPA is below the minimum placement threshold of 6.0.';
      }
    } else if (!hasAttendanceOk) {
      status = 'Conditional';
      statusColor = 'text-amber-700 bg-amber-50/50 border-amber-205';
      statusText = 'Conditional Eligibility';
      reason = 'Attendance is below 75%. Subject to Department approval.';
    }

    placementEligibility = {
      status,
      statusColor,
      statusText,
      reason,
      checks: [
        { label: `CGPA Metric (Min ${minCgpa})`, value: `${cgpaVal.toFixed(2)}`, passed: hasCgpaOk, warning: !hasCgpaOk && cgpaVal >= 6.0 },
        { label: 'Active Backlogs (Max 0)', value: `${backlogsVal}`, passed: hasBacklogsOk, warning: !hasBacklogsOk && backlogsVal <= 2 },
        { label: `Class Attendance (Min ${minAttendance}%)`, value: `${attendanceVal}%`, passed: hasAttendanceOk, warning: !hasAttendanceOk && attendanceVal >= 65 }
      ]
    };
  }

  let sgpaVal: number | null = null;
  if (profileRaw?.sgpa !== undefined && profileRaw?.sgpa !== null && profileRaw.sgpa !== '') {
    sgpaVal = Number(profileRaw.sgpa);
  } else {
    const validSgpas = sgpaTrendData.map(s => s.Student).filter((s): s is number => s !== null);
    if (validSgpas.length > 0) {
      sgpaVal = validSgpas[validSgpas.length - 1];
    }
  }

  const hasAcademicData = subjects.length > 0 || cgpaVal !== null || backlogsVal !== null || attendanceVal !== null;

  return {
    sgpaVal,
    cgpaVal,
    backlogsVal,
    attendanceVal,
    sgpaTrendData,
    backlogChartData,
    placementEligibility,
    skillsList,
    subjects,
    clubs,
    certifications,
    hasAcademicData
  };
};
