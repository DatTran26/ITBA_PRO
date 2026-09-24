-- Prevent concurrent issue requests from leaving more than one usable Face ID
-- re-authentication link for an account. Existing active rows are revoked first.

WITH ranked AS (
  SELECT id,
    row_number() OVER (PARTITION BY user_id ORDER BY created_at DESC) AS position
  FROM public.face_reauth_requests
  WHERE used_at IS NULL AND revoked_at IS NULL
)
UPDATE public.face_reauth_requests AS request
SET revoked_at = now()
FROM ranked
WHERE request.id = ranked.id
  AND ranked.position > 1;

CREATE UNIQUE INDEX IF NOT EXISTS face_reauth_requests_one_active_per_user_idx
  ON public.face_reauth_requests (user_id)
  WHERE used_at IS NULL AND revoked_at IS NULL;
