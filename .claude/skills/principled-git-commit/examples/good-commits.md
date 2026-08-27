# Annotated Real-World Commits

A library of representative commit messages drawn from patterns common in real-world repositories — open-source projects (kernel, Vue, Vite, NestJS, Tailwind), monorepo packages, and production codebases. Adapt these to your project's dialect.

> **Convention used in annotations**:
> - "Why this works" — what makes the commit pass §0 Principles
> - "Why this fails" — which principle / anti-pattern it violates
>
> All examples are illustrative, written in the style of common open-source projects but not copied verbatim.

---

## A. Single-concept fixes (no body needed)

The diff is small enough that a body would just restate it. Summary alone communicates everything a reader needs.

```
fix(button): preserve focus ring on disabled state
```

```
fix(api): handle empty array in /search response
```

```
fix(modal): close on Escape key when input is focused
```

```
docs(readme): correct install command for pnpm 9
```

**Why these work**: every keyword in the summary is concrete — `button`, `focus ring`, `disabled state`, `/search response`, `Escape key`. A future `git log --grep="focus ring"` lands here in one hit. No body needed because the diff is small and self-explanatory.

---

## B. Why-driven fixes (focused body)

The fix is short, but the *reason* matters and would be lost without a body. The most common pattern in mature codebases.

```
fix(auth): clear refresh token cookie on logout

Previously the cookie was overwritten with an empty value but kept the
same Max-Age, leaving Safari to retain the empty cookie indefinitely.
Issue surfaced as users staying "logged out but reauthorizable" across
sessions. Setting Max-Age=0 explicitly forces deletion.

Closes: #2341
```

```
fix(query): rebuild prepared statement on schema change

PostgreSQL invalidates prepared statements when the underlying table
schema changes (ALTER TABLE), but the connection pool kept the cached
plan and returned `cached plan must not change result type` on every
subsequent call. Detect SQLSTATE 0A000 and rebuild once before
propagating.

Refs: postgres/postgres docs §sql-prepare
```

```
fix(scroll): use IntersectionObserver root margin instead of scroll listener

The scroll listener fired ~60 times per second on long pages, blocking
main thread for 2-4ms each. IntersectionObserver with rootMargin: '200px'
gets the same lazy-load behavior with zero scroll overhead.

Lighthouse mobile p95: 89 → 96.
```

**Why these work**: bodies explain the root cause and the chosen approach — neither derivable from the diff. The Lighthouse number proves the change had measurable benefit (a useful pattern for `perf`-adjacent fixes too).

---

## C. New features with rationale

```
feat(api): add idempotency keys to /v1/payments

POST retries currently double-charge if the network drops between
client send and server response. Accept an `Idempotency-Key` header
(UUID v4 expected); store the first response keyed by (account, key)
for 24h and replay on duplicate request.

- Compatible with Stripe's idempotency semantics so client SDKs that
  already implement the pattern work without changes
- 24h window aligns with typical mobile retry policies
- Storage backed by Redis with EXPIREAT — no schema migration

Refs: stripe.com/docs/features/api/idempotent_requests
```

```
feat(cli): add --dry-run flag to migration runner

Operators have no way to preview migrations before applying them in
production. --dry-run streams the SQL that would be executed without
opening a write transaction. Catches accidental DROP TABLE in review.

Closes: #4421
```

**Why these work**: WHY is in the body (real user pain — "double-charge", "no way to preview"), the trade-off or compatibility consideration is named, and external references are linked through `Refs:` / `Closes:` trailers.

---

## D. Refactors

The bar for `refactor` is "behavior unchanged, structure changed." The body must convince readers that nothing user-visible moved.

```
refactor(auth): replace bcrypt with argon2id

bcrypt's cost parameter caps at 31 (2^31 iterations) and our threat
model now assumes GPU-accelerated attackers; argon2id's memory-hard
function resists that class of attacker meaningfully.

Migration: existing bcrypt hashes remain readable through the new
verifier (looks at hash prefix `$2a$` vs `$argon2id$` and dispatches);
on next successful login the hash is silently re-encoded to argon2id.

Behavior unchanged for end users — login flow, error messages, lockout
all match. Argon2 params: m=64MB, t=3, p=4 per OWASP Password Storage
Cheat Sheet.
```

