-- Migration: Add new CV Analysis v2 columns to candidate_screenings
-- Run this in your Supabase SQL Editor

ALTER TABLE candidate_screenings
  ADD COLUMN IF NOT EXISTS education_match_score smallint,
  ADD COLUMN IF NOT EXISTS culture_fit_score smallint,
  ADD COLUMN IF NOT EXISTS summary text,
  ADD COLUMN IF NOT EXISTS recommendation text,
  ADD COLUMN IF NOT EXISTS key_highlights jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS missing_requirements jsonb DEFAULT '[]'::jsonb;

-- Add check constraints for new score columns
ALTER TABLE candidate_screenings
  ADD CONSTRAINT check_education_match_score CHECK (education_match_score IS NULL OR (education_match_score >= 0 AND education_match_score <= 100)),
  ADD CONSTRAINT check_culture_fit_score CHECK (culture_fit_score IS NULL OR (culture_fit_score >= 0 AND culture_fit_score <= 100)),
  ADD CONSTRAINT check_recommendation CHECK (recommendation IS NULL OR recommendation IN ('STRONG_HIRE', 'HIRE', 'MAYBE', 'NO_HIRE'));

-- Comment for documentation
COMMENT ON COLUMN candidate_screenings.education_match_score IS 'AI-scored education match (0-100)';
COMMENT ON COLUMN candidate_screenings.culture_fit_score IS 'AI-scored culture fit (0-100)';
COMMENT ON COLUMN candidate_screenings.summary IS 'AI-generated summary in Vietnamese';
COMMENT ON COLUMN candidate_screenings.recommendation IS 'AI recommendation: STRONG_HIRE, HIRE, MAYBE, NO_HIRE';
COMMENT ON COLUMN candidate_screenings.key_highlights IS 'Array of key highlights from CV analysis';
COMMENT ON COLUMN candidate_screenings.missing_requirements IS 'Array of JD requirements not found in CV';
