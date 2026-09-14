-- Live itba-ai junction (dashboard). Links skills to document library entries.

CREATE TABLE IF NOT EXISTS public.skill_documents (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  skill_id uuid NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE (skill_id, document_id)
);

ALTER TABLE public.skill_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS skill_documents_select_all ON public.skill_documents;
CREATE POLICY skill_documents_select_all ON public.skill_documents
  FOR SELECT TO public
  USING (true);

DROP POLICY IF EXISTS skill_documents_insert_own ON public.skill_documents;
CREATE POLICY skill_documents_insert_own ON public.skill_documents
  FOR INSERT TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.skills s
      WHERE s.id = skill_documents.skill_id
        AND (
          s.created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.users
            WHERE auth_id = auth.uid() AND role IN ('admin', 'super_admin')
          )
        )
    )
  );

DROP POLICY IF EXISTS skill_documents_delete_own ON public.skill_documents;
CREATE POLICY skill_documents_delete_own ON public.skill_documents
  FOR DELETE TO public
  USING (
    EXISTS (
      SELECT 1 FROM public.skills s
      WHERE s.id = skill_documents.skill_id
        AND (
          s.created_by IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
          OR EXISTS (
            SELECT 1 FROM public.users
            WHERE auth_id = auth.uid() AND role IN ('admin', 'super_admin')
          )
        )
    )
  );
