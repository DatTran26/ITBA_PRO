-- =============================================================
-- MIGRATION: Talent Assessment & Workforce Evaluation - New Tables
-- =============================================================

-- -----------------------------------------------------
-- TABLE: positions (created before persons due to FK dependency)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.positions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  title varchar NOT NULL,
  department varchar,
  description text,
  target_level varchar,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.positions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "positions_insert_own" ON public.positions
  FOR INSERT TO public
  WITH CHECK (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "positions_select_own" ON public.positions
  FOR SELECT TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "positions_update_own" ON public.positions
  FOR UPDATE TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "positions_delete_own" ON public.positions
  FOR DELETE TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE INDEX idx_positions_created_by ON public.positions(created_by);

-- -----------------------------------------------------
-- TABLE: persons
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.persons (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  full_name varchar NOT NULL,
  email varchar,
  type varchar NOT NULL DEFAULT 'candidate' CHECK (type IN ('candidate', 'employee')),
  department varchar,
  position_id uuid REFERENCES public.positions(id) ON DELETE SET NULL,
  current_level varchar,
  joined_date date,
  phone varchar,
  notes text,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "persons_insert_own" ON public.persons
  FOR INSERT TO public
  WITH CHECK (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "persons_select_own" ON public.persons
  FOR SELECT TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "persons_update_own" ON public.persons
  FOR UPDATE TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "persons_delete_own" ON public.persons
  FOR DELETE TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE INDEX idx_persons_created_by ON public.persons(created_by);
CREATE INDEX idx_persons_type ON public.persons(type);
CREATE INDEX idx_persons_email ON public.persons(email);
CREATE INDEX idx_persons_position_id ON public.persons(position_id);

-- -----------------------------------------------------
-- TABLE: skills
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar NOT NULL,
  category varchar,
  description text,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "skills_insert_own" ON public.skills
  FOR INSERT TO public
  WITH CHECK (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "skills_select_own" ON public.skills
  FOR SELECT TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "skills_update_own" ON public.skills
  FOR UPDATE TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "skills_delete_own" ON public.skills
  FOR DELETE TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE INDEX idx_skills_created_by ON public.skills(created_by);
CREATE INDEX idx_skills_category ON public.skills(category);

-- -----------------------------------------------------
-- TABLE: position_skill_requirements
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.position_skill_requirements (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  position_id uuid NOT NULL REFERENCES public.positions(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  required_level int4 NOT NULL DEFAULT 3 CHECK (required_level BETWEEN 1 AND 5),
  is_mandatory boolean NOT NULL DEFAULT false,
  checklist_order int4 NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(position_id, skill_id)
);

ALTER TABLE public.position_skill_requirements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "psr_insert_own" ON public.position_skill_requirements
  FOR INSERT TO public
  WITH CHECK (position_id IN (
    SELECT id FROM public.positions
    WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  ));

CREATE POLICY "psr_select_own" ON public.position_skill_requirements
  FOR SELECT TO public
  USING (position_id IN (
    SELECT id FROM public.positions
    WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  ));

CREATE POLICY "psr_update_own" ON public.position_skill_requirements
  FOR UPDATE TO public
  USING (position_id IN (
    SELECT id FROM public.positions
    WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  ));

CREATE POLICY "psr_delete_own" ON public.position_skill_requirements
  FOR DELETE TO public
  USING (position_id IN (
    SELECT id FROM public.positions
    WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  ));

CREATE INDEX idx_psr_position_id ON public.position_skill_requirements(position_id);
CREATE INDEX idx_psr_skill_id ON public.position_skill_requirements(skill_id);

-- -----------------------------------------------------
-- TABLE: groups
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.groups (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar NOT NULL,
  type varchar NOT NULL DEFAULT 'other' CHECK (type IN ('department', 'batch', 'campaign', 'other')),
  description text,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "groups_insert_own" ON public.groups
  FOR INSERT TO public
  WITH CHECK (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "groups_select_own" ON public.groups
  FOR SELECT TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "groups_update_own" ON public.groups
  FOR UPDATE TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "groups_delete_own" ON public.groups
  FOR DELETE TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE INDEX idx_groups_created_by ON public.groups(created_by);
CREATE INDEX idx_groups_type ON public.groups(type);

-- -----------------------------------------------------
-- TABLE: group_members
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.group_members (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  group_id uuid NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  UNIQUE(group_id, person_id)
);

ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gm_insert_own" ON public.group_members
  FOR INSERT TO public
  WITH CHECK (group_id IN (
    SELECT id FROM public.groups
    WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  ));

CREATE POLICY "gm_select_own" ON public.group_members
  FOR SELECT TO public
  USING (group_id IN (
    SELECT id FROM public.groups
    WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  ));

CREATE POLICY "gm_delete_own" ON public.group_members
  FOR DELETE TO public
  USING (group_id IN (
    SELECT id FROM public.groups
    WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  ));

CREATE INDEX idx_gm_group_id ON public.group_members(group_id);
CREATE INDEX idx_gm_person_id ON public.group_members(person_id);

-- -----------------------------------------------------
-- TABLE: skill_evaluations
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.skill_evaluations (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  result_id uuid NOT NULL REFERENCES public.results(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  score int4 NOT NULL DEFAULT 0 CHECK (score BETWEEN 0 AND 5),
  status varchar NOT NULL DEFAULT 'not_evaluated' CHECK (status IN ('not_evaluated', 'pass', 'fail')),
  reviewer_comment text,
  ai_insight text,
  evaluated_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(result_id, skill_id)
);

ALTER TABLE public.skill_evaluations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "se_insert_own" ON public.skill_evaluations
  FOR INSERT TO public
  WITH CHECK (evaluated_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "se_select_own" ON public.skill_evaluations
  FOR SELECT TO public
  USING (evaluated_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "se_update_own" ON public.skill_evaluations
  FOR UPDATE TO public
  USING (evaluated_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE POLICY "se_delete_own" ON public.skill_evaluations
  FOR DELETE TO public
  USING (evaluated_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE INDEX idx_se_result_id ON public.skill_evaluations(result_id);
CREATE INDEX idx_se_skill_id ON public.skill_evaluations(skill_id);
CREATE INDEX idx_se_evaluated_by ON public.skill_evaluations(evaluated_by);
