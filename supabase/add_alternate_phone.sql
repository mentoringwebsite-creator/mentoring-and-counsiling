-- SQL Script to add alternate_phone column to student_profiles table.
-- Copy and paste this script into your Supabase SQL Editor.

ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS alternate_phone text;
