-- Fix: recruitment_dashboard's funnel subquery compared the
-- pipeline_status enum column directly to a text value
-- ("pipeline_status = stage::text"), which Postgres rejects with
-- "operator does not exist: pipeline_status = text". Cast the enum
-- side to text instead so both operands match.
create or replace function recruitment_dashboard(
  from_date timestamptz default now() - interval '30 days',
  to_date   timestamptz default now(),
  p_jd_id   uuid        default null
)
returns jsonb
language plpgsql
security definer
as $$
declare
  v_result jsonb;
begin
  select jsonb_build_object(
    'totalCvsUploaded',
    (select count(*) from candidate_cvs
     where uploaded_at between from_date and to_date),

    'byStatus',
    (select jsonb_object_agg(pipeline_status, cnt)
     from (
       select pipeline_status, count(*) as cnt
       from job_applications
       where created_at between from_date and to_date
         and (p_jd_id is null or job_description_id = p_jd_id)
       group by pipeline_status
     ) s),

    'avgAiScore',
    (select coalesce(round(avg(cs.ai_score)::numeric, 1), 0)
     from candidate_screenings cs
     join job_applications ja on ja.current_screening_id = cs.id
     where ja.created_at between from_date and to_date
       and (p_jd_id is null or ja.job_description_id = p_jd_id)
       and cs.ai_score is not null),

    'passRate',
    (select case
       when count(*) filter (where pipeline_status in ('INTERVIEWED','PASSED','FAILED','OFFERED','ACCEPTED','OFFER_REJECTED','ONBOARDED')) = 0 then 0
       else round(
         count(*) filter (where pipeline_status in ('PASSED','OFFERED','ACCEPTED','ONBOARDED'))::numeric /
         count(*) filter (where pipeline_status in ('INTERVIEWED','PASSED','FAILED','OFFERED','ACCEPTED','OFFER_REJECTED','ONBOARDED')) * 100,
         1)
     end
     from job_applications
     where created_at between from_date and to_date
       and (p_jd_id is null or job_description_id = p_jd_id)),

    'offerAcceptanceRate',
    (select case
       when count(*) filter (where pipeline_status in ('OFFERED','ACCEPTED','OFFER_REJECTED')) = 0 then 0
       else round(
         count(*) filter (where pipeline_status in ('ACCEPTED','ONBOARDED'))::numeric /
         count(*) filter (where pipeline_status in ('OFFERED','ACCEPTED','OFFER_REJECTED')) * 100,
         1)
     end
     from job_applications
     where created_at between from_date and to_date
       and (p_jd_id is null or job_description_id = p_jd_id)),

    'funnel',
    (select jsonb_agg(jsonb_build_object('stage', stage, 'count', cnt) order by ord)
     from (
       values
         (1,'NEW'), (2,'SCREENED'), (3,'SHORTLISTED'),
         (4,'INTERVIEW_SCHEDULED'), (5,'INTERVIEWED'),
         (6,'PASSED'), (7,'OFFERED'), (8,'ONBOARDED')
     ) stages(ord, stage)
     left join lateral (
       select count(*) as cnt
       from job_applications
       where pipeline_status::text = stage
         and created_at between from_date and to_date
         and (p_jd_id is null or job_description_id = p_jd_id)
     ) counts on true),

    'processingQueue',
    (select count(*) from candidate_cvs
     where parse_status in ('PENDING','PROCESSING'))
  ) into v_result;

  return v_result;
end;
$$;
