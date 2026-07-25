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
