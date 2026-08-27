# Debugger Report — Regenerate Question 500 Error
**Date:** 2026-03-20
**Slug:** regenerate-500-fix

---

## Root Cause

**Missing RLS `UPDATE` and `DELETE` policies on the `questions` table.**

The route at `POST /api/ai/regenerate` uses the server Supabase client (anon key + user session cookie), which is subject to Row Level Security. The initial schema migration only defined two policies:

| Operation | Policy | Status |
|-----------|--------|--------|
| SELECT    | `questions_select` | existed |
| INSERT    | `questions_insert` | existed |
| UPDATE    | `questions_update_own` | **missing** |
| DELETE    | `questions_delete_own` | **missing** |

- Single-question mode calls `.update()` on `questions` → blocked → Supabase returns RLS error → route returns 500
- Full regeneration calls `.delete()` on `questions` → blocked → same result

The OpenAI model (`gpt-5`), timeout config (`300_000ms`), and `maxDuration=300` were all correct and not contributing to the failure.

---

## Evidence

1. `gpt-5` API call tested directly — succeeded in ~7s, no issue.
2. Service-role DB test (bypasses RLS) — UPDATE succeeded.
3. Schema audit of `supabase/migrations/20260310000000_init_schema.sql` — confirmed no UPDATE or DELETE policy for `questions`.
4. No follow-up migrations added these policies.

---

## Fix Applied

### 1. New migration file
`supabase/migrations/20260320000002_questions_update_delete_policies.sql`

```sql
CREATE POLICY "questions_update_own"
  ON public.questions FOR UPDATE TO public
  USING (test_id IN (
    SELECT id FROM public.tests
    WHERE recruiter_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  ));

CREATE POLICY "questions_delete_own"
  ON public.questions FOR DELETE TO public
  USING (test_id IN (
    SELECT id FROM public.tests
    WHERE recruiter_id IN (SELECT id FROM public.users WHERE auth_id = auth.uid())
  ));
```

### 2. Applied to live DB
Executed via `pg` client against `DATABASE_URL`. Verified with `pg_policies` query — all 4 policies now present (DELETE, INSERT, SELECT, UPDATE).

### 3. Console.log checkpoints added to route
`src/app/api/ai/regenerate/route.ts` — checkpoints at:
- Request start (test_id, question_id, user_id)
- AI call entry (both modes)
- AI call completion
- Each DB operation (delete/insert/update) entry and error with code+message

---

## Files Changed

- `supabase/migrations/20260320000002_questions_update_delete_policies.sql` — new migration
- `src/app/api/ai/regenerate/route.ts` — added console.log checkpoints + error detail logging

---

## Unresolved Questions

None. Root cause identified and fixed.
