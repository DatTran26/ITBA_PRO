-- Extend notes entity_type to include job_application for CV notes
ALTER TABLE public.notes
  DROP CONSTRAINT IF EXISTS notes_entity_type_check;

ALTER TABLE public.notes
  ADD CONSTRAINT notes_entity_type_check
  CHECK (entity_type IN ('person', 'position', 'group', 'skill', 'job_application'));
