-- SQL Migration script to support HOD-Faculty assignment and updated RLS policies.
-- Run this script in your Supabase SQL Editor.

-- 1. Add hod_id column to faculty_profiles if it does not exist
ALTER TABLE faculty_profiles ADD COLUMN IF NOT EXISTS hod_id uuid REFERENCES users(id) ON DELETE SET NULL;

-- 2. Drop existing restrictive policies so we can recreate them
DROP POLICY IF EXISTS "Allow own faculty profile select" on faculty_profiles;
DROP POLICY IF EXISTS "Allow own faculty profile update" on faculty_profiles;

-- 3. Create updated select policy for faculty_profiles (allows faculty to see own, and hod/admin to see all)
CREATE POLICY "Allow own faculty profile select or hod/admin to select all" on faculty_profiles
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'hod')
  );

-- 4. Create updated update policy for faculty_profiles (allows faculty to edit own, and admin to assign/update)
CREATE POLICY "Allow own faculty profile update or admin/hod to update any" on faculty_profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'hod')
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (auth.jwt() -> 'user_metadata' ->> 'role') IN ('admin', 'hod')
  );
