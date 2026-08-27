-- =============================================================
-- MIGRATION: Extend tests and results for talent assessment
-- =============================================================

-- Add target_type to tests (candidate vs employee evaluation)
ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS target_type varchar NOT NULL DEFAULT 'candidate'
  CHECK (target_type IN ('candidate', 'employee'));

-- Add position reference to tests
ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS position_id uuid REFERENCES public.positions(id) ON DELETE SET NULL;

-- Add group reference to tests
ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL;

-- Add person reference to results (nullable for migration)
ALTER TABLE public.results
  ADD COLUMN IF NOT EXISTS person_id uuid REFERENCES public.persons(id) ON DELETE SET NULL;

-- Indexes for new FK columns
CREATE INDEX IF NOT EXISTS idx_tests_target_type ON public.tests(target_type);
CREATE INDEX IF NOT EXISTS idx_tests_position_id ON public.tests(position_id);
CREATE INDEX IF NOT EXISTS idx_tests_group_id ON public.tests(group_id);
CREATE INDEX IF NOT EXISTS idx_results_person_id ON public.results(person_id);
