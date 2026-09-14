-- ==============================================================================
-- ITBA.AI — DATA SEED SCRIPT FOR PGADMIN 4 / POSTGRESQL
-- DỮ LIỆU MẪU: 1) USERS (TÀI KHOẢN HỆ THỐNG & NHÂN SỰ)
--              2) KHUÔN MẶT (FACE EMBEDDINGS & AUDIT LOGS)
--              3) CHẤM CÔNG (SHIFTS, SESSIONS, DAILY SUMMARY)
--              4) HÀNH VI VI PHẠM (RULES, ALERTS, ACTION LOGS)
-- ==============================================================================

SET search_path TO public;

-- Bắt đầu khối Transaction an toàn
DO $$
DECLARE
    -- User IDs
    uid_superadmin  uuid := '11111111-1111-4111-8111-111111111111';
    uid_admin       uuid := '22222222-2222-4222-8222-222222222222';
    uid_leader      uuid := '33333333-3333-4333-8333-333333333333';
    uid_hr          uuid := '44444444-4444-4444-8444-444444444444';
    uid_recruiter   uuid := '55555555-5555-4555-8555-555555555555';
    uid_interviewer uuid := '66666666-6666-4666-8666-666666666666';
    uid_emp_a       uuid := '77777777-7777-4777-8777-777777777771';
    uid_emp_b       uuid := '77777777-7777-4777-8777-777777777772';
    uid_emp_c       uuid := '77777777-7777-4777-8777-777777777773';
    uid_emp_d       uuid := '77777777-7777-4777-8777-777777777774';

    -- Shift IDs
    sid_standard    uuid;
    sid_morning     uuid;
    sid_afternoon   uuid;

    -- Rule IDs
    rid_smoking     uuid;
    rid_empty_desk  uuid;
    rid_phone       uuid;
    rid_unauth      uuid;

    -- Alert IDs
    aid_1           uuid := 'aaaaaaaa-1111-4aaa-8aaa-aaaaaaaaaaaa';
    aid_2           uuid := 'aaaaaaaa-2222-4aaa-8aaa-aaaaaaaaaaaa';
    aid_3           uuid := 'aaaaaaaa-3333-4aaa-8aaa-aaaaaaaaaaaa';
    aid_4           uuid := 'aaaaaaaa-4444-4aaa-8aaa-aaaaaaaaaaaa';
    aid_5           uuid := 'aaaaaaaa-5555-4aaa-8aaa-aaaaaaaaaaaa';

    -- Mock 512-dim embedding (JSONB array of floats)
    mock_embedding  jsonb;
