ALTER TABLE public.email_logs ADD COLUMN IF NOT EXISTS batch_id uuid;
CREATE INDEX IF NOT EXISTS email_logs_batch_id_idx ON public.email_logs(batch_id) WHERE batch_id IS NOT NULL;
