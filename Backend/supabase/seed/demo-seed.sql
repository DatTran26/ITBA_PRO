-- =============================================================================
--  Dữ liệu ảo để xem giao diện
-- =============================================================================
--  Mục đích: DB đang rỗng hoàn toàn nên không đánh giá được bố cục mới. File này
--  đổ vào một bộ dữ liệu trông như thật để các thẻ số và biểu đồ có gì mà vẽ.
--
--  Chạy:   psql "$DATABASE_URL" -f demo-seed.sql
--          psql "$DATABASE_URL" -f demo-seed-part2.sql
--  Xoá:    psql "$DATABASE_URL" -f demo-cleanup.sql
--
--  File này lo phần nền: kỹ năng, vị trí, nhóm, người, bài test và kết quả.
--  Phần 2 lo tuyển dụng và lượng dùng AI, phải chạy sau vì dùng chung các hàm
--  trong schema demo_seed do file này tạo.
--
--  Mọi dòng do file này tạo ra đều có id bắt đầu bằng 'ddd0', nên file xoá kèm
--  theo gỡ được sạch mà không đụng tới dữ liệu thật. Chạy lại nhiều lần được:
--  toàn bộ insert đều ON CONFLICT DO NOTHING.
--
--  KHÔNG seed được: bảng `interview_sessions` chưa tồn tại trong DB này
--  (migration 20260506000000_interview_sessions.sql chưa chạy), nên trang
--  /dashboard/recruitment/sessions vẫn trống sau khi chạy file này.
-- =============================================================================

begin;

-- Hàm phụ trợ để riêng một schema, file xoá chỉ cần drop schema này là sạch.
create schema if not exists demo_seed;

-- Gắn mọi thứ vào tài khoản đang có. Dashboard lọc tests theo recruiter_id với
-- mọi role khác 'admin', kể cả super_admin, nên phải dùng đúng id này.
create or replace function demo_seed.owner() returns uuid language sql stable as $$
  select id from public.users order by created_at limit 1;
$$;

