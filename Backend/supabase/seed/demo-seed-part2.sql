-- =============================================================================
--  Dữ liệu ảo, phần 2: tuyển dụng và lượng dùng AI
-- =============================================================================
--  Chạy SAU demo-seed.sql, vì phần này tham chiếu tới người đã tạo ở phần 1 và
--  dùng các hàm trong schema demo_seed do phần 1 tạo ra.
--
--      psql "$DATABASE_URL" -f demo-seed.sql
--      psql "$DATABASE_URL" -f demo-seed-part2.sql
-- =============================================================================

begin;

-- ── Mô tả công việc ─────────────────────────────────────────────────────────
insert into public.job_descriptions
  (id, title, role_key, department, seniority, required_skills, full_text,
   auto_reject_threshold, is_active, created_by, created_at)
select demo_seed.did(12, n), title, key, dept, sen,
       skills::jsonb,
       'Mô tả công việc mẫu cho vị trí ' || title || '. Nội dung chỉ dùng để xem giao diện.',
       thr, true, demo_seed.owner(), now() - (age || ' days')::interval
from (values
  (1,'Lập trình viên Frontend (React)','frontend','Kỹ thuật','middle',
     '["TypeScript","React","Next.js","Kiểm thử tự động"]', 55, 240),
  (2,'Lập trình viên Backend (Node)','backend','Kỹ thuật','middle',
     '["TypeScript","PostgreSQL","Docker","Kiểm thử tự động"]', 60, 200),
  (3,'Kỹ sư dữ liệu','data','Kỹ thuật','senior',
     '["Python","PostgreSQL","Docker","Phân tích dữ liệu"]', 65, 165),
  (4,'Chuyên viên phân tích nghiệp vụ','ba','Sản phẩm','middle',
     '["Đặc tả yêu cầu","Vẽ quy trình","Phân tích dữ liệu","Trình bày"]', 50, 130),
  (5,'Kỹ sư kiểm thử','qa','Chất lượng','junior',
     '["Kiểm thử tự động","Vẽ quy trình","Viết tài liệu"]', 45, 80)
) as t(n, title, key, dept, sen, skills, thr, age)
on conflict (id) do nothing;

-- ── Hồ sơ CV của 22 ứng viên ────────────────────────────────────────────────
-- parse_status để lẫn cả COMPLETED, PROCESSING và FAILED, nhờ vậy thẻ
-- "CV đã phân tích" và bộ lọc trạng thái CV trên /recruitment mới có ý nghĩa.
insert into public.candidate_cvs
  (id, person_id, storage_path, original_filename, mime_type, parse_status,
   detected_language, uploaded_by, uploaded_at, parsed_info)
select demo_seed.did(13, n), demo_seed.did(6, n),
       'demo/cv/' || n || '.pdf',
       replace(p.full_name, ' ', '_') || '_CV.pdf',
       'application/pdf',
       case demo_seed.rnd('n_53:' || (n * 53), 0, 9)
         when 0 then 'FAILED' when 1 then 'PROCESSING'
         when 2 then 'PENDING' else 'COMPLETED' end,
       'vi', demo_seed.owner(),
       now() - (demo_seed.rnd('n_59:' || (n * 59), 1, 60) || ' days')::interval,
       jsonb_build_object('years_experience', demo_seed.rnd('n_61:' || (n * 61), 0, 9),
                          'note', 'Dữ liệu mẫu để xem giao diện')
from generate_series(27, 48) n
join public.persons p on p.id = demo_seed.did(6, n)
on conflict (id) do nothing;

-- ── Đơn ứng tuyển ───────────────────────────────────────────────────────────
-- Phân bố trạng thái cố ý hình phễu: đông ở đầu, thưa dần về cuối, để vòng tròn
-- "Theo bước tuyển dụng" và bảng kanban trên /recruitment nhìn hợp lý.
insert into public.job_applications
  (id, person_id, job_description_id, cv_id, pipeline_status, created_by, created_at, updated_at)
select demo_seed.did(14, n), demo_seed.did(6, n),
       demo_seed.did(12, 1 + demo_seed.rnd('n_67:' || (n * 67), 0, 4)),
       demo_seed.did(13, n),
       (case
          when k < 22 then 'NEW'
          when k < 40 then 'SCREENED'
          when k < 55 then 'SHORTLISTED'
          when k < 68 then 'INTERVIEW_SCHEDULED'
          when k < 79 then 'INTERVIEWED'
          when k < 88 then 'PASSED'
          when k < 94 then 'OFFERED'
          else 'REJECTED' end)::public.pipeline_status,
       demo_seed.owner(), created, created
from (
  select n,
         demo_seed.rnd('n_71:' || (n * 71), 0, 99) k,
         now() - (demo_seed.rnd('n_73:' || (n * 73), 1, 55) || ' days')::interval created
  from generate_series(27, 48) n
) g
on conflict (id) do nothing;

-- ── Điểm sàng lọc do AI chấm ────────────────────────────────────────────────
insert into public.candidate_screenings
  (id, job_application_id, ai_score, final_score, skill_match_score,
   experience_match_score, domain_match_score, summary, recommendation,
   ai_provider, ai_model, is_overridden, screened_at)