BEGIN

    -- ==============================================================================
    -- 1. TẠO TÀI KHOẢN NGƯỜI DÙNG (USERS)
    -- ==============================================================================
    INSERT INTO public.users (id, email, name, role, force_password_change, created_at)
    VALUES
        (uid_superadmin,  'test.superadmin@itba.ai',  'Test Super Admin',       'super_admin', false, now() - interval '60 days'),
        (uid_admin,       'test.admin@itba.ai',       'Test Admin',             'admin',       false, now() - interval '60 days'),
        (uid_leader,      'test.leader@itba.ai',      'Test Leader',            'leader',      false, now() - interval '50 days'),
        (uid_hr,          'test.hr@itba.ai',          'Test HR Specialist',     'hr',          false, now() - interval '45 days'),
        (uid_recruiter,   'test.recruiter@itba.ai',   'Test Talent Recruiter',  'recruiter',   false, now() - interval '40 days'),
        (uid_interviewer, 'test.interviewer@itba.ai', 'Test Tech Interviewer',  'interviewer', false, now() - interval '35 days'),
        (uid_emp_a,       'nguyen.vana@itba.ai',      'Nguyễn Văn A (Backend)', 'employee',    false, now() - interval '30 days'),
        (uid_emp_b,       'tran.thib@itba.ai',        'Trần Thị B (Frontend)',  'employee',    false, now() - interval '25 days'),
        (uid_emp_c,       'le.vanc@itba.ai',          'Lê Văn C (AI Engineer)', 'employee',    false, now() - interval '20 days'),
        (uid_emp_d,       'pham.thid@itba.ai',        'Phạm Thị D (QA Lead)',   'employee',    false, now() - interval '15 days')
    ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role;

    -- ==============================================================================
    -- 2. DỮ LIỆU KHUÔN MẶT (FACE EMBEDDINGS & AUDIT LOGS)
    -- ==============================================================================
    -- Giả lập vector 512 chiều chuẩn ArcFace (mảng gồm 6 vector tương ứng 6 góc mặt)
    mock_embedding := jsonb_build_array(
        (SELECT jsonb_agg(round((sin(i)::numeric), 4)) FROM generate_series(1, 512) i),
        (SELECT jsonb_agg(round((cos(i)::numeric), 4)) FROM generate_series(1, 512) i),
        (SELECT jsonb_agg(round((sin(i*2)::numeric), 4)) FROM generate_series(1, 512) i),
        (SELECT jsonb_agg(round((cos(i*2)::numeric), 4)) FROM generate_series(1, 512) i),
        (SELECT jsonb_agg(round((sin(i*3)::numeric), 4)) FROM generate_series(1, 512) i),
        (SELECT jsonb_agg(round((cos(i*3)::numeric), 4)) FROM generate_series(1, 512) i)
    );

    -- Đăng ký khuôn mặt đã kích hoạt cho Super Admin và các nhân viên
    INSERT INTO public.user_face_embeddings (user_id, embedding_json, angle_count, is_active, created_at)
    VALUES
        (uid_superadmin, mock_embedding, 6, true, now() - interval '20 days'),
        (uid_admin,      mock_embedding, 6, true, now() - interval '18 days'),
        (uid_emp_a,      mock_embedding, 6, true, now() - interval '15 days'),
        (uid_emp_b,      mock_embedding, 6, true, now() - interval '12 days'),
        (uid_emp_c,      mock_embedding, 6, true, now() - interval '10 days')
    ON CONFLICT DO NOTHING;

    -- Nhật ký xác thực Face ID (Face Audit Logs)
    INSERT INTO public.face_audit_logs (user_id, email, action_type, similarity_score, is_matched, camera_device, ip_address, created_at)
    VALUES
        (uid_superadmin, 'test.superadmin@itba.ai', 'login',                 0.924, true,  'Integrated Webcam 1080p', '192.168.1.45', now() - interval '2 hours'),
        (uid_emp_a,      'nguyen.vana@itba.ai',     'attendance_check_in',   0.881, true,  'Entrance Cam #1',         '192.168.1.10', now() - interval '9 hours'),
        (uid_emp_b,      'tran.thib@itba.ai',       'attendance_check_in',   0.895, true,  'Entrance Cam #1',         '192.168.1.10', now() - interval '9 hours 5 minutes'),
        (uid_emp_c,      'le.vanc@itba.ai',         'attendance_check_in',   0.845, true,  'Entrance Cam #2',         '192.168.1.11', now() - interval '8 hours 50 minutes'),
        (uid_admin,      'test.admin@itba.ai',      'login',                 0.912, true,  'MacBook Face ID Cam',     '192.168.1.50', now() - interval '1 day'),
        (NULL,           'unknown@visitor.com',     'login',                 0.412, false, 'Entrance Cam #1',         '192.168.1.10', now() - interval '1 day 2 hours'),
        (uid_emp_a,      'nguyen.vana@itba.ai',     'attendance_check_out',  0.873, true,  'Exit Gate Cam #1',        '192.168.1.12', now() - interval '1 day 4 hours')
    ON CONFLICT DO NOTHING;

    -- ==============================================================================
    -- 3. DỮ LIỆU CHẤM CÔNG (ATTENDANCE SHIFTS & SESSIONS)
    -- ==============================================================================
    SELECT id INTO sid_standard FROM public.attendance_shifts WHERE shift_code = 'STANDARD' LIMIT 1;
    SELECT id INTO sid_morning  FROM public.attendance_shifts WHERE shift_code = 'MORNING'  LIMIT 1;

    -- Phiên chấm công các ngày gần đây
    -- Hôm nay: Check-in sáng, đang trong ca làm việc (check_out_at = NULL)
    INSERT INTO public.attendance_sessions 
        (user_id, shift_id, check_in_at, check_out_at, check_in_similarity, check_out_similarity, status, work_duration_minutes, notes, created_at)
    VALUES
        (uid_emp_a, sid_standard, now() - interval '4 hours', NULL, 0.885, NULL, 'valid', NULL, 'Đúng giờ ca sáng', now() - interval '4 hours'),
        (uid_emp_b, sid_standard, now() - interval '4 hours 10 minutes', NULL, 0.902, NULL, 'valid', NULL, 'Đúng giờ ca sáng', now() - interval '4 hours 10 minutes'),
        (uid_emp_c, sid_standard, now() - interval '3 hours 40 minutes', NULL, 0.812, NULL, 'late', NULL, 'Đi muộn 20 phút do kẹt xe', now() - interval '3 hours 40 minutes');

    -- Hôm qua: Đã hoàn tất cả ngày (Check-in & Check-out đầy đủ)
    INSERT INTO public.attendance_sessions 
        (user_id, shift_id, check_in_at, check_out_at, check_in_similarity, check_out_similarity, status, work_duration_minutes, notes, created_at)
    VALUES
        (uid_emp_a, sid_standard, now() - interval '1 day 9 hours', now() - interval '1 day 30 minutes', 0.891, 0.874, 'valid', 510, 'Hoàn thành 8.5 tiếng làm việc', now() - interval '1 day 9 hours'),
        (uid_emp_b, sid_standard, now() - interval '1 day 8 hours 55 minutes', now() - interval '1 day 25 minutes', 0.915, 0.889, 'valid', 510, 'Hoàn thành đủ giờ', now() - interval '1 day 8 hours 55 minutes'),
        (uid_emp_c, sid_standard, now() - interval '1 day 9 hours 5 minutes', now() - interval '1 day 1 hour 45 minutes', 0.864, 0.852, 'early_leave', 440, 'Xin về sớm có việc cá nhân', now() - interval '1 day 9 hours 5 minutes'),
        (uid_emp_d, sid_standard, now() - interval '1 day 8 hours 50 minutes', now() - interval '1 day 20 minutes', 0.920, 0.911, 'valid', 510, 'Làm việc bình thường', now() - interval '1 day 8 hours 50 minutes');

    -- 2 ngày trước:
    INSERT INTO public.attendance_sessions 
        (user_id, shift_id, check_in_at, check_out_at, check_in_similarity, check_out_similarity, status, work_duration_minutes, notes, created_at)
    VALUES
        (uid_emp_a, sid_standard, now() - interval '2 days 9 hours', now() - interval '2 days 30 minutes', 0.878, 0.882, 'valid', 510, 'Ca chuẩn', now() - interval '2 days 9 hours'),
        (uid_emp_b, sid_standard, now() - interval '2 days 8 hours 40 minutes', now() - interval '2 days 30 minutes', 0.931, 0.894, 'valid', 490, 'Ca chuẩn', now() - interval '2 days 8 hours 40 minutes');

    -- Bảng tổng hợp chấm công hàng ngày (Daily Summary)
    INSERT INTO public.attendance_daily_summary 
        (user_id, work_date, first_check_in, last_check_out, total_working_hours, is_late, is_early_leave, daily_status, notes)
    VALUES
        (uid_emp_a, CURRENT_DATE - 1, now() - interval '1 day 9 hours', now() - interval '1 day 30 minutes', 8.5, false, false, 'present', 'Đi làm đầy đủ'),
        (uid_emp_b, CURRENT_DATE - 1, now() - interval '1 day 8 hours 55 minutes', now() - interval '1 day 25 minutes', 8.5, false, false, 'present', 'Đi làm đầy đủ'),
        (uid_emp_c, CURRENT_DATE - 1, now() - interval '1 day 9 hours 5 minutes', now() - interval '1 day 1 hour 45 minutes', 7.3, false, true,  'early_leave', 'Về sớm 45 phút'),
        (uid_emp_d, CURRENT_DATE - 1, now() - interval '1 day 8 hours 50 minutes', now() - interval '1 day 20 minutes', 8.5, false, false, 'present', 'Đi làm đầy đủ'),
        (uid_emp_a, CURRENT_DATE - 2, now() - interval '2 days 9 hours', now() - interval '2 days 30 minutes', 8.5, false, false, 'present', 'Đi làm đầy đủ'),
        (uid_emp_b, CURRENT_DATE - 2, now() - interval '2 days 8 hours 40 minutes', now() - interval '2 days 30 minutes', 8.2, false, false, 'present', 'Đi làm đầy đủ')
    ON CONFLICT (user_id, work_date) DO NOTHING;

    -- ==============================================================================
    -- 4. DỮ LIỆU HÀNH VI VI PHẠM (RULES, ALERTS, ACTION LOGS)
    -- ==============================================================================
    SELECT id INTO rid_smoking    FROM public.violation_rules WHERE violation_code = 'smoking'    LIMIT 1;
    SELECT id INTO rid_empty_desk FROM public.violation_rules WHERE violation_code = 'empty_desk' LIMIT 1;
    SELECT id INTO rid_phone      FROM public.violation_rules WHERE violation_code = 'phone_usage' LIMIT 1;
    SELECT id INTO rid_unauth     FROM public.violation_rules WHERE violation_code = 'unauthorized_access' LIMIT 1;

    -- Thêm các cảnh báo phát hiện vi phạm thực tế từ Camera AI
    INSERT INTO public.violation_alerts 
        (id, track_id, rule_id, user_id, violation_type, severity, camera_location, evidence_url, status, detections_json, reviewed_by, reviewed_at, review_note, detected_at, created_at)
    VALUES
        -- Cảnh báo 1: Mới phát hiện, đang chờ duyệt (Pending Review)
        (aid_1, 'trk-9821-smoke', rid_smoking, uid_emp_c, 'smoking', 'High', 'Tầng 3 - Cụm Kỹ Thuật B3', 
         'https://images.unsplash.com/photo-1527661591475-527312dd65f5?auto=format&fit=crop&w=600&q=80',
         'pending_review',
         jsonb_build_object('label', 'cigarette', 'confidence', 0.94, 'bbox', jsonb_build_array(120, 85, 230, 190), 'camera_fps', 30),
         NULL, NULL, NULL, now() - interval '1 hour 15 minutes', now() - interval '1 hour 15 minutes'),

        -- Cảnh báo 2: Rời bàn làm việc quá giờ (Pending Review)
        (aid_2, 'trk-9840-desk', rid_empty_desk, uid_emp_a, 'empty_desk', 'Low', 'Tầng 3 - Bàn Dev 04', 
         'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80',
         'pending_review',
         jsonb_build_object('label', 'empty_chair', 'confidence', 0.88, 'duration_minutes', 48),
         NULL, NULL, NULL, now() - interval '3 hours 10 minutes', now() - interval '3 hours 10 minutes'),

        -- Cảnh báo 3: Đã được HR phê duyệt (Approved)
        (aid_3, 'trk-9755-phone', rid_phone, uid_emp_b, 'phone_usage', 'Medium', 'Phòng Phỏng Vấn Bảo Mật #2', 
         'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=600&q=80',
         'approved',
         jsonb_build_object('label', 'cell_phone', 'confidence', 0.96, 'bbox', jsonb_build_array(310, 140, 410, 260)),
         uid_hr, now() - interval '1 day 2 hours', 'Đã xác minh: Sử dụng điện thoại trong phòng làm bài bảo mật của ứng viên.',
         now() - interval '1 day 4 hours', now() - interval '1 day 4 hours'),

        -- Cảnh báo 4: Xâm nhập trái phép khu vực máy chủ (Approved)
        (aid_4, 'trk-9680-unauth', rid_unauth, NULL, 'unauthorized_access', 'Critical', 'Khu Vực Cửa Server Room', 
         'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80',
         'approved',
         jsonb_build_object('label', 'person_unidentified', 'confidence', 0.91, 'badge_detected', false),
         uid_superadmin, now() - interval '2 days 3 hours', 'Bảo vệ đã kiểm tra và ghi nhận khách vãng lai đi lạc hành lang kỹ thuật.',
         now() - interval '2 days 5 hours', now() - interval '2 days 5 hours'),

        -- Cảnh báo 5: Nhận diện nhầm - Đã từ chối (Rejected - False Positive)
        (aid_5, 'trk-9610-smoke', rid_smoking, uid_emp_d, 'smoking', 'High', 'Khu vực Pantry Tầng 2', 
         'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
         'rejected',
         jsonb_build_object('label', 'smoke_steam', 'confidence', 0.68),
         uid_hr, now() - interval '3 days 1 hour', 'Bác bỏ: Hơi nước bốc lên từ cốc trà nóng, không phải khói thuốc lá.',
         now() - interval '3 days 3 hours', now() - interval '3 days 3 hours')
    ON CONFLICT (id) DO NOTHING;

    -- Lịch sử hành động xử lý vi phạm (Violation Action Logs)
    INSERT INTO public.violation_action_logs (alert_id, action_by, action_type, comment, created_at)
    VALUES
        (aid_3, uid_hr, 'warning_email', 'Đã gửi email nhắc nhở nội quy phòng phỏng vấn tới nhân sự.', now() - interval '1 day 1 hour'),
        (aid_4, uid_superadmin, 'hr_memo', 'Lập biên bản an ninh và thông báo cho đội tuần tra ca tối.', now() - interval '2 days 2 hours')
    ON CONFLICT DO NOTHING;

END $$;

-- Kết quả thông báo
SELECT 
    (SELECT count(*) FROM public.users) AS total_users,
    (SELECT count(*) FROM public.user_face_embeddings) AS total_face_enrollments,
    (SELECT count(*) FROM public.attendance_sessions) AS total_attendance_records,
    (SELECT count(*) FROM public.violation_alerts) AS total_violation_alerts,
    'Data seed for Face, Attendance, and Violation Monitoring executed successfully!' AS status;
