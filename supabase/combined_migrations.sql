-- =========================================================================
-- SQL Migration: Add All Missing Columns to student_profiles
-- Copy this entire script, paste it into your Supabase SQL Editor, and click "Run".
-- =========================================================================

-- 1. Ensure cgpa and backlogs exist
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS cgpa numeric(4,2) DEFAULT 8.00;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS backlogs integer DEFAULT 0;

-- 2. Add clubs, certifications, and extracurricular profile fields
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS clubs jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS interests text DEFAULT '';
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS dreams text DEFAULT '';
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS career_goals text DEFAULT '';

-- 3. Add sgpa and academic_subjects for Academic Profiles
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS sgpa numeric(4,2) DEFAULT 8.00;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS academic_subjects jsonb DEFAULT '[]'::jsonb NOT NULL;

-- 4. Add alternate_phone, linkedin_url, and resume_url columns to student_profiles
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS alternate_phone text;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS resume_url text;

-- 5. Add RLS policy to allow users to update their own user record (for name edits)
DROP POLICY IF EXISTS "Allow users to update their own user record" ON users;
CREATE POLICY "Allow users to update their own user record" ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 6. Ensure delete policies for queries and query_messages are correctly established (enables cascading delete)
DROP POLICY IF EXISTS "Allow delete queries" ON queries;
CREATE POLICY "Allow delete queries" ON queries
  FOR DELETE
  USING (
    auth.uid() = student_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty', 'hod')
  );

DROP POLICY IF EXISTS "Allow delete query_messages" ON query_messages;
CREATE POLICY "Allow delete query_messages" ON query_messages
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM queries
      WHERE queries.id = query_messages.query_id
      AND (
        queries.student_id = auth.uid()
        OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty', 'hod')
      )
    )
  );

-- 7. Add Academic Forms tables and Attendance Sync
CREATE TABLE IF NOT EXISTS academic_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES users(id) ON DELETE CASCADE,
  form_type text NOT NULL,
  title text NOT NULL,
  description text,
  semester text,
  fields jsonb DEFAULT '[]'::jsonb NOT NULL,
  status text DEFAULT 'Active' NOT NULL,
  due_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS academic_form_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid REFERENCES academic_forms(id) ON DELETE CASCADE NOT NULL,
  student_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  mentor_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  form_type text NOT NULL,
  semester text,
  submission_data jsonb NOT NULL,
  overall_attendance numeric(5,2),
  status text DEFAULT 'Submitted' NOT NULL,
  submitted_at timestamp with time zone DEFAULT now() NOT NULL,
  reviewed_at timestamp with time zone,
  rejection_reason text
);

ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS attendance_percentage numeric(5,2) DEFAULT 85.00;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS attendance_records jsonb DEFAULT '[]'::jsonb NOT NULL;

GRANT ALL ON academic_forms TO authenticated, service_role, anon;
GRANT ALL ON academic_form_submissions TO authenticated, service_role, anon;

ALTER TABLE academic_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_form_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Mentors can manage forms" ON academic_forms;
CREATE POLICY "Mentors can manage forms" ON academic_forms
  FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Students can view assigned forms" ON academic_forms;
CREATE POLICY "Students can view assigned forms" ON academic_forms
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Students can submit forms" ON academic_form_submissions;
CREATE POLICY "Students can submit forms" ON academic_form_submissions
  FOR ALL
  USING (true)
  WITH CHECK (true);
