-- Capture live itba-ai versions table (dashboard-created; repo previously
-- only ALTERed it). Idempotent for existing projects.

CREATE TABLE IF NOT EXISTS public.versions (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  version_number varchar(20) NOT NULL,
  title varchar(200) NOT NULL,
  description text,
  features jsonb DEFAULT '[]'::jsonb,
  status varchar(20) DEFAULT 'pending',
  approved_at timestamptz,
  notes text,
  created_at timestamptz DEFAULT now(),
  category varchar DEFAULT 'platform',
  created_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now(),
  ui_changes text,
  ux_changes text,
  bug_fixes text,
  is_critical boolean DEFAULT false,
  scheduled_publish_at timestamptz
);

ALTER TABLE public.versions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "versions_select_authenticated" ON public.versions;
CREATE POLICY "versions_select_authenticated" ON public.versions
  FOR SELECT TO public
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "versions_update_status_authenticated" ON public.versions;
CREATE POLICY "versions_update_status_authenticated" ON public.versions
  FOR UPDATE TO public
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);
