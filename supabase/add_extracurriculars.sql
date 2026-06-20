-- =========================================================================
-- SQL Migration: Add Extracurriculars columns to student_profiles
-- Run this script in your Supabase SQL Editor.
-- =========================================================================

-- 1. Add clubs column of type jsonb defaulting to empty array '[]'
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS clubs jsonb DEFAULT '[]'::jsonb NOT NULL;

-- 2. Add certifications column of type jsonb defaulting to empty array '[]'
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS certifications jsonb DEFAULT '[]'::jsonb NOT NULL;
