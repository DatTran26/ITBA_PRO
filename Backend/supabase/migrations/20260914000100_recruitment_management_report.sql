-- Management report snapshot for HR/admin. The API supplies p_owner_id for HR
-- so all aggregate values use the same ownership predicate as detail rows.
create or replace function public.recruitment_management_report(
  from_date timestamptz,
  to_date timestamptz,
  p_jd_id uuid default null,
  p_department text default null,
  p_owner_id uuid default null
)
returns jsonb
language sql
security definer
set search_path = public
as $$
with scoped_apps as (
  select
    ja.id,
    ja.created_at,
    ja.updated_at,
    ja.cv_id,
    ja.pipeline_status::text as pipeline_status,
    jd.id as job_description_id,
    coalesce(jd.title, 'Chưa gắn JD') as job_title,
    coalesce(jd.department, 'Chưa phân loại') as department,
    cs.ai_score,
    cs.final_score
  from public.job_applications ja
  left join public.job_descriptions jd on jd.id = ja.job_description_id
  left join public.candidate_screenings cs on cs.id = ja.current_screening_id
  where ja.created_at >= from_date
    and ja.created_at <= to_date
    and (p_jd_id is null or ja.job_description_id = p_jd_id)
    and (p_department is null or jd.department = p_department)
    and (p_owner_id is null or ja.created_by = p_owner_id)
),
status_values(ord, status) as (
  values
    (1, 'NEW'),
    (2, 'SCREENED'),
    (3, 'REJECTED'),
    (4, 'SHORTLISTED'),
    (5, 'INTERVIEW_SCHEDULED'),
    (6, 'INTERVIEWED'),
    (7, 'PASSED'),
    (8, 'FAILED'),
    (9, 'OFFERED'),
    (10, 'ACCEPTED'),
    (11, 'OFFER_REJECTED'),
    (12, 'ONBOARDED')
),
status_counts as (
  select pipeline_status, count(*) as count_value
  from scoped_apps
  group by pipeline_status
),
status_json as (
  select coalesce(
    jsonb_object_agg(
      sv.status,
      coalesce(sc.count_value, 0)
      order by sv.ord
    ),
    '{}'::jsonb
  ) as value
  from status_values sv
  left join status_counts sc on sc.pipeline_status = sv.status
),
time_to_hire as (
  select
    s.id,
    extract(
      epoch from (
        coalesce(
          min(h.changed_at) filter (where h.to_status::text = 'ONBOARDED'),
          s.updated_at
        ) - s.created_at
      )
    ) / 86400.0 as days
  from scoped_apps s
  left join public.candidate_status_history h on h.job_application_id = s.id
  where s.pipeline_status = 'ONBOARDED'
  group by s.id, s.created_at, s.updated_at
),
time_stats as (
  select
    round(avg(days)::numeric, 1) as average_days,
    round((percentile_cont(0.5) within group (order by days))::numeric, 1) as median_days
  from time_to_hire
),
breakdown_rows as (
  select
    s.job_description_id,
    s.job_title,
    s.department,
    count(*) as applications,
    count(*) filter (where s.pipeline_status in (
      'SCREENED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED',
      'PASSED', 'FAILED', 'OFFERED', 'ACCEPTED', 'OFFER_REJECTED', 'ONBOARDED'
    )) as screened,
    count(*) filter (where s.pipeline_status in (
      'INTERVIEWED', 'PASSED', 'FAILED', 'OFFERED', 'ACCEPTED',
      'OFFER_REJECTED', 'ONBOARDED'
    )) as interviewed,
    count(*) filter (where s.pipeline_status = 'ONBOARDED') as onboarded,
    case
      when count(*) filter (where s.pipeline_status in (
        'INTERVIEWED', 'PASSED', 'FAILED', 'OFFERED', 'ACCEPTED',
        'OFFER_REJECTED', 'ONBOARDED'
      )) = 0 then 0
      else round(
        count(*) filter (where s.pipeline_status in ('PASSED', 'OFFERED', 'ACCEPTED', 'ONBOARDED'))::numeric
        / count(*) filter (where s.pipeline_status in (
          'INTERVIEWED', 'PASSED', 'FAILED', 'OFFERED', 'ACCEPTED',
          'OFFER_REJECTED', 'ONBOARDED'
        )) * 100,
        1
      )
    end as pass_rate,
    case
      when count(*) filter (where s.pipeline_status in ('OFFERED', 'ACCEPTED', 'OFFER_REJECTED')) = 0 then 0
      else round(
        count(*) filter (where s.pipeline_status in ('ACCEPTED', 'ONBOARDED'))::numeric
        / count(*) filter (where s.pipeline_status in ('OFFERED', 'ACCEPTED', 'OFFER_REJECTED')) * 100,
        1
      )
    end as offer_acceptance_rate,
    round(avg(t.days)::numeric, 1) as avg_time_to_hire_days
  from scoped_apps s
  left join time_to_hire t on t.id = s.id
  group by s.job_description_id, s.job_title, s.department
),
breakdowns_json as (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'jobDescriptionId', job_description_id,
        'jobTitle', job_title,
        'department', department,
        'applications', applications,
        'screened', screened,
        'interviewed', interviewed,
        'onboarded', onboarded,
        'passRate', pass_rate,
        'offerAcceptanceRate', offer_acceptance_rate,
        'avgTimeToHireDays', avg_time_to_hire_days
      )
      order by applications desc, job_title
    ),
    '[]'::jsonb
  ) as value
  from breakdown_rows
),
trend_rows as (
  select
    to_char(date_trunc('month', created_at at time zone 'Asia/Ho_Chi_Minh'), 'YYYY-MM') as month,
    count(*) as applications,
    count(*) filter (where pipeline_status in (
      'SCREENED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED',
      'PASSED', 'FAILED', 'OFFERED', 'ACCEPTED', 'OFFER_REJECTED', 'ONBOARDED'
    )) as screened,
    count(*) filter (where pipeline_status in (
      'INTERVIEWED', 'PASSED', 'FAILED', 'OFFERED', 'ACCEPTED',
      'OFFER_REJECTED', 'ONBOARDED'
    )) as interviewed,
    count(*) filter (where pipeline_status = 'ONBOARDED') as onboarded
  from scoped_apps
  group by date_trunc('month', created_at at time zone 'Asia/Ho_Chi_Minh')
),
trend_json as (
  select coalesce(
    jsonb_agg(
      jsonb_build_object(
        'month', month,
        'applications', applications,
        'screened', screened,
        'interviewed', interviewed,
        'onboarded', onboarded
      )
      order by month
    ),
    '[]'::jsonb
  ) as value
  from trend_rows
)
select jsonb_build_object(
  'totalApplications', (select count(*) from scoped_apps),
  'totalCvsUploaded', (select count(distinct cv_id) from scoped_apps where cv_id is not null),
  'screenedApplications', (select count(*) from scoped_apps where pipeline_status in (
    'SCREENED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'INTERVIEWED',
    'PASSED', 'FAILED', 'OFFERED', 'ACCEPTED', 'OFFER_REJECTED', 'ONBOARDED'
  )),
  'interviewedApplications', (select count(*) from scoped_apps where pipeline_status in (
    'INTERVIEWED', 'PASSED', 'FAILED', 'OFFERED', 'ACCEPTED',
    'OFFER_REJECTED', 'ONBOARDED'
  )),
  'onboardedApplications', (select count(*) from scoped_apps where pipeline_status = 'ONBOARDED'),
  'byStatus', (select value from status_json),
  'avgAiScore', (select coalesce(round(avg(ai_score)::numeric, 1), 0) from scoped_apps where ai_score is not null),
  'passRate', (
    select case
      when count(*) filter (where pipeline_status in (
        'INTERVIEWED', 'PASSED', 'FAILED', 'OFFERED', 'ACCEPTED',
        'OFFER_REJECTED', 'ONBOARDED'
      )) = 0 then 0
      else round(
        count(*) filter (where pipeline_status in ('PASSED', 'OFFERED', 'ACCEPTED', 'ONBOARDED'))::numeric
        / count(*) filter (where pipeline_status in (
          'INTERVIEWED', 'PASSED', 'FAILED', 'OFFERED', 'ACCEPTED',
          'OFFER_REJECTED', 'ONBOARDED'
        )) * 100,
        1
      )
    end
    from scoped_apps
  ),
  'offerAcceptanceRate', (
    select case
      when count(*) filter (where pipeline_status in ('OFFERED', 'ACCEPTED', 'OFFER_REJECTED')) = 0 then 0
      else round(
        count(*) filter (where pipeline_status in ('ACCEPTED', 'ONBOARDED'))::numeric
        / count(*) filter (where pipeline_status in ('OFFERED', 'ACCEPTED', 'OFFER_REJECTED')) * 100,
        1
      )
    end
    from scoped_apps
  ),
  'avgTimeToHireDays', (select average_days from time_stats),
  'medianTimeToHireDays', (select median_days from time_stats),
  'processingQueue', (
    select count(distinct cv.id)
    from public.candidate_cvs cv
    join scoped_apps s on s.cv_id = cv.id
    where cv.parse_status in ('PENDING', 'PROCESSING')
  ),
  'breakdowns', (select value from breakdowns_json),
  'trend', (select value from trend_json)
);
$$;

revoke all on function public.recruitment_management_report(timestamptz, timestamptz, uuid, text, uuid) from public;
grant execute on function public.recruitment_management_report(timestamptz, timestamptz, uuid, text, uuid) to service_role;
