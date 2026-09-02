-- init_schema created a stub public.notes (bigint id, title).
-- CRM layer needs the polymorphic notes table. Drop the stub only when it
-- has not already been replaced (live already has entity_type).

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notes'
      AND column_name = 'title'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'notes'
      AND column_name = 'entity_type'
  ) THEN
    DROP TABLE public.notes CASCADE;
  END IF;
END $$;
