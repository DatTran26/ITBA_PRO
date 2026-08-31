-- =============================================================
-- MIGRATION: Admin Role & Version Management - New Tables
-- Phase 1: system_settings, ai_usage, versions extensions,
--           assessment_templates
-- =============================================================

-- -----------------------------------------------------
-- TABLE: system_settings (key-value config store)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  key varchar NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '""'::jsonb,
  category varchar NOT NULL DEFAULT 'general',
  label varchar NOT NULL,
  description text,
  input_type varchar NOT NULL DEFAULT 'text'
    CHECK (input_type IN ('text', 'number', 'select', 'toggle', 'json')),
  options jsonb, -- for select type: ["option1", "option2"]
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Everyone can read settings (AI routes need config)
CREATE POLICY "settings_select_all" ON public.system_settings
  FOR SELECT TO public USING (true);

-- Only admin can write (enforced at API level too)
CREATE POLICY "settings_update_admin" ON public.system_settings
  FOR UPDATE TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

CREATE INDEX idx_system_settings_category ON public.system_settings(category);
CREATE INDEX idx_system_settings_key ON public.system_settings(key);

-- Seed default settings
INSERT INTO public.system_settings (key, value, category, label, description, input_type, options) VALUES
  -- AI Configuration
  ('ai_model', '"gpt-4o"', 'ai', 'AI Model', 'Default model for question generation', 'select', '["gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gemini-2.0-flash"]'),
  ('ai_temperature', '0.7', 'ai', 'Temperature', 'AI creativity level (0-1)', 'number', null),
  ('ai_max_tokens', '4096', 'ai', 'Max Tokens', 'Maximum tokens per AI request', 'number', null),
  ('token_price_input_per_1k', '0.005', 'ai', 'Input Token Price (per 1K)', 'Cost per 1000 input tokens (USD)', 'number', null),
  ('token_price_output_per_1k', '0.015', 'ai', 'Output Token Price (per 1K)', 'Cost per 1000 output tokens (USD)', 'number', null),
  -- Assessment Defaults
  ('default_question_count', '10', 'assessment', 'Default Question Count', 'Default number of questions per test', 'number', null),
  ('default_time_limit', '30', 'assessment', 'Default Time Limit (min)', 'Default time limit in minutes', 'number', null),
  ('default_passing_score', '70', 'assessment', 'Passing Score (%)', 'Minimum score to pass', 'number', null),
  -- Scoring Rules
  ('scoring_method', '"percentage"', 'scoring', 'Scoring Method', 'How scores are calculated', 'select', '["percentage", "weighted", "pass_fail"]'),
  ('borderline_threshold', '5', 'scoring', 'Borderline Threshold (%)', 'Score range around passing considered borderline', 'number', null)
ON CONFLICT (key) DO NOTHING;

-- -----------------------------------------------------
-- TABLE: ai_usage (token consumption tracking)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  feature varchar NOT NULL,
  model varchar NOT NULL DEFAULT 'gpt-4o',
  tokens_in integer NOT NULL DEFAULT 0,
  tokens_out integer NOT NULL DEFAULT 0,
  cost_estimate numeric(10, 6) NOT NULL DEFAULT 0,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- Admin can read all usage
CREATE POLICY "ai_usage_select_admin" ON public.ai_usage
  FOR SELECT TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid() AND role = 'admin'
    )
  );

-- Service role inserts (bypasses RLS via supabase admin client)
-- No insert policy needed — logAiUsage uses service role

CREATE INDEX idx_ai_usage_created_at ON public.ai_usage(created_at);
CREATE INDEX idx_ai_usage_feature ON public.ai_usage(feature);
CREATE INDEX idx_ai_usage_user_id ON public.ai_usage(user_id);

-- -----------------------------------------------------
-- ALTER: versions table — add category, visibility, created_by
-- -----------------------------------------------------
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'versions' AND column_name = 'category'
  ) THEN
    ALTER TABLE public.versions ADD COLUMN category varchar DEFAULT 'platform';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'versions' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE public.versions ADD COLUMN created_by uuid REFERENCES public.users(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Update versions status CHECK to include draft/archived
-- Drop existing check if any, then add new one
DO $$
BEGIN
  -- Try to drop old constraint
  ALTER TABLE public.versions DROP CONSTRAINT IF EXISTS versions_status_check;
  -- Add updated constraint
  ALTER TABLE public.versions ADD CONSTRAINT versions_status_check
    CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'archived'));
EXCEPTION WHEN OTHERS THEN
  NULL; -- Ignore if constraint doesn't exist or other issues
END $$;

-- -----------------------------------------------------
-- TABLE: assessment_templates
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assessment_templates (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar NOT NULL,
  description text,
  job_role varchar NOT NULL,
  level varchar NOT NULL DEFAULT 'Junior',
  question_count integer NOT NULL DEFAULT 10,
  time_limit integer NOT NULL DEFAULT 30,
  target_type varchar NOT NULL DEFAULT 'candidate',
  job_description text,
  test_description text,
  is_global boolean DEFAULT false, -- admin-created templates visible to all
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.assessment_templates ENABLE ROW LEVEL SECURITY;

-- Everyone can read global templates + own templates
CREATE POLICY "templates_select" ON public.assessment_templates
  FOR SELECT TO public
  USING (
    is_global = true
    OR created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- Users can create own templates
CREATE POLICY "templates_insert_own" ON public.assessment_templates
  FOR INSERT TO public
  WITH CHECK (
    created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  );

-- Owner can update own; admin can update any
CREATE POLICY "templates_update" ON public.assessment_templates
  FOR UPDATE TO public
  USING (
    created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
  );

-- Owner can delete own; admin can delete any
CREATE POLICY "templates_delete" ON public.assessment_templates
  FOR DELETE TO public
  USING (
    created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin')
  );

CREATE INDEX idx_templates_created_by ON public.assessment_templates(created_by);
CREATE INDEX idx_templates_job_role ON public.assessment_templates(job_role);
CREATE INDEX idx_templates_is_global ON public.assessment_templates(is_global);
