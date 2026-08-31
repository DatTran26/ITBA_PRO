-- Migration: Add parsed_info column to candidate_cvs for caching extracted CV data
ALTER TABLE candidate_cvs
  ADD COLUMN IF NOT EXISTS parsed_info jsonb;

COMMENT ON COLUMN candidate_cvs.parsed_info IS 'AI-extracted core CV info: name, email, phone, skills, education, experience, summary, certifications';
