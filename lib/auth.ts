import { supabase } from '@/lib/supabase';

export type Role = 'student' | 'faculty' | 'hod' | 'admin';

type StudentRegistration = {
  name: string;
  email: string;
  password: string;
  rollNumber: string;
  branch: string;
  section: string;
  academicYear: string;
  phone: string;
  dob: string;
  profilePhotoUrl: string;
};

type FacultyRegistration = {
  name: string;
  email: string;
  password: string;
  facultyId: string;
  designation: string;
  qualification: string;
  department: string;
  subjects: string;
  contactNumber: string;
  profilePhotoUrl: string;
};

type HodRegistration = {
  name: string;
  email: string;
  password: string;
  facultyId: string;
  department: string;
  designation: string;
  contactNumber: string;
  profilePhotoUrl: string;
};

type RegistrationPayload = StudentRegistration | FacultyRegistration | HodRegistration;

type LoginResult = {
  success: boolean;
  message: string;
  redirectTo?: string;
};

type RegisterResult = {
  success: boolean;
  message: string;
};

export async function loginWithStatusCheck(role: Role, email: string, password: string): Promise<LoginResult> {
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });

  if (authError) {
    return { success: false, message: authError.message };
  }

  const userId = authData.session?.user?.id;
  if (!userId) {
    return { success: false, message: 'Unable to verify your account. Please try again.' };
  }

  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('role,status')
    .eq('id', userId)
    .single();

  if (userError || !userData) {
    if (role === 'admin') {
      const response = await fetch('/api/admin/ensure-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: userId,
          email,
          name: authData.user?.user_metadata?.name ?? 'Admin'
        })
      });

      if (response.ok) {
        return { success: true, message: 'Login successful.', redirectTo: '/admin' };
      }
    }

    await supabase.auth.signOut();
    return {
      success: false,
      message: 'No matching user record was found. Please register first using the correct portal.'
    };
  }

  if (role !== 'admin' && userData.role !== role) {
    await supabase.auth.signOut();
    return {
      success: false,
      message: 'This login page is for a different user role. Please use the correct portal login.'
    };
  }

  if (userData.status === 'Pending') {
    await supabase.auth.signOut();
    return {
      success: false,
      message: 'Your account is awaiting admin approval. Please wait for approval before signing in.'
    };
  }

  if (userData.status === 'Rejected') {
    await supabase.auth.signOut();
    return {
      success: false,
      message: 'Your registration was rejected. Contact the administrator for help.'
    };
  }

  if (authError) {
    return { success: false, message: (authError as any)?.message ?? 'Login failed.' };
  }

  const redirectMap: Record<Role, string> = {
    student: '/student',
    faculty: '/faculty',
    hod: '/hod',
    admin: '/admin'
  };

  return { success: true, message: 'Login successful.', redirectTo: redirectMap[role] };
}

export async function registerUser(role: Role, payload: RegistrationPayload): Promise<RegisterResult> {
  const { email, password, name } = payload as any;

  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({ email, password });
  if (signUpError) {
    return { success: false, message: signUpError.message };
  }

  const authId = signUpData.user?.id;
  if (!authId) {
    return { success: false, message: 'Unable to create your account. Please try again later.' };
  }

  const { error: userInsertError } = await supabase.from('users').insert({
    id: authId,
    email,
    role,
    status: 'Pending',
    name
  });

  if (userInsertError) {
    return { success: false, message: userInsertError.message };
  }

  if (role === 'student') {
    const studentPayload = payload as StudentRegistration;
    const { error: profileError } = await supabase.from('student_profiles').insert({
      user_id: authId,
      roll_number: studentPayload.rollNumber,
      branch: studentPayload.branch,
      section: studentPayload.section,
      academic_year: studentPayload.academicYear,
      phone: studentPayload.phone,
      dob: studentPayload.dob,
      profile_photo: studentPayload.profilePhotoUrl
    });

    if (profileError) {
      return { success: false, message: profileError.message };
    }
  }

  if (role === 'faculty') {
    const facultyPayload = payload as FacultyRegistration;
    const { error: profileError } = await supabase.from('faculty_profiles').insert({
      user_id: authId,
      faculty_id: facultyPayload.facultyId,
      designation: facultyPayload.designation,
      qualification: facultyPayload.qualification,
      department: facultyPayload.department,
      subjects: facultyPayload.subjects,
      contact_number: facultyPayload.contactNumber,
      profile_photo: facultyPayload.profilePhotoUrl
    });

    if (profileError) {
      return { success: false, message: profileError.message };
    }
  }

  if (role === 'hod') {
    const hodPayload = payload as HodRegistration;
    const { error: profileError } = await supabase.from('hod_profiles').insert({
      user_id: authId,
      faculty_id: hodPayload.facultyId,
      department: hodPayload.department,
      designation: hodPayload.designation,
      contact_number: hodPayload.contactNumber,
      profile_photo: hodPayload.profilePhotoUrl
    });

    if (profileError) {
      return { success: false, message: profileError.message };
    }
  }

  return {
    success: true,
    message: 'Registration submitted. Your account is awaiting admin approval.'
  };
}

export async function getPendingApprovals() {
  const { data, error } = await supabase
    .from('users')
    .select(
      `id, name, email, role, status,
      student_profiles(roll_number,branch,section,academic_year,phone,dob,profile_photo),
      faculty_profiles(faculty_id,department,designation,qualification,subjects,contact_number,profile_photo),
      hod_profiles(faculty_id,department,designation,contact_number,profile_photo)`
    )
    .in('role', ['student', 'faculty', 'hod'])
    .eq('status', 'Pending');

  return { data, error };
}

export async function updateApprovalStatus(userId: string, status: 'Approved' | 'Rejected') {
  const { data, error } = await supabase.from('users').update({ status }).eq('id', userId).single();
  return { data, error };
}