```
refactor(routes): extract route definitions into a single registry

Routes were declared inline across 12 controller files. New developers
spent ~30min finding "where is /v1/users defined?" Aggregating into
src/routes/registry.ts keeps wiring discoverable and lets us add a
single source for OpenAPI schema generation later.

No URL or handler change. All 47 existing route tests pass without
modification.
```

**Why these work**: explicitly call out "behavior unchanged" with proof (test counts, spec compliance). The migration paragraph in the bcrypt example is critical — without it, a reader would worry about user lockout.

---

## E. Performance with measured impact

```
perf(query): cache user permission lookup (300ms p95 → 12ms)

Permission check ran a 4-table JOIN on every request. Move to LRU
cache keyed by (userId, resource), invalidated by the existing
permission-mutation event bus. Cache size capped at 100K entries
(~50MB at p99 distribution).

Before / after on production replica:
- p50:  85ms → 4ms
- p95: 300ms → 12ms
- p99: 850ms → 38ms
- Hit rate after 5min warmup: 94%
```

**Why this works**: `perf` commits without numbers are easy to oversell. Numbers anchor the claim. Cache-invalidation strategy named explicitly — without that, a reader has to guess if stale permissions are possible.

---

## F. Breaking changes

```
feat(api)!: rename /v1/users to /v1/people

The schema models humans and organizations, not just user accounts —
"users" was a vestige of the v1 design when only signed-in operators
existed. /v1/people accepts the same payload shape.

BREAKING CHANGE: clients calling /v1/users receive 410 Gone with a
Location header pointing to /v1/people. The redirect window is 6 months
(until 2026-12-01); after that, the path returns 404. Internal SDKs
already updated in PR #5012; partner SDKs notified via the integrators
mailing list 2026-05-09.

Refs: #4998
```

```
refactor(shared)!: drop default export from @scope/utils

Default exports break tree-shaking in webpack 4 and lead to ambiguous
auto-imports in IDEs ("did you mean utils.formatDate or default.formatDate?").
All call sites already used named imports — no runtime behavior change.

BREAKING CHANGE: `import utils from '@scope/utils'` no longer compiles.
Use named imports: `import { formatDate, parseDate } from '@scope/utils'`.
```

**Why these work**: both `!` and `BREAKING CHANGE:` footer used (belt-and-suspenders for caller awareness). The footer specifies *exactly what callers must do* and includes a deprecation window or migration path.

---

## G. Reverts

```
revert: feat(api): add idempotency keys to /v1/payments

This reverts commit 8a3b9c2d... .

Reason: idempotency-key TTL of 24h, combined with a Redis cluster
failover at 03:42 UTC, caused all replays in the 5-minute window after
failover to bypass the deduplication and produce duplicate charges
(post-mortem #INC-2031). The fix is to persist replay records to
durable storage rather than Redis-only, which requires a schema
migration. Reverting until the durable-storage variant lands.

Refs: 8a3b9c2
Refs: #INC-2031
```

**Why this works**: the reason is the entire value of a revert commit. Without it, six months later "why did we revert this great-looking feature?" becomes guesswork. Naming the incident (`#INC-2031`) gives investigators a thread to pull.

---

## H. Multi-author / pair programming / AI co-author

```
fix(checkout): correctly compute tax for partial refunds

Refund line items inherited the parent order's tax rate at refund time,
but the rate had since changed. Compute tax using the rate captured at
original purchase (stored on the line item) rather than current rate.

Co-authored-by: Alex Kim <alex@example.com>
Co-authored-by: Jamie Patel <jamie@example.com>
```

```
refactor(parser): extract token classification into pure function

Splitting Tokenizer.next() makes the classification logic unit-testable
without instantiating the full tokenizer state. Behavior preserved.

Co-authored-by: Claude <noreply@anthropic.com>
```

