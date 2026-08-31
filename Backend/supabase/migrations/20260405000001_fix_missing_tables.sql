-- 1. Create user_version_reads table to track notification status
CREATE TABLE IF NOT EXISTS user_version_reads (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    version_id UUID REFERENCES versions(id) ON DELETE CASCADE,
    read_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, version_id)
);

-- Enable RLS
ALTER TABLE user_version_reads ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own read status"
    ON user_version_reads
    FOR ALL
    USING (auth.uid() IN (SELECT auth_id FROM users WHERE id = user_id));

UPDATE system_settings
SET value = '["gpt-5", "gpt-5-mini", "gpt-4.1", "gpt-4o", "gpt-4o-mini", "gpt-4-turbo", "gemini-2.0-flash"]'::jsonb
WHERE key = 'ai_model_options';

-- Ensure the current model is one of the valid ones (optional but recommended)
-- Only update if the current model is very old or missing
UPDATE system_settings
SET value = '"gpt-5"'::jsonb
WHERE key = 'ai_model' AND (value::text NOT IN (
    '"gpt-5"', '"gpt-5-mini"', '"gpt-4.1"', '"gpt-4o"', '"gpt-4o-mini"', '"gpt-4-turbo"', '"gemini-2.0-flash"'
));
