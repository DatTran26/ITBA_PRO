-- Extend activity_logs entity_type to include job_application
ALTER TABLE public.activity_logs
  DROP CONSTRAINT IF EXISTS activity_logs_entity_type_check;

ALTER TABLE public.activity_logs
  ADD CONSTRAINT activity_logs_entity_type_check
  CHECK (entity_type IN ('person', 'position', 'group', 'skill', 'job_application'));