**Why these work**: `Co-authored-by:` is a `git interpret-trailers`-recognized token; GitHub renders co-authors on the commit page and credits both in `git shortlog`. Useful for pair programming, mob sessions, or AI-assisted commits — the AI-attribution example mirrors how teams now credit Claude / Copilot / Cursor on substantial AI-driven changes.

---

## I. Tests / chore / docs / build / ci

```
test(checkout): add e2e flow for guest user with split payment

Covers the path that broke in #4321 (guest checkout + 2 payment
methods). Sets up Stripe test mode + PayPal sandbox. Runs against
preview deployment via Playwright trace mode (no production data).

Refs: #4321
```

```
chore(deps): bump react 18.3.1 → 19.0.0

react@19 includes the use() hook used in src/lib/streaming.ts and
adopts the strict-mode warning for sync setState in effects we already
fixed in #4801. No new peer-dep conflicts.

Tested: pnpm test, pnpm build, pnpm e2e all pass on Node 20.x and 22.x.
```

```
docs(api): document rate-limit headers for /v1/users

Adds the X-RateLimit-* and Retry-After headers to the OpenAPI spec
(previously only described in the README). Unblocks SDK code generators
that read OpenAPI to produce typed retry-aware clients.
```

```
build(rollup): output ESM + CJS from a single externals declaration

Previously two rollup configs duplicated 80 lines of externals + tsconfig
paths. Switch to rollup -c rollup.config.js with a `format: ['esm', 'cjs']`
matrix in the package.json build script.

Bundle sizes unchanged.
```

```
ci(release): cache pnpm store across release matrix jobs

Each matrix job re-downloaded ~400MB of dependencies. Cache the
~/.local/share/pnpm/store directory keyed by pnpm-lock.yaml hash.
Cuts release pipeline time from 14m to 6m.
```

**Why these work**: each commit's type accurately reflects the change shape — `test` is just-tests, `chore(deps)` is dep-bump, `docs` is docs-only, `build` is build-only, `ci` is pipeline-only. A reader filtering `git log --grep='^build'` to investigate a build issue gets exactly the relevant commits.

---

## J. Long-form (Linux kernel / Postgres style)

Some projects (the kernel, Postgres, OpenBSD) write longer commit messages because the commit IS the documentation for changes whose details would be lost otherwise.

```
mm/oom_kill: avoid OOM-killer for processes with mm == NULL

If a task has its mm freed (mm == NULL) the OOM killer should not
consider it as a candidate. Without this guard, we observed null
dereferences in oom_evaluate_task() during late-stage process exit
under heavy memory pressure (cred->mm released before the OOM scan
completed).

The race window is small but reachable on production servers with
~32GB+ memory and aggressive cgroup limits — see the report below
for a kernel oops trace.

This patch adds the (task->mm == NULL) early-out before the
points-and-priorities computation. The check is cheap (single load)
and is consistent with how oom_score_adj_min is handled.

Reported-by: Some Reporter <reporter@example.org>
Signed-off-by: Author Name <author@example.org>
Fixes: abc123def456 ("mm: refactor OOM evaluation")
Cc: stable@vger.kernel.org # 6.1+
```

**Why this works**: kernel patches need to convince a maintainer in 30 seconds and survive a `git log -p` audit five years later. Subject = subsystem path + brief; body explains the bug, the race window, the fix mechanism, and tags reviewers/stable backports.

This style works regardless of whether you use Conventional Commits — the same five principles (atomic, leaves-repo-green, why-over-what, imperative, searchable) apply. Kernel-style summaries (`mm/oom_kill: ...`) are a different surface vocabulary but the underlying intent matches.

---

## K. Monorepo and feature-flag patterns

```
feat(packages/ui): add <Toast> component with stacking semantics

Stacks up to 3 toasts; older toasts fade out when stack overflows.
API mirrors @radix-ui/react-toast so consumers can swap if they need
the full Radix accessibility surface.

- packages/ui/src/Toast.tsx (component)
- packages/ui/src/Toast.stories.tsx (Storybook)
- packages/ui/CHANGELOG.md (consumer-facing)

Refs: design.figma.com/file/abc123/toast-system
```

