-- =============================================================================
--  Gỡ toàn bộ dữ liệu ảo
-- =============================================================================
--  Chỉ xoá những dòng do demo-seed.sql và demo-seed-part2.sql tạo ra: mọi id của
--  chúng đều bắt đầu bằng 'ddd0'. Dữ liệu thật không có tiền tố này nên không bị
--  đụng tới. Chạy lại nhiều lần được.
--
--      psql "$DATABASE_URL" -f demo-cleanup.sql
-- =============================================================================

begin;

-- Xoá theo thứ tự ngược với khoá ngoại: con trước, cha sau.

-- gỡ tham chiếu vòng giữa job_applications và candidate_screenings trước
update public.job_applications set current_screening_id = null
 where id::text like 'ddd0%';

delete from public.ai_usage             where id::text like 'ddd0%';
delete from public.interview_schedules  where id::text like 'ddd0%';
delete from public.candidate_screenings where id::text like 'ddd0%';
delete from public.job_applications     where id::text like 'ddd0%';
delete from public.candidate_cvs        where id::text like 'ddd0%';
delete from public.job_descriptions     where id::text like 'ddd0%';

delete from public.skill_evaluations    where id::text like 'ddd0%';
delete from public.results              where id::text like 'ddd0%';
delete from public.questions            where id::text like 'ddd0%';
delete from public.tests                where id::text like 'ddd0%';

delete from public.person_skills        where id::text like 'ddd0%';
delete from public.group_members        where id::text like 'ddd0%';
delete from public.groups               where id::text like 'ddd0%';
delete from public.position_skill_requirements where id::text like 'ddd0%';
delete from public.persons              where id::text like 'ddd0%';
delete from public.positions            where id::text like 'ddd0%';
delete from public.skills               where id::text like 'ddd0%';
delete from public.skill_categories     where id::text like 'ddd0%';

-- hàm phụ trợ nằm gọn trong schema riêng nên drop là sạch
drop schema if exists demo_seed cascade;

commit;

-- Còn sót gì không.
select 'persons' t, count(*) from public.persons where id::text like 'ddd0%'
union all select 'results', count(*) from public.results where id::text like 'ddd0%'
union all select 'job_applications', count(*) from public.job_applications where id::text like 'ddd0%'
union all select 'ai_usage', count(*) from public.ai_usage where id::text like 'ddd0%'
order by 1;
