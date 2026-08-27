# Acme Cloud — Commit Dialect (Example)

> Example dialect file showing what a project's `docs/features/references/COMMIT.md` looks like once filled in. **Acme Cloud** is a fictional but realistic mid-sized SaaS — pnpm monorepo with admin / dashboard / public apps, shared UI and DB packages, Linear ticket integration, squash-merge PR policy, feature flags via LaunchDarkly. Use as a reference when scaffolding your own dialect.
>
> The other shipped exemplars in this skill cover different operating models — pick whichever resembles your project most:
> - **Acme Cloud** (this file) — pnpm monorepo + Linear + LaunchDarkly + squash-merge PRs
> - `examples/good-commits.md` §J — Linux kernel / Postgres style (long-form narrative bodies)
> - `examples/good-commits.md` §K — generic monorepo + feature-flag rollouts

---

## 1. Domain Proper Nouns

Terms that should NOT be translated to English in commit summaries or bodies. Keep them in original script.

| Term | English equivalent (do NOT use) | Why kept |
|---|---|---|
| `Acme Cloud` | "the platform" | product brand name (always rendered as written) |
| `Acme Pay` | "billing module" | sub-product brand |
| `LDAP-Bridge` | (do not translate) | internal service name |
| `BoardKit` | (do not translate) | open-source library name (case preserved) |

> If your project uses non-English domain terms (regulatory references, native-language product names, statute citations), list them here. This avoids translation-by-mistake (e.g., turning `BoardKit` into "board kit" in a commit subject, breaking `git log --grep="BoardKit"`).

---

## 2. Scope Catalog (200-commit empirical, 2026-05)

Top-frequency `type(scope)` patterns. Regenerate quarterly via `~/.claude/skills/principled-git-commit/scripts/analyze-history.sh 200`.

| Scope | Frequency | Description |
|---|:--:|---|
| `apps/dashboard` | 24 | Next.js dashboard app |
| `apps/admin` | 18 | Internal admin tool |
| `apps/public` | 12 | Marketing site |
| `packages/ui` | 31 | Shared component library (BoardKit-based) |
| `packages/db` | 14 | Drizzle schema + migrations |
| `packages/api-client` | 9 | Generated typed client |
| `packages/billing` | 7 | Acme Pay primitives |
| `infra` | 11 | Terraform + GitHub Actions |
| `docs` | 16 | repo-level docs (`docs/`, `README.md`) |

### 2.1 Sub-scopes in active use

`apps/dashboard/settings`, `apps/dashboard/billing`, `apps/admin/users`, `packages/ui/Form`, `packages/ui/Table`, `packages/db/migrations`

### 2.2 Multi-scope examples

`docs(claude,refs)`, `chore(deps,ci)`, `fix(packages/ui,apps/dashboard)`

### 2.3 Feature-scopes (long-running migrations)

`auth-rewrite-2026-q2`, `acme-pay-launch`, `multi-region-ga`

---

## 3. Custom Trailers

| Token | Purpose | Example |
|---|---|---|
| `Refs:` | Linear ticket reference (no auto-close) | `Refs: ACM-1234` |
| `Closes:` | Linear ticket auto-close on merge | `Closes: ACM-1234` |
| `Flag:` | LaunchDarkly feature flag involved | `Flag: billing-invoice-pdf-v2` |
| `Storybook:` | Storybook story added/changed | `Storybook: components/ui-button--all-variants` |
| `Rollout:` | Phased rollout target | `Rollout: 5% → 50% → 100% over 3 weeks` |

Standard trailers from universal §8 (`Co-authored-by:`, `BREAKING CHANGE:`, `Reviewed-by:`) also apply.

---

## 4. Workflow Integration — squash-merge PR + Linear

Acme Cloud uses GitHub squash-merge with a strict commit policy. Every merged PR becomes one commit on `main`. Inside a feature branch, intermediate commits are encouraged for ergonomics — the PR description becomes the squashed commit body.

### 4.1 Squash commit recipe

When merging a PR via GitHub:

1. **PR title** becomes the squashed commit summary — must follow universal §1 (`type(scope): summary`, ≤100 chars, lowercase, imperative).
2. **PR description** becomes the squashed commit body — must follow universal §1.2 (`- ` bullets, no `## ` headers, why over what).
3. **Linear ticket** auto-detected from PR title prefix (e.g., `[ACM-1234]`) or `Refs:` trailer.

