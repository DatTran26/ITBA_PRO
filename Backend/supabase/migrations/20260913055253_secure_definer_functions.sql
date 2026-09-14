-- The dashboard aggregate bypasses RLS, so it must authorize before reading
-- recruitment data and never be callable by anonymous clients.
CREATE OR REPLACE FUNCTION public.recruitment_dashboard(
  from_date timestamptz DEFAULT now() - interval '30 days',
  to_date timestamptz DEFAULT now(),
  p_jd_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_internal_user() THEN
    RAISE EXCEPTION 'not_authorized' USING ERRCODE = '42501';
  END IF;

  SELECT jsonb_build_object(
    'totalCvsUploaded',
    (SELECT count(*) FROM candidate_cvs
     WHERE uploaded_at BETWEEN from_date AND to_date),

    'byStatus',
    (SELECT jsonb_object_agg(pipeline_status, cnt)
     FROM (
       SELECT pipeline_status, count(*) AS cnt
       FROM job_applications
       WHERE created_at BETWEEN from_date AND to_date
         AND (p_jd_id IS NULL OR job_description_id = p_jd_id)
       GROUP BY pipeline_status
     ) s),

    'avgAiScore',
    (SELECT coalesce(round(avg(cs.ai_score)::numeric, 1), 0)
     FROM candidate_screenings cs
     JOIN job_applications ja ON ja.current_screening_id = cs.id
     WHERE ja.created_at BETWEEN from_date AND to_date
       AND (p_jd_id IS NULL OR ja.job_description_id = p_jd_id)
       AND cs.ai_score IS NOT NULL),

    'passRate',
    (SELECT CASE
       WHEN count(*) FILTER (WHERE pipeline_status IN ('INTERVIEWED', 'PASSED', 'FAILED', 'OFFERED', 'ACCEPTED', 'OFFER_REJECTED', 'ONBOARDED')) = 0 THEN 0
       ELSE round(
         count(*) FILTER (WHERE pipeline_status IN ('PASSED', 'OFFERED', 'ACCEPTED', 'ONBOARDED'))::numeric /
         count(*) FILTER (WHERE pipeline_status IN ('INTERVIEWED', 'PASSED', 'FAILED', 'OFFERED', 'ACCEPTED', 'OFFER_REJECTED', 'ONBOARDED')) * 100,
         1)
     END
     FROM job_applications
     WHERE created_at BETWEEN from_date AND to_date
       AND (p_jd_id IS NULL OR job_description_id = p_jd_id)),

    'offerAcceptanceRate',
    (SELECT CASE
       WHEN count(*) FILTER (WHERE pipeline_status IN ('OFFERED', 'ACCEPTED', 'OFFER_REJECTED')) = 0 THEN 0
       ELSE round(
         count(*) FILTER (WHERE pipeline_status IN ('ACCEPTED', 'ONBOARDED'))::numeric /
         count(*) FILTER (WHERE pipeline_status IN ('OFFERED', 'ACCEPTED', 'OFFER_REJECTED')) * 100,
         1)
     END
     FROM job_applications
     WHERE created_at BETWEEN from_date AND to_date
       AND (p_jd_id IS NULL OR job_description_id = p_jd_id)),

    'funnel',
    (SELECT jsonb_agg(jsonb_build_object('stage', stage, 'count', cnt) ORDER BY ord)
     FROM (
       VALUES
         (1, 'NEW'), (2, 'SCREENED'), (3, 'SHORTLISTED'),
         (4, 'INTERVIEW_SCHEDULED'), (5, 'INTERVIEWED'),
         (6, 'PASSED'), (7, 'OFFERED'), (8, 'ONBOARDED')
     ) stages(ord, stage)
     LEFT JOIN LATERAL (
       SELECT count(*) AS cnt
       FROM job_applications
       WHERE pipeline_status::text = stage
         AND created_at BETWEEN from_date AND to_date
         AND (p_jd_id IS NULL OR job_description_id = p_jd_id)
     ) counts ON true),

    'processingQueue',
    (SELECT count(*) FROM candidate_cvs
     WHERE parse_status IN ('PENDING', 'PROCESSING'))
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.recruitment_dashboard(timestamptz, timestamptz, uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recruitment_dashboard(timestamptz, timestamptz, uuid) FROM anon;
GRANT EXECUTE ON FUNCTION public.recruitment_dashboard(timestamptz, timestamptz, uuid) TO authenticated;
