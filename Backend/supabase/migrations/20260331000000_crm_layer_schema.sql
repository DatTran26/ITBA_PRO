-- =============================================================
-- MIGRATION: CRM Layer Schema - Notes, Tags, Tasks, Activity Logs, Person Skills
-- =============================================================

-- -----------------------------------------------------
-- ALTER: persons - add status column
-- -----------------------------------------------------
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS status varchar NOT NULL DEFAULT 'active';
ALTER TABLE public.persons DROP CONSTRAINT IF EXISTS persons_status_check;
ALTER TABLE public.persons ADD CONSTRAINT persons_status_check CHECK (status IN ('active', 'in_review', 'training_needed', 'skill_gap', 'ready_for_promotion', 'on_hold', 'inactive'));
CREATE INDEX IF NOT EXISTS idx_persons_status ON public.persons(status);

-- -----------------------------------------------------
-- ALTER: positions - add status column
-- -----------------------------------------------------
ALTER TABLE public.positions ADD COLUMN IF NOT EXISTS status varchar NOT NULL DEFAULT 'active';
ALTER TABLE public.positions DROP CONSTRAINT IF EXISTS positions_status_check;
ALTER TABLE public.positions ADD CONSTRAINT positions_status_check CHECK (status IN ('active', 'draft', 'review_needed', 'deprecated', 'archived'));
CREATE INDEX IF NOT EXISTS idx_positions_status ON public.positions(status);

-- -----------------------------------------------------
-- ALTER: groups - add status column
-- -----------------------------------------------------
ALTER TABLE public.groups ADD COLUMN IF NOT EXISTS status varchar NOT NULL DEFAULT 'healthy';
ALTER TABLE public.groups DROP CONSTRAINT IF EXISTS groups_status_check;
ALTER TABLE public.groups ADD CONSTRAINT groups_status_check CHECK (status IN ('healthy', 'needs_attention', 'understaffed', 'skill_risk', 'inactive'));
CREATE INDEX IF NOT EXISTS idx_groups_status ON public.groups(status);

-- -----------------------------------------------------
-- TABLE: person_skills
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.person_skills (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id uuid NOT NULL REFERENCES public.persons(id) ON DELETE CASCADE,
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  current_level int4 NOT NULL DEFAULT 1 CHECK (current_level BETWEEN 1 AND 5),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(person_id, skill_id)
);

ALTER TABLE public.person_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ps_insert_own" ON public.person_skills FOR INSERT TO public
  WITH CHECK (person_id IN (SELECT id FROM public.persons WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));
CREATE POLICY "ps_select_own" ON public.person_skills FOR SELECT TO public
  USING (person_id IN (SELECT id FROM public.persons WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));
CREATE POLICY "ps_update_own" ON public.person_skills FOR UPDATE TO public
  USING (person_id IN (SELECT id FROM public.persons WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));
CREATE POLICY "ps_delete_own" ON public.person_skills FOR DELETE TO public
  USING (person_id IN (SELECT id FROM public.persons WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));

CREATE INDEX idx_ps_person_id ON public.person_skills(person_id);
CREATE INDEX idx_ps_skill_id ON public.person_skills(skill_id);

-- -----------------------------------------------------
-- TABLE: notes (polymorphic)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.notes (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type varchar NOT NULL CHECK (entity_type IN ('person', 'position', 'group')),
  entity_id uuid NOT NULL,
  content text NOT NULL,
  note_type varchar NOT NULL DEFAULT 'general' CHECK (note_type IN ('general', 'warning', 'feedback', 'development', 'recruitment')),
  is_pinned boolean NOT NULL DEFAULT false,
  author_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notes_insert_own" ON public.notes FOR INSERT TO public
  WITH CHECK (author_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "notes_select_own" ON public.notes FOR SELECT TO public
  USING (author_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "notes_update_own" ON public.notes FOR UPDATE TO public
  USING (author_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "notes_delete_own" ON public.notes FOR DELETE TO public
  USING (author_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE INDEX idx_notes_entity ON public.notes(entity_type, entity_id);
CREATE INDEX idx_notes_author ON public.notes(author_id);

-- -----------------------------------------------------
-- TABLE: activity_logs (polymorphic, insert-only for audit)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type varchar NOT NULL CHECK (entity_type IN ('person', 'position', 'group', 'skill')),
  entity_id uuid NOT NULL,
  action varchar NOT NULL,
  details jsonb,
  actor_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "al_insert_own" ON public.activity_logs FOR INSERT TO public
  WITH CHECK (actor_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "al_select_own" ON public.activity_logs FOR SELECT TO public
  USING (actor_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE INDEX idx_al_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX idx_al_actor ON public.activity_logs(actor_id);
CREATE INDEX idx_al_created ON public.activity_logs(created_at DESC);

-- -----------------------------------------------------
-- TABLE: tags
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name varchar NOT NULL,
  color varchar NOT NULL DEFAULT '#7C8FFF',
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(name, created_by)
);

ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tags_insert_own" ON public.tags FOR INSERT TO public
  WITH CHECK (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "tags_select_own" ON public.tags FOR SELECT TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "tags_update_own" ON public.tags FOR UPDATE TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "tags_delete_own" ON public.tags FOR DELETE TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE INDEX idx_tags_created_by ON public.tags(created_by);

-- -----------------------------------------------------
-- TABLE: entity_tags (polymorphic junction)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.entity_tags (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  entity_type varchar NOT NULL CHECK (entity_type IN ('person', 'position', 'group')),
  entity_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(tag_id, entity_type, entity_id)
);

ALTER TABLE public.entity_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "et_insert_own" ON public.entity_tags FOR INSERT TO public
  WITH CHECK (tag_id IN (SELECT id FROM public.tags WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));
CREATE POLICY "et_select_own" ON public.entity_tags FOR SELECT TO public
  USING (tag_id IN (SELECT id FROM public.tags WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));
CREATE POLICY "et_delete_own" ON public.entity_tags FOR DELETE TO public
  USING (tag_id IN (SELECT id FROM public.tags WHERE created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())));

CREATE INDEX idx_et_entity ON public.entity_tags(entity_type, entity_id);
CREATE INDEX idx_et_tag ON public.entity_tags(tag_id);

-- -----------------------------------------------------
-- TABLE: crm_tasks (follow-up tasks linked to entities)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type varchar NOT NULL CHECK (entity_type IN ('person', 'position', 'group')),
  entity_id uuid NOT NULL,
  title varchar NOT NULL,
  description text,
  status varchar NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  assignee_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  due_date date,
  created_by uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ct_insert_own" ON public.crm_tasks FOR INSERT TO public
  WITH CHECK (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "ct_select_own" ON public.crm_tasks FOR SELECT TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "ct_update_own" ON public.crm_tasks FOR UPDATE TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));
CREATE POLICY "ct_delete_own" ON public.crm_tasks FOR DELETE TO public
  USING (created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid()));

CREATE INDEX idx_ct_entity ON public.crm_tasks(entity_type, entity_id);
CREATE INDEX idx_ct_assignee ON public.crm_tasks(assignee_id);
CREATE INDEX idx_ct_status ON public.crm_tasks(status);
CREATE INDEX idx_ct_created_by ON public.crm_tasks(created_by);
