-- Migration: 20260914183000_attendance_face_behavior.sql
-- Purpose: Complete tables for Face Biometrics, Time Attendance, and Behavior Violations

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Face Biometrics & Verification
CREATE TABLE IF NOT EXISTS public.user_face_embeddings (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    embedding_json jsonb NOT NULL,
    angle_count int4 DEFAULT 6,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now()
);

-- Earlier Vision migrations created a narrower version of this table.
ALTER TABLE public.user_face_embeddings
    ADD COLUMN IF NOT EXISTS angle_count int4 DEFAULT 6,
    ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_user_face_embeddings_user 
    ON public.user_face_embeddings (user_id);
CREATE INDEX IF NOT EXISTS idx_user_face_embeddings_active 
    ON public.user_face_embeddings (user_id, is_active);

CREATE TABLE IF NOT EXISTS public.face_audit_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    email varchar(255),
    action_type varchar(50) NOT NULL,
    similarity_score double precision,
    is_matched boolean NOT NULL,
    camera_device text,
    ip_address varchar(45),
    snapshot_url text,
    error_reason text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_face_audit_logs_user_date 
    ON public.face_audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_face_audit_logs_action 
    ON public.face_audit_logs (action_type, is_matched);

-- 2. Time & Attendance
CREATE TABLE IF NOT EXISTS public.attendance_shifts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_code varchar(50) UNIQUE NOT NULL,
    shift_name varchar(100) NOT NULL,
    start_time time NOT NULL,
    end_time time NOT NULL,
    grace_period_minutes int4 DEFAULT 15,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

INSERT INTO public.attendance_shifts (shift_code, shift_name, start_time, end_time, grace_period_minutes)
VALUES 
    ('STANDARD', 'Ca hành chính tiêu chuẩn', '08:30:00', '17:30:00', 15),
    ('MORNING', 'Ca sáng linh hoạt', '07:30:00', '11:30:00', 10),
    ('AFTERNOON', 'Ca chiều linh hoạt', '13:00:00', '17:00:00', 10)
ON CONFLICT (shift_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    shift_id uuid REFERENCES public.attendance_shifts(id) ON DELETE SET NULL,
    check_in_at timestamptz NOT NULL DEFAULT now(),
    check_out_at timestamptz,
    check_in_similarity double precision NOT NULL,
    check_out_similarity double precision,
    check_in_snapshot text,
    check_out_snapshot text,
    status varchar(50) DEFAULT 'valid',
    work_duration_minutes int4,
    location text,
    notes text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT attendance_checkout_after_checkin
        CHECK (check_out_at IS NULL OR check_out_at >= check_in_at)
);

