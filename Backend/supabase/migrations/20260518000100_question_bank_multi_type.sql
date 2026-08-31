-- Extend question bank and test questions for multiple question formats and manual grading.

ALTER TABLE question_bank
  ADD COLUMN IF NOT EXISTS question_type VARCHAR(50) NOT NULL DEFAULT 'single_choice',
  ADD COLUMN IF NOT EXISTS answer_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS grading_mode VARCHAR(20) NOT NULL DEFAULT 'auto';

ALTER TABLE questions
  ADD COLUMN IF NOT EXISTS question_type VARCHAR(50) NOT NULL DEFAULT 'single_choice',
  ADD COLUMN IF NOT EXISTS answer_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS grading_mode VARCHAR(20) NOT NULL DEFAULT 'auto';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'question_bank_correct_answer_check'
      AND conrelid = 'question_bank'::regclass
  ) THEN
    ALTER TABLE question_bank DROP CONSTRAINT question_bank_correct_answer_check;
  END IF;
END $$;

ALTER TABLE question_bank
  ALTER COLUMN option_a DROP NOT NULL,
  ALTER COLUMN option_b DROP NOT NULL,
  ALTER COLUMN option_c DROP NOT NULL,
  ALTER COLUMN option_d DROP NOT NULL,
  ALTER COLUMN correct_answer DROP NOT NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'question_bank_correct_answer_check'
      AND conrelid = 'question_bank'::regclass
  ) THEN
    ALTER TABLE question_bank
      ADD CONSTRAINT question_bank_correct_answer_check
      CHECK (correct_answer IS NULL OR correct_answer = ANY (ARRAY['a'::bpchar, 'b'::bpchar, 'c'::bpchar, 'd'::bpchar]));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'question_bank_grading_mode_check'
      AND conrelid = 'question_bank'::regclass
  ) THEN
    ALTER TABLE question_bank
      ADD CONSTRAINT question_bank_grading_mode_check
      CHECK (grading_mode IN ('auto', 'manual'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'questions_grading_mode_check'
      AND conrelid = 'questions'::regclass
  ) THEN
    ALTER TABLE questions
      ADD CONSTRAINT questions_grading_mode_check
      CHECK (grading_mode IN ('auto', 'manual'));
  END IF;
END $$;

UPDATE question_bank
SET answer_payload = jsonb_build_object(
    'correct_answer', correct_answer,
    'options', jsonb_build_object('a', option_a, 'b', option_b, 'c', option_c, 'd', option_d)
  )
WHERE answer_payload = '{}'::jsonb;

UPDATE questions
SET answer_payload = jsonb_build_object('correct_answer', correct_answer, 'options', options)
WHERE answer_payload = '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_question_bank_question_type ON question_bank(question_type);
CREATE INDEX IF NOT EXISTS idx_question_bank_level_topic_type ON question_bank(level, topic_tag, question_type);