-- Sinh uuid ổn định: cùng (nhóm, số thứ tự) thì luôn ra cùng một id.
create or replace function demo_seed.did(grp int, n int) returns uuid language sql immutable as $$
  select ('ddd0' || lpad(grp::text, 4, '0') || '-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid;
$$;

-- Số giả ngẫu nhiên nhưng cố định theo hạt giống, để mỗi lần chạy ra cùng kết quả.
--
-- Hạt giống là chuỗi và mỗi chỗ gọi truyền một nhãn riêng ('n_11:' || n), rồi
-- băm qua md5. Bản đầu nhận số nguyên và chỉ nhân hệ số lên cùng một biến
-- (n*11 chỗ này, n*23 chỗ kia) nên các bit thấp của hai lần gọi bị tương quan:
-- kết quả là toàn bộ bài thi "chưa có phân tích AI" rơi hết vào bài test nhân
-- viên, khiến một thẻ số của dashboard luôn bằng 0.
create or replace function demo_seed.rnd(seed text, lo int, hi int) returns int language sql immutable as $$
  select lo + (abs(hashtext(md5(seed))) % greatest(1, hi - lo + 1));
$$;

-- ── Nhóm kỹ năng ────────────────────────────────────────────────────────────
insert into public.skill_categories (id, name, description, display_order) values
  (demo_seed.did(1,1), 'Kỹ thuật',        'Ngôn ngữ, framework, hạ tầng', 1),
  (demo_seed.did(1,2), 'Phân tích nghiệp vụ', 'Đặc tả, quy trình, dữ liệu', 2),
  (demo_seed.did(1,3), 'Giao tiếp',       'Trình bày, viết tài liệu, làm việc nhóm', 3),
  (demo_seed.did(1,4), 'Quản lý',         'Dẫn dắt, ước lượng, kèm cặp', 4)
on conflict (id) do nothing;

-- ── Kỹ năng ─────────────────────────────────────────────────────────────────
insert into public.skills (id, name, category, category_id, description, created_by)
select demo_seed.did(2, n), name, cat, demo_seed.did(1, cat_n), descr, demo_seed.owner()
from (values
  (1,  'TypeScript',        'Kỹ thuật', 1, 'Kiểu tĩnh, generic, cấu hình tsconfig'),
  (2,  'React',             'Kỹ thuật', 1, 'Hook, quản lý trạng thái, tối ưu render'),
  (3,  'Next.js',           'Kỹ thuật', 1, 'App Router, server component, caching'),
  (4,  'PostgreSQL',        'Kỹ thuật', 1, 'Thiết kế bảng, chỉ mục, tối ưu truy vấn'),
  (5,  'Python',            'Kỹ thuật', 1, 'Xử lý dữ liệu, script, FastAPI'),
  (6,  'Docker',            'Kỹ thuật', 1, 'Đóng gói, compose, triển khai'),
  (7,  'Kiểm thử tự động',  'Kỹ thuật', 1, 'Unit, integration, e2e'),
  (8,  'Đặc tả yêu cầu',    'Phân tích nghiệp vụ', 2, 'User story, tiêu chí chấp nhận'),
  (9,  'Vẽ quy trình',      'Phân tích nghiệp vụ', 2, 'BPMN, sơ đồ luồng, phân rã'),
  (10, 'Phân tích dữ liệu', 'Phân tích nghiệp vụ', 2, 'SQL, bảng tính, đọc số'),
  (11, 'Trình bày',         'Giao tiếp', 3, 'Thuyết trình, bảo vệ phương án'),
  (12, 'Viết tài liệu',     'Giao tiếp', 3, 'Tài liệu kỹ thuật, ghi chú quyết định'),
  (13, 'Ước lượng công việc','Quản lý', 4, 'Chia nhỏ, dự trù rủi ro'),
  (14, 'Kèm cặp',           'Quản lý', 4, 'Hướng dẫn người mới, review code')
) as t(n, name, cat, cat_n, descr)
on conflict (id) do nothing;

-- ── Vị trí ──────────────────────────────────────────────────────────────────
insert into public.positions (id, title, department, description, target_level, status, created_by)
select demo_seed.did(3, n), title, dept, descr, lvl, st, demo_seed.owner()
from (values
  (1, 'Lập trình viên Frontend',  'Kỹ thuật',   'Dựng giao diện sản phẩm web',        'middle', 'active'),
  (2, 'Lập trình viên Backend',   'Kỹ thuật',   'Dịch vụ, API và cơ sở dữ liệu',      'middle', 'active'),
  (3, 'Kỹ sư dữ liệu',            'Kỹ thuật',   'Đường ống dữ liệu và kho dữ liệu',   'senior', 'active'),
  (4, 'Chuyên viên phân tích nghiệp vụ', 'Sản phẩm', 'Cầu nối nghiệp vụ và kỹ thuật', 'middle', 'active'),
  (5, 'Kỹ sư kiểm thử',           'Chất lượng', 'Kiểm thử thủ công và tự động',       'junior', 'active'),
  (6, 'Trưởng nhóm kỹ thuật',     'Kỹ thuật',   'Dẫn dắt nhóm 5 tới 8 người',         'senior', 'review_needed')
) as t(n, title, dept, descr, lvl, st)
on conflict (id) do nothing;

-- ── Yêu cầu kỹ năng của từng vị trí ─────────────────────────────────────────
insert into public.position_skill_requirements
  (id, position_id, skill_id, required_level, is_mandatory, checklist_order)
select demo_seed.did(4, p * 100 + s), demo_seed.did(3, p), demo_seed.did(2, s),
       demo_seed.rnd('p_31_s:' || (p * 31 + s), 3, 5), s <= 3, s
from (values
  (1,1),(1,2),(1,3),(1,7),(1,12),
  (2,1),(2,4),(2,5),(2,6),(2,7),
  (3,4),(3,5),(3,6),(3,10),
  (4,8),(4,9),(4,10),(4,11),(4,12),
  (5,7),(5,9),(5,12),
  (6,2),(6,4),(6,13),(6,14),(6,11)
) as t(p, s)
on conflict (id) do nothing;

-- ── Nhóm ────────────────────────────────────────────────────────────────────
insert into public.groups (id, name, type, description, status, created_by)
select demo_seed.did(5, n), name, typ, descr, st, demo_seed.owner()
from (values
  (1, 'Nền tảng Web',        'department', 'Nhóm dựng và bảo trì sản phẩm web',    'healthy'),
  (2, 'Dữ liệu và Báo cáo',  'department', 'Đường ống dữ liệu, báo cáo vận hành',  'understaffed'),
  (3, 'Đợt tuyển Quý 3',     'batch',      'Ứng viên tuyển đợt tháng 7 tới 9',     'healthy'),
  (4, 'Chất lượng sản phẩm', 'department', 'Kiểm thử và quy trình phát hành',      'needs_attention'),
  (5, 'Dự án Cổng nội bộ',   'campaign',   'Nhóm ghép cho dự án cổng nhân sự',     'skill_risk')
) as t(n, name, typ, descr, st)
on conflict (id) do nothing;

-- ── Người: 26 nhân viên và 22 ứng viên ──────────────────────────────────────
-- Tên đặt đa dạng họ, không dùng kiểu "Nguyễn Văn A", để bảng nhìn như thật.
insert into public.persons
  (id, full_name, email, type, department, position_id, current_level,
   joined_date, phone, status, source, created_by)
select demo_seed.did(6, n), full_name, email, typ, dept,
       case when pos = 0 then null else demo_seed.did(3, pos) end,
       lvl, joined::date, phone, st, src, demo_seed.owner()
from (values
  -- nhân viên
  (1,'Đặng Minh Khuê','khue.dang@congty.vn','employee','Kỹ thuật',1,'middle','2024-03-11','0912 847 336','active','test'),
  (2,'Vũ Hoàng Nam','nam.vh@congty.vn','employee','Kỹ thuật',2,'senior','2022-08-01','0983 114 902','active','test'),
  (3,'Lý Thu Trang','trang.ly@congty.vn','employee','Sản phẩm',4,'middle','2024-01-15','0906 552 781','ready_for_promotion','test'),
  (4,'Phan Gia Bảo','bao.phan@congty.vn','employee','Kỹ thuật',1,'junior','2025-06-02','0977 203 648','training_needed','test'),
  (5,'Trịnh Khánh Linh','linh.trinh@congty.vn','employee','Chất lượng',5,'junior','2025-02-17','0934 668 129','active','test'),
  (6,'Hoàng Đức Duy','duy.hoang@congty.vn','employee','Kỹ thuật',3,'senior','2021-11-08','0968 471 305','active','test'),
  (7,'Bùi Ngọc Hân','han.bui@congty.vn','employee','Sản phẩm',4,'junior','2025-09-01','0917 038 554','in_review','test'),
  (8,'Đỗ Quang Huy','huy.do@congty.vn','employee','Kỹ thuật',2,'middle','2023-05-22','0902 776 431','skill_gap','test'),
  (9,'Ngô Phương Thảo','thao.ngo@congty.vn','employee','Kỹ thuật',1,'middle','2023-10-03','0945 819 260','active','test'),
  (10,'Cao Tuấn Kiệt','kiet.cao@congty.vn','employee','Kỹ thuật',6,'senior','2020-04-13','0989 330 177','active','test'),
  (11,'Dương Mai Anh','anh.duong@congty.vn','employee','Chất lượng',5,'middle','2024-07-29','0913 604 988','active','test'),
  (12,'Hồ Bảo Châu','chau.ho@congty.vn','employee','Dữ liệu',3,'middle','2024-02-05','0972 145 830','skill_gap','test'),
  (13,'Lâm Chí Thành','thanh.lam@congty.vn','employee','Kỹ thuật',2,'junior','2025-08-18','0901 927 463','training_needed','test'),
  (14,'Tạ Hồng Nhung','nhung.ta@congty.vn','employee','Sản phẩm',4,'senior','2022-01-24','0936 558 014','active','test'),
  (15,'Chu Đình Phong','phong.chu@congty.vn','employee','Kỹ thuật',1,'middle','2023-12-11','0967 240 731','active','test'),
  (16,'Mai Thuỳ Dương','duong.mai@congty.vn','employee','Dữ liệu',3,'junior','2025-04-07','0908 613 279','in_review','test'),
  (17,'Nghiêm Quốc Việt','viet.nghiem@congty.vn','employee','Kỹ thuật',2,'senior','2021-06-30','0978 442 158','active','test'),
  (18,'Tô Lan Chi','chi.to@congty.vn','employee','Chất lượng',5,'junior','2025-07-14','0949 807 326','active','test'),
  (19,'Kiều Anh Tuấn','tuan.kieu@congty.vn','employee','Kỹ thuật',6,'senior','2020-09-21','0986 059 743','on_hold','test'),
  (20,'Đinh Khả Ngân','ngan.dinh@congty.vn','employee','Sản phẩm',4,'middle','2024-05-06','0919 372 605','active','test'),
  (21,'Lều Hữu Đạt','dat.leu@congty.vn','employee','Kỹ thuật',1,'junior','2025-10-02','0903 884 517','training_needed','test'),
  (22,'Trương Diễm My','my.truong@congty.vn','employee','Dữ liệu',3,'middle','2023-08-28','0965 116 490','active','test'),
  (23,'Ưng Thanh Sơn','son.ung@congty.vn','employee','Kỹ thuật',2,'middle','2024-04-19','0974 653 208','skill_gap','test'),
  (24,'Quách Yến Vy','vy.quach@congty.vn','employee','Chất lượng',5,'middle','2023-03-09','0937 291 864','active','test'),
  (25,'Tống Nhật Minh','minh.tong@congty.vn','employee','Kỹ thuật',1,'senior','2022-05-16','0981 720 435','active','test'),
  (26,'Hà Bích Ngọc','ngoc.ha@congty.vn','employee','Sản phẩm',0,'junior','2025-09-23','0904 538 172','inactive','test'),
  -- ứng viên
  (27,'Nguyễn Trọng Tín','tin.nguyen89@gmail.com','candidate',null,0,null,null,'0912 336 704','in_review','recruitment'),
  (28,'Lại Thu Hiền','hienlai.work@gmail.com','candidate',null,0,null,null,'0968 224 951','in_review','recruitment'),
  (29,'Võ Thành Đạt','dat.vo.dev@gmail.com','candidate',null,0,null,null,'0903 771 428','active','recruitment'),
  (30,'Đoàn Hải Yến','yendoan.ba@gmail.com','candidate',null,0,null,null,'0947 508 213','in_review','recruitment'),
  (31,'Phạm Quốc Bảo','baopham.fe@gmail.com','candidate',null,0,null,null,'0975 643 190','active','recruitment'),
  (32,'Huỳnh Mỹ Duyên','duyenhuynh.qa@gmail.com','candidate',null,0,null,null,'0916 850 372','in_review','recruitment'),
  (33,'Trần Đăng Khoa','khoatran.data@gmail.com','candidate',null,0,null,null,'0982 417 605','active','recruitment'),
  (34,'Lê Tuyết Nhi','nhile.intern@gmail.com','candidate',null,0,null,null,'0935 129 748','on_hold','recruitment'),
  (35,'Nguyễn Hoàng Long','longnh.backend@gmail.com','candidate',null,0,null,null,'0907 364 821','active','recruitment'),
  (36,'Bạch Thanh Trúc','trucbach.ux@gmail.com','candidate',null,0,null,null,'0973 582 046','in_review','recruitment'),
  (37,'Đàm Việt Hùng','hungdam.ops@gmail.com','candidate',null,0,null,null,'0918 407 263','inactive','recruitment'),
  (38,'Thái Kim Oanh','oanhthai.hr@gmail.com','candidate',null,0,null,null,'0966 731 245','active','recruitment'),
  (39,'Giang Nhật Hào','haogiang.fs@gmail.com','candidate',null,0,null,null,'0901 248 937','in_review','recruitment'),
  (40,'Lục Phương Uyên','uyenluc.ba@gmail.com','candidate',null,0,null,null,'0984 615 370','active','recruitment'),
  (41,'Tôn Thất Bảo Long','longtt.arch@gmail.com','candidate',null,0,null,null,'0939 073 486','on_hold','recruitment'),
  (42,'Ninh Thảo Vy','vyninh.test@gmail.com','candidate',null,0,null,null,'0971 926 514','in_review','recruitment'),
  (43,'Âu Dương Khang','khangad.mobile@gmail.com','candidate',null,0,null,null,'0905 483 719','active','recruitment'),
  (44,'Hứa Gia Hân','hanhua.design@gmail.com','candidate',null,0,null,null,'0962 350 847','in_review','recruitment'),
  (45,'Từ Minh Quân','quantu.devops@gmail.com','candidate',null,0,null,null,'0914 796 258','active','recruitment'),
  (46,'Sử Khánh Vân','vansu.analyst@gmail.com','candidate',null,0,null,null,'0988 512 604','in_review','recruitment'),
  (47,'Bành Tấn Phát','phatbanh.qa@gmail.com','candidate',null,0,null,null,'0930 847 165','active','recruitment'),
  (48,'Ông Diệu Linh','linhong.pm@gmail.com','candidate',null,0,null,null,'0976 204 893','in_review','recruitment')
) as t(n, full_name, email, typ, dept, pos, lvl, joined, phone, st, src)
on conflict (id) do nothing;

-- ── Thành viên nhóm ─────────────────────────────────────────────────────────
insert into public.group_members (id, group_id, person_id)
select demo_seed.did(7, g * 1000 + p), demo_seed.did(5, g), demo_seed.did(6, p)
from (values
  (1,1),(1,4),(1,9),(1,15),(1,21),(1,25),
  (2,6),(2,12),(2,16),(2,22),
  (3,27),(3,28),(3,29),(3,30),(3,31),(3,32),(3,33),
  (4,5),(4,11),(4,18),(4,24),
  (5,2),(5,3),(5,10),(5,14),(5,20)
) as t(g, p)
on conflict (id) do nothing;

-- ── Kỹ năng hiện có của từng người ──────────────────────────────────────────
-- Cố ý để mức thấp hơn yêu cầu ở vài chỗ, nhờ vậy biểu đồ "Kỹ năng thiếu hụt"
-- trên /dashboard/skills mới có dữ liệu để vẽ.
insert into public.person_skills (id, person_id, skill_id, current_level)
select demo_seed.did(8, p * 100 + s), demo_seed.did(6, p), demo_seed.did(2, s),
       demo_seed.rnd('p_17_s_7:' || (p * 17 + s * 7), 1, 5)
from generate_series(1, 26) p
cross join lateral (
  select s from generate_series(1, 14) s
  where demo_seed.rnd('p_13_s_5:' || (p * 13 + s * 5), 0, 9) < 5      -- mỗi người khoảng 7 kỹ năng
) q
on conflict (id) do nothing;

-- ── Bài đánh giá ────────────────────────────────────────────────────────────
insert into public.tests
  (id, recruiter_id, job_role, level, share_token, status, time_limit_minutes,
   question_count, target_type, position_id, test_description, created_at)
select demo_seed.did(9, n), demo_seed.owner(), role, lvl,
       'demo-' || lpad(n::text, 3, '0'), st, mins, qn, tgt,
       case when pos = 0 then null else demo_seed.did(3, pos) end,
       descr, now() - (age_days || ' days')::interval
from (values
  (1,'Lập trình viên Frontend','middle','active',45,20,'candidate',1,'Vòng sàng lọc kỹ thuật cho vị trí Frontend',210),
  (2,'Lập trình viên Backend','middle','active',60,25,'candidate',2,'Kiểm tra API, cơ sở dữ liệu và bảo mật',185),
  (3,'Kỹ sư dữ liệu','senior','active',60,22,'candidate',3,'SQL nâng cao và thiết kế đường ống dữ liệu',150),
  (4,'Phân tích nghiệp vụ','middle','active',40,18,'candidate',4,'Tình huống đặc tả yêu cầu',120),
  (5,'Kỹ sư kiểm thử','junior','completed',35,15,'candidate',5,'Kiến thức kiểm thử cơ bản',95),
  (6,'Đánh giá năng lực giữa kỳ','middle','active',50,24,'employee',1,'Rà soát kỹ năng nhân viên nửa đầu năm',70),
  (7,'Đánh giá năng lực Backend','senior','active',55,20,'employee',2,'Rà soát kỹ năng nhóm Backend',45),
  (8,'Đánh giá năng lực Dữ liệu','middle','completed',45,18,'employee',3,'Rà soát kỹ năng nhóm Dữ liệu',25)
) as t(n, role, lvl, st, mins, qn, tgt, pos, descr, age_days)
on conflict (id) do nothing;

-- ── Kết quả làm bài, trải đều 12 tháng ──────────────────────────────────────
-- Đây là nguồn của hàng 6 thẻ số, biểu đồ cột theo tháng và vòng tròn tiến trình
-- trên /dashboard. Cố ý chừa một phần chưa chấm và chưa có phân tích AI để các
-- trạng thái "Chờ duyệt" và "Chờ AI chấm" khác 0.
insert into public.results
  (id, test_id, person_id, candidate_name, candidate_email, score, total_questions,
   time_taken, status, ai_analysis, submitted_at, created_at)
select
  demo_seed.did(10, n),
  demo_seed.did(9, tst),
  demo_seed.did(6, per),
  p.full_name, p.email,
  sc, tot,
  demo_seed.rnd('n_3:' || (n * 3), 600, 2700),
  -- 15% chưa chấm; còn lại đạt nếu đúng từ 65% trở lên
  case when demo_seed.rnd('n_5:' || (n * 5), 0, 99) < 15 then null
       when sc::numeric / tot >= 0.65 then 'pass' else 'fail' end,
  -- 22% chưa có phân tích AI
  case when demo_seed.rnd('n_11:' || (n * 11), 0, 99) < 22 then null
       else jsonb_build_object(
         'summary', 'Bản phân tích mẫu cho mục đích xem giao diện.',
         'score', sc, 'confidence', 0.6 + (demo_seed.rnd('n_7:' || (n * 7), 0, 35)::numeric / 100)) end,
  sub, sub
from (
  select
    n,
    1 + (demo_seed.rnd('n_23:' || (n * 23), 0, 7)) as tst,
    1 + (demo_seed.rnd('n_29:' || (n * 29), 0, 47)) as per,
    demo_seed.rnd('n_19:' || (n * 19), 6, 25) as sc,
    25 as tot,
    -- rải trong 12 tháng gần nhất, dồn nhẹ về các tháng gần đây
    date_trunc('month', now())
      - ((demo_seed.rnd('n_37:' || (n * 37), 0, 11)) || ' months')::interval
      + ((demo_seed.rnd('n_41:' || (n * 41), 0, 27)) || ' days')::interval as sub
  from generate_series(1, 96) n
) g
join public.persons p on p.id = demo_seed.did(6, g.per)
on conflict (id) do nothing;

-- ── Chấm kỹ năng, nuôi chế độ "Nhân viên" của dashboard ─────────────────────
insert into public.skill_evaluations
  (id, result_id, skill_id, score, status, reviewer_comment, evaluated_by)
select demo_seed.did(11, r * 100 + s), demo_seed.did(10, r), demo_seed.did(2, s),
       sc,
       case when sc >= 3 then 'pass' else 'fail' end,
       case when sc >= 3 then 'Đáp ứng mức yêu cầu của vị trí.'
            else 'Dưới mức yêu cầu, cần kèm cặp thêm.' end,
       demo_seed.owner()
from generate_series(1, 96) r
cross join lateral (
  select s, demo_seed.rnd('r_43_s_3:' || (r * 43 + s * 3), 1, 5) sc
  from generate_series(1, 14) s
  where demo_seed.rnd('r_47_s:' || (r * 47 + s), 0, 9) < 4          -- mỗi bài chấm khoảng 5 kỹ năng
) q
where exists (select 1 from public.results where id = demo_seed.did(10, r))
on conflict (id) do nothing;
