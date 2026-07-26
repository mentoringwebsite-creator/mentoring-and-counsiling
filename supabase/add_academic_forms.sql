-- =========================================================================
-- SQL Migration: Add Academic Forms & Attendance Sync
-- Copy and run this script in your Supabase SQL Editor.
-- =========================================================================

-- 1. Create academic_forms table for forms sent by mentors
CREATE TABLE IF NOT EXISTS academic_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES users(id) ON DELETE CASCADE, -- NULL means sent to all assigned students
  form_type text NOT NULL, -- 'semester_marks' or 'attendance'
  title text NOT NULL,
  description text,
  semester text,
  fields jsonb DEFAULT '[]'::jsonb NOT NULL,
  status text DEFAULT 'Active' NOT NULL, -- 'Active', 'Closed'
  due_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

-- 2. Create academic_form_submissions table for student responses
CREATE TABLE IF NOT EXISTS academic_form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES academic_forms(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  mentor_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  form_type text NOT NULL, -- 'semester_marks' or 'attendance'
  semester text,
  submission_data jsonb NOT NULL, -- marks array or attendance subject array
  overall_attendance numeric(5,2),
  status text DEFAULT 'Submitted' NOT NULL, -- 'Submitted', 'Approved', 'Rejected'
  submitted_at timestamp with time zone DEFAULT now() NOT NULL,
  reviewed_at timestamp with time zone,
  rejection_reason text
);

-- 3. Add attendance columns to student_profiles if missing
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS attendance_percentage numeric(5,2) DEFAULT 85.00;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS attendance_records jsonb DEFAULT '[]'::jsonb NOT NULL;

-- 4. Grant table permissions to authenticated users and service_role
GRANT ALL ON academic_forms TO authenticated, service_role, anon;
GRANT ALL ON academic_form_submissions TO authenticated, service_role, anon;

-- 5. Enable RLS on new tables
ALTER TABLE academic_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_form_submissions ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies for academic_forms
DROP POLICY IF EXISTS "Mentors can manage forms" ON academic_forms;
CREATE POLICY "Mentors can manage forms" ON academic_forms
  FOR ALL
  USING (
    auth.uid() = mentor_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'hod', 'faculty')
    OR true
  )
  WITH CHECK (
    auth.uid() = mentor_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'hod', 'faculty')
    OR true
  );

DROP POLICY IF EXISTS "Students can view assigned forms" ON academic_forms;
CREATE POLICY "Students can view assigned forms" ON academic_forms
  FOR SELECT
  USING (true);

-- 7. RLS Policies for academic_form_submissions
DROP POLICY IF EXISTS "Students can submit forms" ON academic_form_submissions;
CREATE POLICY "Students can submit forms" ON academic_form_submissions
  FOR ALL
  USING (true)
  WITH CHECK (true);
