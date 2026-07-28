'use client';

import { Briefcase } from 'lucide-react';

interface PlacementEligibilityCardProps {
  cgpa: number | null;
  backlogs: number | null;
  attendance: number | null;
  className?: string;
}

export function PlacementEligibilityCard({
  cgpa,
  backlogs,
  attendance,
  className = ''
}: PlacementEligibilityCardProps) {
  // Determine placement status based on single source logic
  const minCgpa = 6.5;
  const maxBacklogs = 0;
  const minAttendance = 75;

  let status: 'Eligible' | 'Conditional' | 'Not Eligible' | 'Not Updated' = 'Not Updated';
  let badgeStyle = 'bg-slate-100 border-slate-200 text-slate-600';

  if (cgpa === null || backlogs === null || attendance === null) {
    status = 'Not Updated';
    badgeStyle = 'bg-slate-100 border-slate-200 text-slate-600';
  } else {
    const isCgpaOk = cgpa >= minCgpa;
    const isBacklogsOk = backlogs <= maxBacklogs;
    const isAttendanceOk = attendance >= minAttendance;

    if (isCgpaOk && isBacklogsOk && isAttendanceOk) {
      status = 'Eligible';
      badgeStyle = 'bg-emerald-50 border-emerald-200 text-emerald-800';
    } else if (backlogs <= 2 && cgpa >= 6.0) {
      status = 'Conditional';
      badgeStyle = 'bg-amber-50 border-amber-200 text-amber-800';
    } else {
      status = 'Not Eligible';
      badgeStyle = 'bg-rose-50 border-rose-200 text-rose-800';
    }
  }

  const formattedCgpa = cgpa !== null ? Number(cgpa).toFixed(2) : 'N/A';
  const formattedBacklogs = backlogs !== null ? String(backlogs) : 'N/A';
  const formattedAttendance = attendance !== null ? `${attendance}%` : 'N/A';

  return (
    <div className={`rounded-3xl border border-slate-200/80 bg-white p-6 shadow-xs hover:shadow-md transition duration-200 flex flex-col justify-between ${className}`}>
      {/* Header Row */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
            <Briefcase className="h-5 w-5" />
          </div>
          <span>Placement Eligibility</span>
        </h3>
        <span className={`inline-flex items-center rounded-xl px-3 py-1 text-xs font-black uppercase tracking-wider border ${badgeStyle}`}>
          {status}
        </span>
      </div>

      {/* 3 Stat Boxes Grid */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4 my-auto">
        {/* CGPA */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-center flex flex-col items-center justify-center">
          <span className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-widest">
            CGPA
          </span>
          <span className="text-lg sm:text-xl font-black text-slate-900 mt-1">
            {formattedCgpa}
          </span>
        </div>

        {/* BACKLOGS */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-center flex flex-col items-center justify-center">
          <span className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-widest">
            BACKLOGS
          </span>
          <span className="text-lg sm:text-xl font-black text-slate-900 mt-1">
            {formattedBacklogs}
          </span>
        </div>

        {/* ATTENDANCE */}
        <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-100 text-center flex flex-col items-center justify-center">
          <span className="text-[10px] sm:text-xs font-extrabold text-slate-400 uppercase tracking-widest">
            ATTENDANCE
          </span>
          <span className="text-lg sm:text-xl font-black text-emerald-700 mt-1">
            {formattedAttendance}
          </span>
        </div>
      </div>
    </div>
  );
}
