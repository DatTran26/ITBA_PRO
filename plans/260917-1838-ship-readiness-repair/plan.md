# Ship Readiness Repair and Migration Validation

Status: ready for scoped ship review

## Outcome

Repair the verified release blockers in the current Town Hown working tree and
produce fresh source, test, container, and database-migration evidence. Check
the new migration chain against staging and production without mutating either
database until a verified backup and target-specific approval exist.

## Constraints

- Preserve unrelated dirty changes; do not stage, commit, deploy, or delete
  artifacts outside the repaired scope.
- Never expose or commit environment values, tokens, backups, or credentials.
- Database inspection is read-only. Any migration requires a target-specific
  backup plus a tested recovery path; staging precedes production.
- Do not apply the assessment-access lock migration as an incidental dependency.

## Phases

1. Confirm release blockers, working-tree ownership, and database targets. Complete.
2. Repair source and test-isolation defects, then review security findings. Complete for the identified functional/security defects.
3. Run typecheck, lint, build, unit tests, Python tests, and container checks. Complete: all code gates pass; Docker image construction remains unavailable because the local Docker daemon is stopped.
4. Inspect staging and production migration/object state and create a safe migration runbook. Complete: backups verified, migration chain applied, and post-checks passed.
5. Reconcile documentation/plan evidence and prepare a scoped ship handoff. Complete pending final read-only review.

## Acceptance Criteria

- The repaired source passes relevant compile, test, lint, and production-build gates.
- The new migration chain is valid against live staging and production object state.
- Any database mutation has an independently verified, recoverable backup.
- Production changes are not applied without staging evidence and explicit target confirmation.
- The eventual commit scope contains no secrets, generated artifacts, or unrelated files.

## Risk and Rollback

Source edits are locally reversible through version control. Database changes
remain blocked until a custom-format backup is created outside the repository,
verified with `pg_restore --list`, and associated with the exact target.
