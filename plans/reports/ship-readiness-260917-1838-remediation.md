# Ship Readiness Remediation

## Result

The repaired working tree type-checks, lints, builds, and passes the discovered
frontend and Vision AI tests. The code is ready for a scoped beta PR from
`develop-dat` to `develop`, pending the final independent review. Docker image
construction remains unavailable locally because the Docker daemon is stopped.

## Source repairs

- Closed the missing function brace in `generate-followup`.
- Replaced the removed `aiModel` reference in the CV Edge Function with
  `aiConfig.model`.
- Sent Gemini API credentials via `x-goog-api-key`, not URL query strings.
- Added an in-memory per-client Face ID attempt limit (five attempts/minute).
- Claimed face re-authentication tokens with a conditional update before image
  processing, releasing the claim only if processing fails.
- Added JWT, role, ownership, and CV/application relationship checks to the
  privileged Supabase Edge Functions before they use a service-role client.
- Prevented a revoked or replaced face re-authentication token from clearing
  the Face ID block, and enforced at most one active request per user.
- Made the Vision AI controller test accept a valid persisted threshold rather
  than a machine-specific default.
- Corrected the Vision migration helper's repository-relative paths.

## Validation

| Check | Result |
| --- | --- |
| `npx tsc --noEmit` | Pass |
| `npx vitest run` | Pass: 24 tests |
| `python -m pytest -q` (Vision AI) | Pass: 13 tests |
| `npm run build` | Pass |
| `npx eslint .` | Pass: 0 errors, 184 existing warnings |
| `docker compose config --quiet` | Pass |
| Docker image build | Not run: Docker daemon unavailable |
| Migration helper syntax | Pass: `python -m py_compile` |

## Database evidence

Read-only checks against staging project `mqwsulanzahqaiecnfwc` confirmed:

- `is_internal_user()`, `face_reauth_requests`, and `users.face_reauth_required`
  exist.
- `ai_provider`, `openai_api_key`, and `gemini_api_key` exist with expected
  input types.
- RLS includes `settings_select_internal`; anonymous REST access cannot read
  either API-key setting.
- Migration ledger contains `20260917160000` and `20260917170000`. The face
  re-auth object exists but `20260917150000` is absent from that ledger, so its
  source application history must be reconciled rather than replayed blindly.

No database writes, backup, migration, deploy, or production connection were
performed.

## Production migration execution

An approved production connection was supplied after the initial audit. Two
custom-format production backups were created outside the repository and
verified with `pg_restore --list`: one before the migration chain and one before
the settings-RLS forward fix.

Production initially lacked `is_internal_user()`, the face re-auth table/flag,
and all three new migration ledger entries. A narrow prerequisite migration was
added to create the role guard without enabling the separate public-assessment
lock. The prerequisite plus the three new migrations were then applied in
individual transactions.

Post-check revealed the old permissive `settings_select_all` policy still
existed, so `20260917170000_ai_provider_settings.sql` was corrected to drop it.
After separately backed-up staging validation, the forward fix was applied to
production. Production now has the role guards, face re-auth objects, expected
settings rows/types, no public settings-select policy, and zero sensitive
settings visible when queried as role `anon` in a read-only transaction.

The active-request guard migration was subsequently backed up, applied, and
post-checked on both staging and production. The unique partial index
`face_reauth_requests_one_active_per_user_idx` exists in both environments.

## Remaining environment limitation

Docker Compose configuration validates, but no local Docker daemon is running,
so an image build cannot be performed in this workspace. The CI pipeline remains
the image-build gate for this PR.
