import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

function getSupabase() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceRoleKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { persistSession: false }
  });
}

type RegistrationPayload = {
  name: string;
  email: string;
  password: string;
  rollNumber?: string;
  branch?: string;
  section?: string;
  academicYear?: string;
  phone?: string;
  dob?: string;
  profilePhotoUrl?: string;
  facultyId?: string;
  designation?: string;
  qualification?: string;
  department?: string;
  subjects?: string;
  contactNumber?: string;
};

type Role = 'student' | 'faculty' | 'hod';

export async function POST(request: NextRequest) {
  const supabase = getSupabase();
  if (!supabase) {
    return NextResponse.json(
      { success: false, message: 'Missing server-side Supabase credentials.' },
      { status: 500 }
    );
  }

  const body = await request.json();
  const { role, payload } = body as { role?: Role; payload?: RegistrationPayload };

  if (!role || !payload) {
    return NextResponse.json({ success: false, message: 'Missing registration payload.' }, { status: 400 });
  }

  if (!['student', 'faculty', 'hod'].includes(role)) {
    return NextResponse.json({ success: false, message: 'Invalid role for registration.' }, { status: 400 });
  }

  const { email, password, name } = payload;
  if (!email || !password || !name) {
    return NextResponse.json({ success: false, message: 'Name, email, and password are required.' }, { status: 400 });
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role }
  });

  if (authError) {
    console.error('Registration authError:', authError);
    return NextResponse.json({ success: false, message: authError.message }, { status: 400 });
  }

  const authId = authData?.user?.id;
  if (!authId) {
    return NextResponse.json({ success: false, message: 'Unable to create auth user.' }, { status: 500 });
  }

  const { error: userInsertError } = await supabase.from('users').insert({
    id: authId,
    email,
    name,
    role,
    status: 'Pending'
  });

  if (userInsertError) {
    return NextResponse.json({ success: false, message: userInsertError.message }, { status: 500 });
  }

  if (role === 'student') {
    const { rollNumber, branch, section, academicYear, phone, dob, profilePhotoUrl } = payload;
    const { error: profileError } = await supabase.from('student_profiles').insert({
      user_id: authId,
      roll_number: rollNumber,
      branch,
      section,
      academic_year: academicYear,
      phone,
      dob: dob && dob.trim() !== '' ? dob : null,
      profile_photo: profilePhotoUrl
    });
    if (profileError) {
      return NextResponse.json({ success: false, message: profileError.message }, { status: 500 });
    }
  }

  if (role === 'faculty') {
    const { facultyId, designation, qualification, department, subjects, contactNumber, profilePhotoUrl } = payload;
    const { error: profileError } = await supabase.from('faculty_profiles').insert({
      user_id: authId,
      faculty_id: facultyId,
      designation,
      qualification,
      department,
      subjects,
      contact_number: contactNumber,
      profile_photo: profilePhotoUrl
    });
    if (profileError) {
      return NextResponse.json({ success: false, message: profileError.message }, { status: 500 });
    }
  }

  if (role === 'hod') {
    const { facultyId, department, designation, contactNumber, profilePhotoUrl } = payload;
    const { error: profileError } = await supabase.from('hod_profiles').insert({
      user_id: authId,
      faculty_id: facultyId,
      department,
      designation,
      contact_number: contactNumber,
      profile_photo: profilePhotoUrl
    });
    if (profileError) {
      return NextResponse.json({ success: false, message: profileError.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, message: 'Registration submitted. Your account is awaiting admin approval.' });
}
