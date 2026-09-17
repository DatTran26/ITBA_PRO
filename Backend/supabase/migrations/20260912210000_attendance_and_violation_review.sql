CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    check_in_at timestamptz NOT NULL DEFAULT now(),
    check_out_at timestamptz,
    check_in_similarity double precision NOT NULL,
    check_out_similarity double precision,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    CONSTRAINT attendance_checkout_after_checkin
        CHECK (check_out_at IS NULL OR check_out_at >= check_in_at)
);

CREATE INDEX IF NOT EXISTS attendance_sessions_user_active_idx
    ON public.attendance_sessions (user_id, check_out_at);

ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "attendance_sessions_select_own_or_admin"
ON public.attendance_sessions FOR SELECT TO authenticated
USING (
    user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid())
    OR (SELECT role FROM public.users WHERE auth_id = auth.uid()) IN ('admin', 'super_admin', 'leader')
);

CREATE POLICY "attendance_sessions_insert_own"
ON public.attendance_sessions FOR INSERT TO authenticated
WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "attendance_sessions_update_own"
ON public.attendance_sessions FOR UPDATE TO authenticated
USING (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()))
WITH CHECK (user_id = (SELECT id FROM public.users WHERE auth_id = auth.uid()));

ALTER TABLE public.violation_alerts
    ADD COLUMN IF NOT EXISTS detections_json jsonb,
    ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
    ADD COLUMN IF NOT EXISTS review_note text;

ALTER TABLE public.violation_alerts
    ADD CONSTRAINT violation_alerts_status_check
    CHECK (status IN ('pending_review', 'approved', 'rejected')) NOT VALID;

CREATE INDEX IF NOT EXISTS violation_alerts_status_detected_idx
    ON public.violation_alerts (status, detected_at DESC);
