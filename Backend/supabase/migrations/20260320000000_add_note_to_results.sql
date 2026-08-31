-- Add optional interviewer note column to results table
ALTER TABLE public.results ADD COLUMN IF NOT EXISTS note text;
