-- =========================================================================
-- SQL Migration: Add Academic Details columns to student_profiles
-- Run this script in your Supabase SQL Editor.
-- =========================================================================

-- 1. Ensure cgpa and backlogs columns exist (from previous migrations)
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS cgpa numeric(4,2) DEFAULT 8.00;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS backlogs integer DEFAULT 0;

-- 2. Add sgpa column of type numeric(4,2) defaulting to 8.00
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS sgpa numeric(4,2) DEFAULT 8.00;

-- 3. Add academic_subjects column of type jsonb defaulting to empty array '[]'
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS academic_subjects jsonb DEFAULT '[]'::jsonb NOT NULL;
