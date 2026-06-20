-- =========================================================================
-- SQL Migration: Add Aspirations and Interests columns to student_profiles
-- Run this script in your Supabase SQL Editor.
-- =========================================================================

-- 1. Add interests column defaulting to empty string
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS interests text DEFAULT '';

-- 2. Add dreams column defaulting to empty string
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS dreams text DEFAULT '';

-- 3. Add career_goals column (what they want to become) defaulting to empty string
ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS career_goals text DEFAULT '';
