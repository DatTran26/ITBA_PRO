-- Restore the System Settings OpenAI API key row.
-- UI already renders input_type=password for openai_api_key, but:
--   1. the key was never seeded
--   2. CHECK(input_type) did not allow 'password'
-- RLS still hides openai_api_key from PostgREST; admin UI must read via service role.

DO $$
DECLARE
  conname text;
BEGIN
  SELECT c.conname INTO conname
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND t.relname = 'system_settings'
    AND c.contype = 'c'
    AND pg_get_constraintdef(c.oid) ILIKE '%input_type%';

  IF conname IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.system_settings DROP CONSTRAINT %I', conname);
  END IF;
END $$;

ALTER TABLE public.system_settings
  ADD CONSTRAINT system_settings_input_type_check
  CHECK (input_type IN ('text', 'number', 'select', 'toggle', 'json', 'password'));

INSERT INTO public.system_settings (key, value, category, label, description, input_type, options)
VALUES (
  'openai_api_key',
  '""'::jsonb,
  'ai',
  'OpenAI API Key',
  'Server-side key for question generation, CV screening, and other AI features. Never exposed to the browser.',
  'password',
  null
)
ON CONFLICT (key) DO UPDATE SET
  category = EXCLUDED.category,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  input_type = EXCLUDED.input_type;
