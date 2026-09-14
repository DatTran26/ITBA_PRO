ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
