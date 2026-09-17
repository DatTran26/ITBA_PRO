# Staging and Production Stability Audit

Status: release remediation ready; production remains blocked; staging verified healthy on replacement project mqwsulanzahqaiecnfwc (dead ref kxpunppvqfxfqdwpqpmp is the superseded old project — NXDOMAIN expected, nothing references it)

## Outcome

Verify that the Town Hown application can build and run correctly against both staging and production, while keeping production read-only. Repair defects that prevent a clean staging rebuild or safe dashboard access, then push the focused source changes on `develop-dat`.

## Constraints

- Production database and configuration are read-only during this audit.
- Staging changes require a recoverable pre-change snapshot.
- Do not commit credentials, account files, or environment files.
- Preserve unrelated working-tree changes.

## Phases

1. Establish the environment mapping and create a staging recovery snapshot. Complete.
2. Rebuild staging schema and provision the six test dashboard accounts. Complete, pending regression checks.
3. Repair migration and dashboard-RPC defects found during the rebuild. Complete.
4. Run code, deployment-config, database, authentication, RLS, and public-endpoint checks for both environments. Complete; production release blockers documented in the QA report.
5. Commit and push only the focused migration changes after all relevant checks pass. Complete: `73143dc` and `fc7840d` were pushed to `origin/develop-dat`.

## Acceptance Criteria

- Staging contains every repository migration and its six confirmed test accounts.
- The dashboard RPC denies anonymous access and works for an authorized internal account.
- Production and staging URLs, public keys, and project references are internally consistent.
- Relevant build and automated tests pass, or failures are documented with root cause and impact.
- Production checks do not modify database records, configuration, or deployment state.
- The commit contains no secret or unrelated file.

## Risk and Rollback

The local recovery snapshot is stored outside the repository at `C:\Users\ACER\.codex\backups\town-hown`. Staging schema rollback requires restoring from that snapshot or recreating the disposable staging project. Each newly provisioned account can be deleted through the Supabase Auth Admin API together with its `public.users` record.
