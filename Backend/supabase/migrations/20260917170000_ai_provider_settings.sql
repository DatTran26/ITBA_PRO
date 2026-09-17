-- AI provider + Gemini key in system_settings.
-- Core runtime reads these rows; ENV remains last-resort fallback.
-- RLS hides both provider secrets from PostgREST user sessions.

DROP POLICY IF EXISTS settings_select_all ON public.system_settings;
DROP POLICY IF EXISTS settings_select_internal ON public.system_settings;

CREATE POLICY settings_select_internal ON public.system_settings
  FOR SELECT TO authenticated
  USING (
    public.is_internal_user()
    AND key <> ALL (ARRAY['openai_api_key', 'gemini_api_key']::text[])
  );

INSERT INTO public.system_settings (key, value, category, label, description, input_type, options)
VALUES
  (
    'ai_provider',
    '"openai"'::jsonb,
    'ai',
    'AI Provider',
    'Active model provider. API calls use this provider and its matching key from System Settings.',
    'select',
    '["openai", "gemini"]'::jsonb
  ),
  (
    'gemini_api_key',
    '""'::jsonb,
    'ai',
    'Gemini API Key',
    'Server-side Google Gemini key. Never exposed to the browser.',
    'password',
    null
  )
ON CONFLICT (key) DO UPDATE SET
  category = EXCLUDED.category,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  input_type = EXCLUDED.input_type,
  options = COALESCE(EXCLUDED.options, public.system_settings.options);

UPDATE public.system_settings
SET
  options = '["gpt-5", "gpt-5-mini", "gpt-4.1", "gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.0-flash"]'::jsonb,
  description = 'Default model for the selected AI provider. The Settings UI lists models for the active provider only.'
WHERE key = 'ai_model';
