-- Add candidate result status (pass/fail) for interview screening
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('pass', 'fail'));
