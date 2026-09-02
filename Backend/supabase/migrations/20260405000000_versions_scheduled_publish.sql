-- Add scheduled_publish_at column to versions table
-- Allows super admins to schedule when a pending version auto-transitions to approved
ALTER TABLE versions ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMPTZ NULL;
