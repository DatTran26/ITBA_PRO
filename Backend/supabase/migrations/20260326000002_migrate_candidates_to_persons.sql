-- =============================================================
-- MIGRATION: Backfill persons from existing results
-- Idempotent: safe to run multiple times
-- =============================================================

-- Step 1: Create person records from results with email
-- Uses DISTINCT ON to pick the most recent name per (email, recruiter)
INSERT INTO public.persons (full_name, email, type, created_by, created_at)
SELECT DISTINCT ON (r.candidate_email, t.recruiter_id)
  COALESCE(r.candidate_name, r.candidate_email, 'Unknown') AS full_name,
  r.candidate_email AS email,
  'candidate' AS type,
  t.recruiter_id AS created_by,
  MIN(r.created_at) OVER (PARTITION BY r.candidate_email, t.recruiter_id) AS created_at
FROM public.results r
JOIN public.tests t ON t.id = r.test_id
WHERE r.candidate_email IS NOT NULL
  AND r.candidate_email != ''
  AND r.person_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.persons p
    WHERE p.email = r.candidate_email
      AND p.created_by = t.recruiter_id
  )
ORDER BY r.candidate_email, t.recruiter_id, r.submitted_at DESC;

-- Step 2: Create person records from results without email (name-only fallback)
INSERT INTO public.persons (full_name, type, created_by, created_at)
SELECT DISTINCT ON (r.candidate_name, t.recruiter_id)
  r.candidate_name AS full_name,
  'candidate' AS type,
  t.recruiter_id AS created_by,
  MIN(r.created_at) OVER (PARTITION BY r.candidate_name, t.recruiter_id) AS created_at
FROM public.results r
JOIN public.tests t ON t.id = r.test_id
WHERE (r.candidate_email IS NULL OR r.candidate_email = '')
  AND r.candidate_name IS NOT NULL
  AND r.candidate_name != ''
  AND r.person_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.persons p
    WHERE p.full_name = r.candidate_name
      AND p.email IS NULL
      AND p.created_by = t.recruiter_id
  )
ORDER BY r.candidate_name, t.recruiter_id, r.submitted_at DESC;

-- Step 3: Backfill results.person_id using email match
UPDATE public.results
SET person_id = p.id
FROM public.persons p, public.tests t
WHERE public.results.test_id = t.id
  AND public.results.candidate_email IS NOT NULL
  AND public.results.candidate_email != ''
  AND public.results.person_id IS NULL
  AND p.email = public.results.candidate_email
  AND p.created_by = t.recruiter_id;

-- Step 4: Backfill results.person_id using name match (no email)
UPDATE public.results
SET person_id = p.id
FROM public.persons p, public.tests t
WHERE public.results.test_id = t.id
  AND (public.results.candidate_email IS NULL OR public.results.candidate_email = '')
  AND public.results.candidate_name IS NOT NULL
  AND public.results.candidate_name != ''
  AND public.results.person_id IS NULL
  AND p.full_name = public.results.candidate_name
  AND p.email IS NULL
  AND p.created_by = t.recruiter_id;
