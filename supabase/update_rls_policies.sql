-- =========================================================================
-- SQL Migration: Update RLS Policies using Security Definer
-- Run this script in your Supabase SQL Editor.
-- =========================================================================

-- 1. Create a security definer function to lookup user roles safely
CREATE OR REPLACE FUNCTION get_user_role(user_uuid uuid)
RETURNS text AS $$
  SELECT role FROM public.users WHERE id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- 2. Drop existing policies on users table so we can recreate them
DROP POLICY IF EXISTS "Allow users to select their own user record or faculty/hod/admin to select any" ON users;

CREATE POLICY "Allow users to select their own user record or faculty/hod/admin to select any" ON users
  FOR SELECT
  USING (
    auth.uid() = id
    OR get_user_role(auth.uid()) IN ('admin', 'faculty', 'hod')
  );

-- 3. Drop existing policies on student_profiles so we can recreate them
DROP POLICY IF EXISTS "Allow own student profile select or faculty/hod/admin to select all" ON student_profiles;
DROP POLICY IF EXISTS "Allow own student profile update or faculty/hod/admin to update any" ON student_profiles;

CREATE POLICY "Allow own student profile select or faculty/hod/admin to select all" ON student_profiles
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR get_user_role(auth.uid()) IN ('admin', 'faculty', 'hod')
  );

CREATE POLICY "Allow own student profile update or faculty/hod/admin to update any" ON student_profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR get_user_role(auth.uid()) IN ('admin', 'faculty', 'hod')
  )
  WITH CHECK (
    auth.uid() = user_id
    OR get_user_role(auth.uid()) IN ('admin', 'faculty', 'hod')
  );

-- 4. Drop existing policies on faculty_profiles so we can recreate them
DROP POLICY IF EXISTS "Allow own faculty profile select or hod/admin to select all" ON faculty_profiles;
DROP POLICY IF EXISTS "Allow own faculty profile update or admin/hod to update any" ON faculty_profiles;

CREATE POLICY "Allow own faculty profile select or hod/admin to select all" ON faculty_profiles
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR get_user_role(auth.uid()) IN ('admin', 'hod')
  );

CREATE POLICY "Allow own faculty profile update or admin/hod to update any" ON faculty_profiles
  FOR UPDATE
  USING (
    auth.uid() = user_id
    OR get_user_role(auth.uid()) IN ('admin', 'hod')
  )
  WITH CHECK (
    auth.uid() = user_id
    OR get_user_role(auth.uid()) IN ('admin', 'hod')
  );
