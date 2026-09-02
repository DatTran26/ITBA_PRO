-- =============================================================
-- UI Layout setting — global navigation layout switcher
-- Decision refs: brainstorm 260501-1627 #5, #6, #12
-- =============================================================

-- 1. Seed the ui_layout row (idempotent)
INSERT INTO public.system_settings (key, value, category, label, description, input_type, options)
VALUES (
  'ui_layout',
  '"topnav"'::jsonb,
  'appearance',
  'Navigation Layout',
  'Global navigation layout for all users (topnav or sidebar). Changes broadcast in real time.',
  'select',
  '["topnav", "sidebar"]'::jsonb
)
ON CONFLICT (key) DO NOTHING;

-- 2. Extend update policy so super_admin can write (was admin-only)
DROP POLICY IF EXISTS settings_update_admin ON public.system_settings;
CREATE POLICY settings_update_admin ON public.system_settings
  FOR UPDATE TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- 3. Ensure system_settings is in the realtime publication (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'system_settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.system_settings;
  END IF;
END $$;
