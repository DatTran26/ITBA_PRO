-- Face re-authentication requests issued by admin / super_admin only.
-- A pending request blocks Face ID sign-in until the user recaptures six angles.

ALTER TABLE public.users
    ADD COLUMN IF NOT EXISTS face_reauth_required boolean NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.face_reauth_requests (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    token_hash text NOT NULL,
    created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
    expires_at timestamptz NOT NULL,
    used_at timestamptz,
    revoked_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS face_reauth_requests_token_hash_idx
    ON public.face_reauth_requests (token_hash);

CREATE INDEX IF NOT EXISTS face_reauth_requests_user_pending_idx
    ON public.face_reauth_requests (user_id, expires_at DESC)
    WHERE used_at IS NULL AND revoked_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS face_reauth_requests_one_active_per_user_idx
    ON public.face_reauth_requests (user_id)
    WHERE used_at IS NULL AND revoked_at IS NULL;

ALTER TABLE public.face_reauth_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "face_reauth_requests_admin_all" ON public.face_reauth_requests;
CREATE POLICY "face_reauth_requests_admin_all" ON public.face_reauth_requests
FOR ALL TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.auth_id = auth.uid()
        AND users.role IN ('admin', 'super_admin')
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users
        WHERE users.auth_id = auth.uid()
        AND users.role IN ('admin', 'super_admin')
    )
);