select demo_seed.did(15, n), demo_seed.did(14, n),
       s, s,
       greatest(0, least(100, s + demo_seed.rnd('n_79:' || (n * 79), -8, 8))),
       greatest(0, least(100, s + demo_seed.rnd('n_83:' || (n * 83), -12, 10))),
       greatest(0, least(100, s + demo_seed.rnd('n_89:' || (n * 89), -6, 12))),
       'Tóm tắt mẫu: ứng viên khớp phần lớn yêu cầu chính của vị trí.',
       -- ràng buộc check_recommendation chỉ nhận đúng 4 giá trị này
       case when s >= 85 then 'STRONG_HIRE'
            when s >= 70 then 'HIRE'
            when s >= 50 then 'MAYBE'
            else 'NO_HIRE' end,
       'gemini', 'gemini-3.6-flash',
       demo_seed.rnd('n_97:' || (n * 97), 0, 9) = 0,
       now() - (demo_seed.rnd('n_101:' || (n * 101), 1, 50) || ' days')::interval
from (
  select n, demo_seed.rnd('n_103:' || (n * 103), 34, 93) s from generate_series(27, 48) n
) g
where exists (select 1 from public.job_applications where id = demo_seed.did(14, n))
on conflict (id) do nothing;

-- nối đơn ứng tuyển tới bản sàng lọc tương ứng
update public.job_applications a
   set current_screening_id = demo_seed.did(15, n)
  from generate_series(27, 48) n
 where a.id = demo_seed.did(14, n)
   and exists (select 1 from public.candidate_screenings where id = demo_seed.did(15, n));

-- ── Lịch phỏng vấn ──────────────────────────────────────────────────────────
-- Lưu ý: trang /dashboard/recruitment/sessions đọc bảng `interview_sessions`
-- chứ không đọc bảng này, mà bảng đó chưa tồn tại trong DB. Phần dưới nuôi màn
-- Interview Room, không nuôi trang Lịch phỏng vấn.
insert into public.interview_schedules
  (id, job_application_id, interviewer_id, scheduled_at, timezone, recruiter_note,
   status, interviewer_status, created_by, created_at)
select demo_seed.did(16, n), demo_seed.did(14, n), demo_seed.owner(),
       sched, 'Asia/Ho_Chi_Minh',
       'Buổi phỏng vấn mẫu, dùng để xem giao diện.',
       case when sched < now() then 'completed' else 'scheduled' end,
       case demo_seed.rnd('n_107:' || (n * 107), 0, 4)
         when 0 then 'pending' when 1 then 'declined' else 'accepted' end,
       demo_seed.owner(), now() - interval '20 days'
from (
  select n, now() + ((demo_seed.rnd('n_109:' || (n * 109), -20, 18)) || ' days')::interval
              + ((demo_seed.rnd('n_113:' || (n * 113), 8, 17)) || ' hours')::interval sched
  from generate_series(27, 48) n
) g
where exists (
  select 1 from public.job_applications
   where id = demo_seed.did(14, n)
     and pipeline_status in ('INTERVIEW_SCHEDULED','INTERVIEWED','PASSED','OFFERED'))
on conflict (id) do nothing;

-- ── Lượng token AI đã dùng, 30 ngày ─────────────────────────────────────────
-- Nuôi biểu đồ token và bảng chia theo tính năng ở chế độ Quản trị.
insert into public.ai_usage
  (id, user_id, feature, model, tokens_in, tokens_out, cost_estimate, created_at)
select demo_seed.did(17, d * 10 + f), demo_seed.owner(), feat, 'gemini-3.6-flash',
       ti, tout, round((ti * 0.000001 + tout * 0.000004)::numeric, 6),
       date_trunc('day', now()) - ((d - 1) || ' days')::interval
                                + (demo_seed.rnd('d_f_127:' || (d * f * 127), 8, 19) || ' hours')::interval
from generate_series(1, 30) d
cross join lateral (
  select f, feat,
         demo_seed.rnd('d_131_f_17:' || (d * 131 + f * 17), 900, 14000) ti,
         demo_seed.rnd('d_137_f_19:' || (d * 137 + f * 19), 300, 4200) tout
  from (values (1,'cv_analyze'),(2,'question_gen'),(3,'result_analysis'),
               (4,'jd_extract'),(5,'report_summary')) as x(f, feat)
  where demo_seed.rnd('d_139_f:' || (d * 139 + f), 0, 9) < 8       -- vài ngày không dùng hết tính năng
) q
on conflict (id) do nothing;

commit;

-- Đếm lại để biết đã vào bao nhiêu.
select 'skills' t, count(*) from public.skills where id::text like 'ddd0%'
union all select 'positions', count(*) from public.positions where id::text like 'ddd0%'
union all select 'groups', count(*) from public.groups where id::text like 'ddd0%'
union all select 'persons', count(*) from public.persons where id::text like 'ddd0%'
union all select 'tests', count(*) from public.tests where id::text like 'ddd0%'
union all select 'results', count(*) from public.results where id::text like 'ddd0%'
union all select 'skill_evaluations', count(*) from public.skill_evaluations where id::text like 'ddd0%'
union all select 'job_descriptions', count(*) from public.job_descriptions where id::text like 'ddd0%'
union all select 'job_applications', count(*) from public.job_applications where id::text like 'ddd0%'
union all select 'interview_schedules', count(*) from public.interview_schedules where id::text like 'ddd0%'
union all select 'ai_usage', count(*) from public.ai_usage where id::text like 'ddd0%'
order by 1;