-- Keep this migration compatible with the Phase 1 attendance table.
ALTER TABLE public.attendance_sessions
    ADD COLUMN IF NOT EXISTS shift_id uuid REFERENCES public.attendance_shifts(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS check_in_snapshot text,
    ADD COLUMN IF NOT EXISTS check_out_snapshot text,
    ADD COLUMN IF NOT EXISTS status varchar(50) DEFAULT 'valid',
    ADD COLUMN IF NOT EXISTS work_duration_minutes int4,
    ADD COLUMN IF NOT EXISTS location text,
    ADD COLUMN IF NOT EXISTS notes text,
    ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_user_active 
    ON public.attendance_sessions (user_id, check_out_at);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date 
    ON public.attendance_sessions (check_in_at DESC);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_status 
    ON public.attendance_sessions (status);

CREATE TABLE IF NOT EXISTS public.attendance_daily_summary (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    work_date date NOT NULL,
    first_check_in timestamptz,
    last_check_out timestamptz,
    total_working_hours double precision DEFAULT 0,
    is_late boolean DEFAULT false,
    is_early_leave boolean DEFAULT false,
    daily_status varchar(50) DEFAULT 'present',
    notes text,
    created_at timestamptz DEFAULT now(),
    updated_at timestamptz DEFAULT now(),
    CONSTRAINT unique_user_work_date UNIQUE (user_id, work_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_daily_summary_date 
    ON public.attendance_daily_summary (work_date DESC, daily_status);

-- 3. Behavior & Violation Monitoring
CREATE TABLE IF NOT EXISTS public.violation_rules (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    violation_code varchar(50) UNIQUE NOT NULL,
    title varchar(150) NOT NULL,
    description text,
    default_severity varchar(20) DEFAULT 'Medium',
    penalty_points int4 DEFAULT 0,
    is_active boolean DEFAULT true,
    created_at timestamptz DEFAULT now()
);

INSERT INTO public.violation_rules (violation_code, title, description, default_severity, penalty_points)
VALUES 
    ('smoking', 'Hút thuốc trong khu vực làm việc', 'Phát hiện khói, điếu thuốc hoặc hành vi châm thuốc tại bàn làm việc', 'High', 10),
    ('empty_desk', 'Rời bàn làm việc quá thời gian quy định', 'Bàn làm việc trống người liên tục vượt quá ngưỡng cho phép', 'Low', 2),
    ('phone_usage', 'Sử dụng điện thoại cá nhân trong giờ làm việc', 'Phát hiện cầm hoặc sử dụng thiết bị di động trong khu vực hạn chế', 'Medium', 5),
    ('unauthorized_access', 'Xâm nhập khu vực không được cấp quyền', 'Phát hiện người lạ hoặc người không có quyền ra vào khu vực máy chủ/văn phòng', 'Critical', 20)
ON CONFLICT (violation_code) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.violation_alerts (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    track_id varchar NOT NULL,
    rule_id uuid REFERENCES public.violation_rules(id) ON DELETE SET NULL,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    violation_type varchar NOT NULL,
    severity varchar DEFAULT 'Medium',
    camera_location varchar,
    evidence_url varchar,
    status varchar DEFAULT 'pending_review',
    detections_json jsonb,
    reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    reviewed_at timestamptz,
    review_note text,
    detected_at timestamptz DEFAULT now(),
    created_at timestamptz DEFAULT now()
);

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'violation_alerts' AND column_name = 'detections_json') THEN
        ALTER TABLE public.violation_alerts ADD COLUMN detections_json jsonb;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'violation_alerts' AND column_name = 'reviewed_by') THEN
        ALTER TABLE public.violation_alerts ADD COLUMN reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'violation_alerts' AND column_name = 'reviewed_at') THEN
        ALTER TABLE public.violation_alerts ADD COLUMN reviewed_at timestamptz;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'violation_alerts' AND column_name = 'review_note') THEN
        ALTER TABLE public.violation_alerts ADD COLUMN review_note text;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'violation_alerts' AND column_name = 'rule_id') THEN
        ALTER TABLE public.violation_alerts ADD COLUMN rule_id uuid REFERENCES public.violation_rules(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'violation_alerts' AND column_name = 'user_id') THEN
        ALTER TABLE public.violation_alerts ADD COLUMN user_id uuid REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_violation_alerts_status_detected 
    ON public.violation_alerts (status, detected_at DESC);
CREATE INDEX IF NOT EXISTS idx_violation_alerts_type 
    ON public.violation_alerts (violation_type);
CREATE INDEX IF NOT EXISTS idx_violation_alerts_user 
    ON public.violation_alerts (user_id);

CREATE TABLE IF NOT EXISTS public.violation_action_logs (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_id uuid NOT NULL REFERENCES public.violation_alerts(id) ON DELETE CASCADE,
    action_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    action_type varchar(50) NOT NULL,
    comment text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_violation_action_logs_alert 
    ON public.violation_action_logs (alert_id);

-- Updated_at trigger function
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

-- Row Level Security (RLS)
ALTER TABLE public.user_face_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.face_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_daily_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violation_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.violation_action_logs ENABLE ROW LEVEL SECURITY;

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

DROP POLICY IF EXISTS "violation_alerts_admin_all" ON public.violation_alerts;
CREATE POLICY "violation_alerts_admin_all" ON public.violation_alerts
FOR ALL TO public USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.auth_id = auth.uid()
        AND users.role IN ('admin', 'super_admin', 'leader', 'hr')
    )
);

DROP POLICY IF EXISTS "violation_alerts_select_own" ON public.violation_alerts;
CREATE POLICY "violation_alerts_select_own" ON public.violation_alerts
FOR SELECT TO authenticated USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
);

DROP POLICY IF EXISTS "attendance_shifts_read_all" ON public.attendance_shifts;
CREATE POLICY "attendance_shifts_read_all" ON public.attendance_shifts
FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "violation_rules_read_all" ON public.violation_rules;
CREATE POLICY "violation_rules_read_all" ON public.violation_rules
FOR SELECT TO authenticated USING (true);
