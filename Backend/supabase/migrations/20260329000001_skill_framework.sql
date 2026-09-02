-- =============================================================
-- MIGRATION: Skill Framework - Categories & Level Expectations
-- =============================================================

-- skill_categories table
CREATE TABLE IF NOT EXISTS public.skill_categories (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar NOT NULL UNIQUE,
  description text,
  display_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skill_categories_select_all" ON public.skill_categories FOR SELECT TO public USING (true);
CREATE POLICY "skill_categories_admin_write" ON public.skill_categories FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'));

-- Seed defaults
INSERT INTO public.skill_categories (name, description, display_order) VALUES
  ('Technical Skills', 'Programming, frameworks, tools', 1),
  ('Business Analysis', 'Requirements, process modeling', 2),
  ('Communication', 'Presentation, writing, teamwork', 3),
  ('Soft Skills', 'Problem-solving, leadership', 4),
  ('Domain Knowledge', 'Industry-specific expertise', 5)
ON CONFLICT (name) DO NOTHING;

-- Add category_id FK to skills (optional, backward compat)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='skills' AND column_name='category_id') THEN
    ALTER TABLE public.skills ADD COLUMN category_id uuid REFERENCES public.skill_categories(id) ON DELETE SET NULL;
    CREATE INDEX idx_skills_category_id ON public.skills(category_id);
  END IF;
END $$;

-- level_skill_expectations table
CREATE TABLE IF NOT EXISTS public.level_skill_expectations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  level varchar NOT NULL CHECK (level IN ('intern','fresher','junior','mid','senior','lead')),
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  position_id uuid REFERENCES public.positions(id) ON DELETE CASCADE,
  expected_score integer NOT NULL DEFAULT 3 CHECK (expected_score BETWEEN 1 AND 5),
  is_mandatory boolean DEFAULT false,
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(level, skill_id, position_id)
);
ALTER TABLE public.level_skill_expectations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "level_expectations_select_all" ON public.level_skill_expectations FOR SELECT TO public USING (true);
CREATE POLICY "level_expectations_admin_write" ON public.level_skill_expectations FOR ALL TO public
  USING (EXISTS (SELECT 1 FROM public.users WHERE auth_id = auth.uid() AND role = 'admin'));
