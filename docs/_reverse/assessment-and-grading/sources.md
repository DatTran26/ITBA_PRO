# Sources — Assessment và grading

## Primary code

- `Frontend/src/app/api/tests/route.ts:9` — list tests.
- `Frontend/src/app/api/tests/route.ts:49` — create test.
- `Frontend/src/app/api/tests/route.ts:124` — share token persisted.
- `Frontend/src/app/api/tests/[id]/route.ts:13` — aggregate questions/results.
- `Frontend/src/app/api/results/route.ts:66` — submission scoring boundary.
- `Frontend/src/app/api/results/[id]/grade/route.ts:7` — manual grade command.
- `Frontend/src/lib/grading/recompute-result-score.ts:15` — score owner.
- `Frontend/src/app/api/followup-sessions/[id]/route.ts:8` — follow-up read.

## Schema

- `Backend/supabase/migrations/20260310000000_init_schema.sql:27` — tests.
- `Backend/supabase/migrations/20260310000000_init_schema.sql:55` — questions.
- `Backend/supabase/migrations/20260310000000_init_schema.sql:78` — results.
- `Backend/supabase/migrations/20260525000000_manual_grading.sql:11` — grades.
- `Backend/supabase/migrations/20260319000000_follow_up_sessions.sql:6` — follow-up.

## Confidence

Implementation existence: high. Business policy completeness: medium vì không
có approved SRS/test suite và một số policy ban đầu dùng `USING (true)`.
