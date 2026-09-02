-- Skill-scoped question bank: add nullable skill_id to document_sources + question_bank.
-- null skill_id = global question bank (existing behavior); set = skill-scoped.
-- RLS unchanged: existing role-based policies (select = any authed user, write = leader/admin)
-- already cover skill-scoped rows; they do not reference skill_id, so the global path is untouched.

ALTER TABLE document_sources
  ADD COLUMN IF NOT EXISTS skill_id uuid REFERENCES skills(id) ON DELETE SET NULL;

ALTER TABLE question_bank
  ADD COLUMN IF NOT EXISTS skill_id uuid REFERENCES skills(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_document_sources_skill ON document_sources(skill_id);
CREATE INDEX IF NOT EXISTS idx_question_bank_skill ON question_bank(skill_id);
