# Staging and Production Stability Audit

Date: 2026-09-13  
Scope: Town Hown staging rebuild and production read-only verification

## Outcome

Staging is functional and has the remediation needed for a safe dashboard RPC.
Production is **not yet stable for release**: it has a confirmed anonymous dashboard-data exposure, stale documented test credentials, and deployment-version drift. No production record, configuration, or deployment was modified.

## Completed staging work

- Created a recoverable, pre-change staging snapshot outside the repository.
- Applied all 46 repository migrations, then two remediation migrations.
- Provisioned and verified all six supplied dashboard test accounts; each can authenticate and has the intended internal role with forced password change enabled.
- Updated the non-repository account handoff file to say the six production passwords require reset; no production password was changed.
- Corrected the stale `user_role` alterations that prevented a clean schema rebuild.
- Corrected the enum/text comparison in the recruitment dashboard funnel query.
- Hardened `public.recruitment_dashboard` with a fixed search path, an internal-user authorization guard, and explicit anonymous-execution revocation.
- Updated staging GitHub environment public URL, anonymous key, and project-reference variables. No service-role credential was placed in source control or GitHub variables.

## Verification

| Check | Staging | Production |
|---|---|---|
| Public root and login routes | Pass (HTTP 200) | Pass (HTTP 200) |
| `/api/health` | Pass (HTTP 200) | Pass (HTTP 200) |
| Dashboard RPC as anonymous | Pass: denied (HTTP 401) | **Fail: returns HTTP 200** |
| Dashboard RPC as internal account | Pass (HTTP 200) | Not tested; supplied test passwords fail authentication |
| Six supplied account logins | Pass | **Fail: all six rejected** |
| Frontend production build | Pass | Same source artifact; deployment is behind |
| Frontend lint | **Fail: 34 errors, 152 warnings** | Same committed baseline; not modified in this audit |
| OCR module build and tests | Pass: 32/32 tests | Same source artifact |
| Compose configuration | Pass | Same source artifact |

## Source changes ready to release

- `20260419000000_recruitment_schema.sql`: removes nonexistent `user_role` alterations so a fresh staging database can migrate.
- `20260419000004_recruitment_dashboard_rpc.sql`: uses a valid `pipeline_status::text = stage` comparison.
- `20260913055253_secure_definer_functions.sql`: locks down the dashboard aggregate function.
- `20260913055617_fix_dashboard_pipeline_status.sql`: upgrades environments where the first hardening migration was already applied before the enum comparison repair.
- OCR frontend manifests: add the missing Tailwind/PostCSS build dependencies required by its existing configuration.

## Production release blockers

1. **Security:** production allows anonymous execution of `recruitment_dashboard`; the release migration must reach production through the normal Gitflow release path before calling the environment stable.
2. **Credentials:** all six supplied production test passwords are invalid. Resetting production users is an externally visible change and needs explicit authorization.
3. **Deployment drift:** production reports app build `1.6.4` from 2026-09-02 while the approved database version is `1.7.0`; release/deployment reconciliation is required.
4. **Auth policy:** leaked-password protection is disabled in both Supabase projects. Enable it under an approved environment/configuration change.
5. **CI quality gate:** the committed Frontend baseline has 34 ESLint errors and 152 warnings across unrelated UI/API files. It must be remediated or the lint policy adjusted by its owners before treating CI as green.

## Additional advisory findings

Supabase advisors also reported mutable function search-path, SECURITY DEFINER execution-grant, RLS-policy performance, unindexed foreign-key, unused-index, and permissive-policy findings. The dashboard RPC's runtime authorization and search path are now remediated in staging. The remaining items need targeted review before changing live access policies or indexes.

## Unresolved questions

- Should the six production test accounts be reset now, and if so who should receive the new credentials?
- Who will promote `develop-dat` through `develop`, a release branch, and `main` to deploy the security migration?
- Is enabling Supabase leaked-password protection approved for both environments?

## Re-verification (2026-09-13, HEAD `cc6efbb`)

- OCR module: `vitest run` 32/32 pass; `tsc -b && vite build` clean.
- Main frontend: `next build` pass (compile, TypeScript, 71 static pages).
- Staging web: `/` and `/login` return 200, `/api/health` returns ok.
- Production web: `/` 200, `/api/health` ok; anonymous `recruitment_dashboard` RPC still returns HTTP 200 (blocker 1 stands).
- **New finding:** `kxpunppvqfxfqdwpqpmp.supabase.co` no longer resolves (NXDOMAIN via public DNS). The staging Supabase project is paused or deleted, so staging logins and DB-backed routes will fail until it is restored or the disposable project is recreated from the snapshot at `C:\Users\ACER\.codex\backups\town-hown`. The staging MCP token also lacks database read permissions, so DB-level re-checks were not possible in this pass.

## Re-verification (2026-09-13, HEAD `db274f2`)

- OCR module: `vitest run` 32/32 pass; `tsc -b && vite build` clean.
- Main frontend: `next build` pass (compile, TypeScript, 71 static pages).
- Staging web: `/`, `/login`, `/api/health` return 200; `kxpunppvqfxfqdwpqpmp.supabase.co` still unreachable — later identified as the superseded staging project, not an outage (see Re-verification 2). The live frontend bundle points at `mqwsulanzahqaiecnfwc.supabase.co`, which responds normally.
- Production web: `/`, `/api/health` 200; production Supabase reachable.
- Anonymous `recruitment_dashboard` RPC against production still returns HTTP 200 with live aggregate data — blocker 1 stands until the security migration is promoted through the release flow.

## Re-verification 2 (2026-09-13, HEAD `db274f2`) — staging outage was a stale-ref false alarm

The dead `kxpunppvqfxfqdwpqpmp` is the **superseded** staging project. The active staging project is the replacement `mqwsulanzahqaiecnfwc`, created during this audit (snapshot manifest `project_ref` and account handoff confirm "new project"). Verified live:

- `mqwsulanzahqaiecnfwc.supabase.co` resolves; bare REST returns 401 (normal without key).
- GitHub `staging` environment already points at it: `SUPABASE_PROJECT_REF=mqwsulanzahqaiecnfwc`, matching `NEXT_PUBLIC_SUPABASE_URL` and anon JWT `ref` claim. No env update needed.
- Staging web: `/` 200, `/api/health` `{"ok":true}`.
- All 6 staging test accounts authenticate via `/auth/v1/token` password grant (HTTP 200, token issued).
- `recruitment_dashboard` RPC: anonymous → 401 `permission denied`; `test.superadmin` → 200 with full 8-stage funnel — confirms both `secure_definer_functions` and `fix_dashboard_pipeline_status` are applied and working.
- Schema coverage: 19 representative tables across the migration range (`users`, `persons`, `versions`, `skills`, `interview_sessions`, `job_applications`, `candidate_cvs`, `assessment_templates`, `crm_tasks`, …) all return 200 via REST — consistent with all 48 repo migrations applied. Direct `schema_migrations` row count was not possible: the staging MCP token still lacks DB read permission.
- Production project ref is `lhvdtmieaplxzqmpmupe` — a separate project, untouched.

**Conclusion:** no restore was required. Staging is functional; blockers 1–5 stand for production only.