```
chore(release): packages/ui@2.1.0

Generated by changeset CLI from the following entries:
- feat(packages/ui): add <Toast> component
- fix(packages/ui): correct dropdown z-index over modal
- chore(packages/ui): bump radix-ui peer to ^2

Refs: changesets/v2.1.0
```

```
feat(billing): enable invoice-pdf-v2 behind feature flag

The new PDF rendering path lives behind LaunchDarkly flag
`billing-invoice-pdf-v2` (default off). Rollout plan:
- 5% of internal team — week 1
- 50% of beta accounts — week 2
- 100% — week 4 if zero P1/P2 incidents

Old path stays on disk for 1 release after 100% rollout in case of
emergency revert. Cleanup tracked in #6210.

Refs: #6021
Refs: #6210
```

**Why these work**: monorepo scopes (`packages/ui`) and feature-flag rollout commits are increasingly common patterns. The release commit shows what an automated changesets-style commit looks like (machines write these too — they need to be readable by humans on incident review).

---

## L. Annotated anti-patterns

### L.1 Vague summary

```
chore: wip
fix: bug
docs: update
chore: misc updates
```

**Why these fail**: §0.5 — `git log --grep="bug"` returns hundreds of unrelated hits. AI embedding search is useless. Six months later `git blame` on these commits sends the reader straight to the diff with no map.

### L.2 Bundled concerns

```
feat(api): add idempotency + fix login bug + bump deps + reformat
```

**Why this fails**: §0.1 atomic. If any one of the four parts regresses, `git bisect` blames a commit that does three other things. `git revert <hash>` drags along three unrelated changes. Split into four commits.

### L.3 Past-tense / passive

```
feat: added phone validator
fix: was fixing the double-render
chore: things were updated
```

**Why these fail**: §0.4 — past tense breaks the "If applied, this commit will..." convention git itself uses internally. Auto-changelog tools and AI summarizers expect imperative form.

### L.4 Markdown headers in body

```
feat(foo): rewrite bar

## Background
[long paragraph]

## Implementation
[long paragraph]

## Testing
[long paragraph]
```

**Why this fails**: §5 — `git log` displays raw text, so `## Background` renders as the literal characters `## Background` rather than a styled heading. Replace with plain `Background:` labels followed by indented bullets.

### L.5 Unannotated breaking change

```
refactor: clean up exports
```

(Diff removes a public export that ten downstream packages depend on.)

**Why this fails**: §6 — callers have no warning. Their builds break with a cryptic "module has no export" error and the responsible commit looks innocuous in `git log --oneline`. Add `!` or `BREAKING CHANGE:` footer with the migration path.

### L.6 `git add -A` blanket stage

```
chore: misc updates
```

(Diff includes 47 files across 12 unrelated domains, plus a `.env` accidentally checked in.)

**Why this fails**: §0.1 atomic + §7.4 secrets blocklist. Often inadvertently includes secrets or unrelated WIP. Bisect, revert, and review are all crippled. Use explicit `git add <path>` or `git add -p` for hunk-level staging.

### L.7 Squashed PR with thrown-away history

```
feat: implement user settings page (#1234)

* WIP
* fix typo
* responding to review
* finally working
* please work this time
* fix tests
* lint
```

(Commit body is the unchanged squash-summary that GitHub generates from intermediate WIP commits.)

**Why this fails**: §0.3 why-over-what — the body is a list of WIP commit subjects, none of which explain why the user settings page was built or what trade-offs were made. Either rewrite the squash message before merging, or use the PR description (which usually has real context) as the squash body.

---

## How to read these examples

When writing your own commit, ask:

1. **Which category fits?** (A through K) — picks body style and length
2. **Which type?** (feat / fix / refactor / etc.) — see SKILL.md §7.3 decision tree
3. **What scope?** — your project's catalog, see your dialect file (§13)
4. **Is anything breaking?** — if yes, §6
5. **Are there cross-references?** — `Refs:`, `Closes:`, `Co-authored-by:`, custom dialect trailers
6. **Run the §7.5 pre-commit checklist** — atomic, green build, no secrets, no console.log

The examples above all pass that workflow. The L anti-patterns all fail at least one step.
