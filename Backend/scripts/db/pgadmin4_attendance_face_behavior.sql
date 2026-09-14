-- ==============================================================================
-- ITBA.AI — DDL SCRIPT FOR PGADMIN 4 / POSTGRESQL
-- CHỨC NĂNG: 1) KHUÔN MẶT (FACE BIOMETRICS)
--           2) CHẤM CÔNG (TIME & ATTENDANCE)
--           3) HÀNH VI VI PHẠM (BEHAVIOR & VIOLATIONS MONITORING)
-- ==============================================================================

-- Bật extension cần thiết cho UUID và mã hóa
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Đảm bảo schema public
SET search_path TO public;

-- ==============================================================================
-- PHẦN 1: BẢNG USERS (NẾU CHƯA TỒN TẠI)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.users (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    auth_id uuid UNIQUE,
    email varchar UNIQUE NOT NULL,
    name varchar,
    role varchar DEFAULT 'recruiter',
    force_password_change boolean DEFAULT false,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- ==============================================================================
-- PHẦN 2: CHỨC NĂNG KHUÔN MẶT (FACE BIOMETRICS & VERIFICATION)
-- ==============================================================================

-- 2.1 Bảng lưu trữ ArcFace 512-dim Embeddings cho từng nhân sự (6 góc chụp)
CREATE TABLE IF NOT EXISTS public.user_face_embeddings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    embedding_json jsonb NOT NULL,                -- Mảng chứa các vector đặc trưng khuôn mặt ArcFace (512 chiều)
    angle_count int4 DEFAULT 6,                  -- Số góc chụp đã đăng ký (Front, Left, Right, Up, Down, Smile)
    is_active boolean DEFAULT true,              -- Trạng thái kích hoạt nhận diện
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Index tra cứu khuôn mặt theo user_id
CREATE INDEX IF NOT EXISTS idx_user_face_embeddings_user 
    ON public.user_face_embeddings (user_id);
CREATE INDEX IF NOT EXISTS idx_user_face_embeddings_active 
    ON public.user_face_embeddings (user_id, is_active);

-- 2.2 Bảng nhật ký xác thực khuôn mặt (Face Auth & Verification Audit Logs)
CREATE TABLE IF NOT EXISTS public.face_audit_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    email varchar(255),
    action_type varchar(50) NOT NULL,            -- 'login', 'attendance_check_in', 'attendance_check_out', 'self_enroll'
    similarity_score double precision,          -- Độ tương đồng cao nhất (Cosine Similarity: 0.0 -> 1.0)
    is_matched boolean NOT NULL,                 -- True nếu vượt ngưỡng tương đồng (threshold >= 0.65)
    camera_device text,                          -- Tên thiết bị / camera client
    ip_address varchar(45),                      -- Địa chỉ IP client
    snapshot_url text,                           -- Đường dẫn ảnh chụp khi xác thực (evidence/debug)
    error_reason text,                           -- Lý do lỗi nếu không khớp
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_face_audit_logs_user_date 
    ON public.face_audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_face_audit_logs_action 
    ON public.face_audit_logs (action_type, is_matched);

-- ==============================================================================
-- PHẦN 3: CHỨC NĂNG CHẤM CÔNG (TIME & ATTENDANCE MANAGEMENT)
-- ==============================================================================

-- 3.1 Cấu hình ca làm việc (Work Shifts)
CREATE TABLE IF NOT EXISTS public.attendance_shifts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_code varchar(50) UNIQUE NOT NULL,      -- 'STANDARD', 'MORNING', 'AFTERNOON', 'NIGHT'
    shift_name varchar(100) NOT NULL,            -- 'Ca hành chính', 'Ca sáng', 'Ca chiều'
    start_time time NOT NULL,                    -- Giờ bắt đầu (vd: 08:30:00)
    end_time time NOT NULL,                      -- Giờ kết thúc (vd: 17:30:00)
    grace_period_minutes int4 DEFAULT 15,        -- Số phút cho phép đến muộn hợp lệ (vd: 15 phút)
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Thêm dữ liệu ca mặc định nếu chưa có
INSERT INTO public.attendance_shifts (shift_code, shift_name, start_time, end_time, grace_period_minutes)
VALUES 
    ('STANDARD', 'Ca hành chính tiêu chuẩn', '08:30:00', '17:30:00', 15),
    ('MORNING', 'Ca sáng linh hoạt', '07:30:00', '11:30:00', 10),
    ('AFTERNOON', 'Ca chiều linh hoạt', '13:00:00', '17:00:00', 10)
ON CONFLICT (shift_code) DO NOTHING;

-- 3.2 Bảng phiên chấm công cá nhân (Attendance Sessions)
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    shift_id uuid REFERENCES public.attendance_shifts(id) ON DELETE SET NULL,
    check_in_at timestamptz NOT NULL DEFAULT now(),
    check_out_at timestamptz,
    check_in_similarity double precision NOT NULL,   -- Độ khớp khuôn mặt lúc check-in
    check_out_similarity double precision,           -- Độ khớp khuôn mặt lúc check-out
    check_in_snapshot text,                          -- Ảnh chụp camera check-in
    check_out_snapshot text,                         -- Ảnh chụp camera check-out
    status varchar(50) DEFAULT 'valid',              -- 'valid', 'late', 'early_leave', 'missing_checkout', 'flagged'
    work_duration_minutes int4,                      -- Số phút làm việc thực tế
    location text,                                   -- Vị trí văn phòng / IP subnet
    notes text,                                      -- Ghi chú chấm công
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT attendance_checkout_after_checkin
        CHECK (check_out_at IS NULL OR check_out_at >= check_in_at)
);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_user_active 
    ON public.attendance_sessions (user_id, check_out_at);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date 
    ON public.attendance_sessions (check_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_status 
    ON public.attendance_sessions (status);

-- 3.3 Bảng báo cáo tổng hợp chấm công hàng ngày (Daily Attendance Summary)
CREATE TABLE IF NOT EXISTS public.attendance_daily_summary (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    work_date date NOT NULL,                         -- Ngày làm việc (YYYY-MM-DD)
    first_check_in timestamptz,                      -- Lần check-in đầu tiên trong ngày
    last_check_out timestamptz,                      -- Lần check-out cuối cùng trong ngày
    total_working_hours double precision DEFAULT 0, -- Tổng số giờ làm việc
    is_late boolean DEFAULT false,                   -- Có đi muộn không
    is_early_leave boolean DEFAULT false,            -- Có về sớm không
    daily_status varchar(50) DEFAULT 'present',      -- 'present', 'late', 'absent', 'half_day', 'on_leave'
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT unique_user_work_date UNIQUE (user_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_daily_summary_date 
    ON public.attendance_daily_summary (work_date DESC, daily_status);

-- ==============================================================================
-- PHẦN 4: CHỨC NĂNG GIÁM SÁT HÀNH VI VI PHẠM (BEHAVIOR & VIOLATIONS)
-- ==============================================================================

-- 4.1 Bảng định nghĩa danh mục hành vi vi phạm (Violation Rules)
CREATE TABLE IF NOT EXISTS public.violation_rules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    violation_code varchar(50) UNIQUE NOT NULL,      -- 'smoking', 'empty_desk', 'phone_usage', 'multiple_persons'
    title varchar(150) NOT NULL,                     -- Tên hành vi vi phạm
    description text,                                -- Chi tiết mô tả vi phạm
    default_severity varchar(20) DEFAULT 'Medium',   -- 'Low', 'Medium', 'High', 'Critical'
    penalty_points int4 DEFAULT 0,                   -- Điểm trừ nội quy nếu áp dụng
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

-- Thêm các quy tắc vi phạm mặc định
INSERT INTO public.violation_rules (violation_code, title, description, default_severity, penalty_points)
VALUES 
    ('smoking', 'Hút thuốc trong khu vực làm việc', 'Phát hiện khói, điếu thuốc hoặc hành vi châm thuốc tại bàn làm việc', 'High', 10),
    ('empty_desk', 'Rời bàn làm việc quá thời gian quy định', 'Bàn làm việc trống người liên tục vượt quá ngưỡng cho phép', 'Low', 2),
    ('phone_usage', 'Sử dụng điện thoại cá nhân trong giờ làm việc', 'Phát hiện cầm hoặc sử dụng thiết bị di động trong khu vực hạn chế', 'Medium', 5),
    ('unauthorized_access', 'Xâm nhập khu vực không được cấp quyền', 'Phát hiện người lạ hoặc người không có quyền ra vào khu vực máy chủ/văn phòng', 'Critical', 20)
ON CONFLICT (violation_code) DO NOTHING;

-- 4.2 Bảng cảnh báo hành vi vi phạm từ AI Vision (Violation Alerts)
CREATE TABLE IF NOT EXISTS public.violation_alerts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id varchar NOT NULL,                       -- Mã tracking do mô hình YOLO / DeepSORT gán
    rule_id uuid REFERENCES public.violation_rules(id) ON DELETE SET NULL,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL, -- Nhân sự vi phạm (nếu AI nhận diện được)
    violation_type varchar NOT NULL,                 -- 'smoking', 'empty_desk', etc.
    severity varchar DEFAULT 'Medium',               -- 'Low', 'Medium', 'High', 'Critical'
    camera_location varchar,                         -- Vị trí camera giám sát (vd: 'Tầng 3 - Phòng Kỹ Thuật')
    evidence_url varchar,                            -- URL hoặc file path hình ảnh/video bằng chứng
    status varchar DEFAULT 'pending_review',         -- 'pending_review', 'approved', 'rejected'
    detections_json jsonb,                           -- Chi tiết bounding box, confidence score, nhãn detection
    reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL, -- Người phụ trách duyệt vi phạm
    reviewed_at timestamptz,                         -- Thời điểm duyệt
    review_note text,                                -- Ghi chú phê duyệt / từ chối
    detected_at timestamptz DEFAULT now(),           -- Thời điểm AI phát hiện
    created_at timestamptz DEFAULT now()
);

-- Thêm các cột bổ sung nếu bảng đã tồn tại từ trước
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'violation_alerts' AND column_name = 'detections_json') THEN
        ALTER TABLE public.violation_alerts ADD COLUMN detections_json jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'violation_alerts' AND column_name = 'reviewed_by') THEN
        ALTER TABLE public.violation_alerts ADD COLUMN reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'violation_alerts' AND column_name = 'reviewed_at') THEN
        ALTER TABLE public.violation_alerts ADD COLUMN reviewed_at timestamptz;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'violation_alerts' AND column_name = 'review_note') THEN
        ALTER TABLE public.violation_alerts ADD COLUMN review_note text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'violation_alerts' AND column_name = 'rule_id') THEN
        ALTER TABLE public.violation_alerts ADD COLUMN rule_id uuid REFERENCES public.violation_rules(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'violation_alerts' AND column_name = 'user_id') THEN
        ALTER TABLE public.violation_alerts ADD COLUMN user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_violation_alerts_status_detected 
    ON public.violation_alerts (status, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_violation_alerts_type 
    ON public.violation_alerts (violation_type);
CREATE INDEX IF NOT EXISTS idx_violation_alerts_user 
    ON public.violation_alerts (user_id);

-- 4.3 Bảng lịch sử xử lý vi phạm (Violation Action Logs)
CREATE TABLE IF NOT EXISTS public.violation_action_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id uuid NOT NULL REFERENCES public.violation_alerts(id) ON DELETE CASCADE,
    action_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action_type varchar(50) NOT NULL,                -- 'warning_email', 'hr_memo', 'penalty_deduction', 'resolved'
    comment text,                                    -- Nội dung xử lý
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_violation_action_logs_alert 
    ON public.violation_action_logs (alert_id);

-- ==============================================================================
-- PHẦN 5: TRIGGER TỰ ĐỘNG CẬP NHẬT UPDATED_AT
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_user_face_embeddings') THEN
        CREATE TRIGGER set_updated_at_user_face_embeddings
        BEFORE UPDATE ON public.user_face_embeddings
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_attendance_sessions') THEN
        CREATE TRIGGER set_updated_at_attendance_sessions
        BEFORE UPDATE ON public.attendance_sessions
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_updated_at_attendance_daily_summary') THEN
        CREATE TRIGGER set_updated_at_attendance_daily_summary
        BEFORE UPDATE ON public.attendance_daily_summary
        FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- ==============================================================================
-- PHẦN 6: PHÂN QUYỀN VÀ BẢO MẬT (ROW LEVEL SECURITY - RLS)
-- ==============================================================================
ALTER TABLE public.user_face_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violation_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violation_action_logs ENABLE ROW LEVEL SECURITY;

-- 6.1 Policies cho user_face_embeddings
DROP POLICY IF EXISTS "user_face_embeddings_admin_all" ON public.user_face_embeddings;
CREATE POLICY "user_face_embeddings_admin_all" ON public.user_face_embeddings
FOR ALL TO public USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.auth_id = auth.uid()
        AND users.role IN ('admin', 'super_admin', 'leader')
    )
);

