-- SQL Migration script to support Faculty-Student assignment and real-time dashboard data.
-- Run this script in your Supabase SQL Editor.

-- 1. Add mentor_id, cgpa, and backlogs columns to student_profiles if they do not exist
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS mentor_id uuid REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS cgpa numeric(4,2) DEFAULT 8.0;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS backlogs integer DEFAULT 0;

-- 2. Drop existing restrictive policies so we can recreate them
DROP POLICY IF EXISTS "Allow users to select their own user record" on users;
DROP POLICY IF EXISTS "Allow own student profile select" on student_profiles;
DROP POLICY IF EXISTS "Allow own student profile update" on student_profiles;

-- 3. Create updated policy for users table (allows faculty, HOD, and admin to see all users)
CREATE POLICY "Allow users to select their own user record or faculty/hod/admin to select any" on users
  FOR SELECT
  USING (
    auth.uid() = id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty', 'hod')
  );

-- 4. Create updated select policy for student_profiles (allows student to see own, and faculty/hod/admin to see all)
CREATE POLICY "Allow own student profile select or faculty/hod/admin to select all" on student_profiles
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty', 'hod')
  );

-- 5. Create updated update policy for student_profiles (allows student to edit own, and faculty/hod/admin to assign/update)
CREATE POLICY "Allow own student profile update or faculty/hod/admin to update any" on student_profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty', 'hod')
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'faculty', 'hod')
  );