Pre-merge checklist (enforced by GitHub Actions):
- PR title matches `^(feat|fix|refactor|docs|style|chore|test|perf|ci|build|revert)(\([^)]+\))?!?: .{1,90}$`
- At least one `Refs:` or `Closes:` trailer present in PR description
- All status checks green (universal §0.2 leaves-repo-green)

### 4.2 Auto-commit boundaries (none — PR-centric)

Unlike PDCA-style projects, Acme Cloud does not auto-commit at workflow phase boundaries. Commit cadence is entirely PR-bound: feature branches accumulate work-in-progress commits; the squash at merge time produces the canonical commit.

WIP commits inside feature branches may violate §0.2 leaves-repo-green (intermediate commits aren't required to build) — but the squashed merge commit MUST. CI gates the merge, not individual feature-branch commits.

---

## 5. Type Usage Policy

**Active types**: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`, `test`, `perf`, `revert`

**Inactive types**:
- `ci` and `build` are folded into `chore(ci)` and `chore(build)` for consistency with the team's existing tooling — the `chore` umbrella scope makes filtering simpler in the release tooling.

---

## 6. Project-Specific Examples

### 6.1 Squash-merge from a feature PR

```
feat(packages/ui): add <DataTable> with virtualization (Closes ACM-1234)

Adds a virtualized table component for the dashboard inventory page —
the existing <Table> rendered all rows synchronously, which OOMed at
~10k rows on low-memory devices. Uses TanStack Table v8 + virtual
scrolling via react-virtuoso.

- packages/ui/src/DataTable/* (component + types + tests)
- packages/ui/src/DataTable.stories.tsx (Storybook with 4 fixtures:
  empty / 100 rows / 10k rows / 100k rows)
- API surface mirrors <Table> so call sites can swap with one rename
- Storybook a11y addon: passes (axe-core 0 violations on all fixtures)

Closes: ACM-1234
Storybook: components-ui-data-table--all-variants
Reviewed-by: Alex Kim <alex@acme-cloud.example>
```

### 6.2 Feature-flag rollout commit

```
feat(apps/dashboard): enable invoice-pdf-v2 behind feature flag

Wires the new PDF rendering path to LaunchDarkly flag
`billing-invoice-pdf-v2` (default off in production). Old path remains
on disk for one release after 100% rollout per the team's safe-revert
policy.

Flag: billing-invoice-pdf-v2
Rollout: 5% internal team week 1 → 50% beta accounts week 2 → 100% week 4
Refs: ACM-2031
```

### 6.3 Migration breaking change

```
refactor(packages/db)!: drop legacy users.full_name column

The `full_name` column was deprecated in v3.2 (2026-Q1) when we split
to `first_name` + `last_name`. The 6-month redirect window has elapsed
and zero internal callers remain. Drop the column to reclaim the
column-count budget on the users table (PostgreSQL's per-row overhead).

Migration: packages/db/migrations/0089_drop_users_full_name.sql

BREAKING CHANGE: external API consumers reading `full_name` from
GET /v2/people receive 422 with `{ error: "field_removed",
suggestion: "concatenate first_name + ' ' + last_name" }`. SDK v4.0+
already implements the concatenation locally.

Closes: ACM-3422
```

---

## 7. Project-Specific Anti-Patterns

In addition to universal §11:

- **Translating brand names** — `BoardKit → "board kit"`, `Acme Pay → "billing module"`. Loses precision and breaks `git log --grep`.
- **PR titles without `type(scope)`** — GitHub Actions reject these at merge time, but writing them wastes a review cycle. Title PRs from the start as `type(scope): summary`.
- **Squashing without rewriting the body** — see §L.7 of the universal `examples/good-commits.md`. The auto-generated WIP-commit list is not a commit body.
- **Skipping `Refs:` trailers** — Linear's commit-to-ticket linkage relies on the trailer. Missing it means the ticket sees no commit reference even though work was clearly done.
- **Putting LaunchDarkly flag names in summary** — flags are noisy strings that pollute `git log --oneline`. Keep them in the `Flag:` trailer instead.

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 0.1 | 2026-05-11 | Initial example dialect for the principled-git-commit skill. Demonstrates a pnpm monorepo + Linear + LaunchDarkly + squash-merge PR workflow. |