DROP POLICY IF EXISTS "user_face_embeddings_select_own" ON public.user_face_embeddings;
CREATE POLICY "user_face_embeddings_select_own" ON public.user_face_embeddings
FOR SELECT TO public USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.auth_id = auth.uid()
        AND users.id = user_face_embeddings.user_id
    )
);

-- 6.2 Policies cho attendance_sessions
DROP POLICY IF EXISTS "attendance_sessions_select_own_or_admin" ON public.attendance_sessions;
CREATE POLICY "attendance_sessions_select_own_or_admin" ON public.attendance_sessions
FOR SELECT TO authenticated USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
    OR (SELECT role FROM public.users WHERE auth_id = auth.uid()) IN ('admin', 'super_admin', 'leader', 'hr')
);

DROP POLICY IF EXISTS "attendance_sessions_insert_own" ON public.attendance_sessions;
CREATE POLICY "attendance_sessions_insert_own" ON public.attendance_sessions
FOR INSERT TO authenticated WITH CHECK (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
);

DROP POLICY IF EXISTS "attendance_sessions_update_own" ON public.attendance_sessions;
CREATE POLICY "attendance_sessions_update_own" ON public.attendance_sessions
FOR UPDATE TO authenticated USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
) WITH CHECK (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
);

-- 6.3 Policies cho violation_alerts
DROP POLICY IF EXISTS "violation_alerts_admin_all" ON public.violation_alerts;
CREATE POLICY "violation_alerts_admin_all" ON public.violation_alerts
FOR ALL TO public USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.auth_id = auth.uid()
        AND users.role IN ('admin', 'super_admin', 'leader', 'hr')
    )
);

-- Cho phép nhân viên xem vi phạm của chính mình
DROP POLICY IF EXISTS "violation_alerts_select_own" ON public.violation_alerts;
CREATE POLICY "violation_alerts_select_own" ON public.violation_alerts
FOR SELECT TO authenticated USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
);

-- 6.4 Policies cho attendance_shifts & violation_rules (Ai đăng nhập cũng được đọc)
DROP POLICY IF EXISTS "attendance_shifts_read_all" ON public.attendance_shifts;
CREATE POLICY "attendance_shifts_read_all" ON public.attendance_shifts
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "violation_rules_read_all" ON public.violation_rules;
CREATE POLICY "violation_rules_read_all" ON public.violation_rules
FOR SELECT TO authenticated USING (true);

-- Hoàn tất DDL
SELECT 'DDL script for Face ID, Attendance, and Violation Monitoring created successfully!' AS status;
