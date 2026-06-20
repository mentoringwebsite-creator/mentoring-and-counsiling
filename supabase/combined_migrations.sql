-- =========================================================================
-- SQL Migration: Add All Missing Columns to student_profiles
-- Copy this entire script, paste it into your Supabase SQL Editor, and click "Run".
-- =========================================================================

-- 1. Ensure cgpa and backlogs exist
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS cgpa numeric(4,2) DEFAULT 8.00;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS backlogs integer DEFAULT 0;

-- 2. Add clubs and certifications for Extracurricular Activities
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS clubs jsonb DEFAULT '[]'::jsonb NOT NULL;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]'::jsonb NOT NULL;

-- 3. Add sgpa and academic_subjects for Academic Profiles
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS sgpa numeric(4,2) DEFAULT 8.00;
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS academic_subjects jsonb DEFAULT '[]'::jsonb NOT NULL;
