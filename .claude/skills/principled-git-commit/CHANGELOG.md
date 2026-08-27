# Changelog

All notable changes to this skill are recorded here. Format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The universal layer (Conventional Commits 1.0.0, Tim Pope 2008 imperative
rules, `awesome-copilot/git-commit` workflow patterns, `git interpret-trailers`
trailer format) is upstream-stable, so most changes here will be about
empirical refinements (length sweet-spot data, anti-pattern catalog) and
project-dialect tooling (template, scaffold script, analyze-history script).

## [0.1.5] — 2026-05-26

### Added

- **§11 anti-pattern: "Partial native-language drift"** — new row covering
  the LLM failure mode where reading recent `git log` exposes whitelisted
  native-language proper nouns and the model over-generalizes to "native
  prose is acceptable", drifting commits into mixed-language bodies.
  Language-agnostic — covers Korean / Japanese / Chinese / Spanish /
  German / Portuguese / any non-English vocabulary. Cross-links to
  §13.1 + §13.6.
- **§13.1 dialect guide: "Default language + explicit inverse rule"
  bullet** — formal recommendation that any dialect whitelisting
  native-language terms must also state the default in the same section.
  Closes the loop on the partial-drift anti-pattern by making the
  inverse rule a dialect requirement, not just a convention.
- **§13.6 "Verifying dialect enforcement"** — new subsection with
  three-layer verification: (a) static grep on `docs/features/references/COMMIT.md`
  for the inverse-rule marker, (b) runtime non-ASCII subject scan on
  `git log` for drift symptoms, (c) optional `.claude/hooks/`
  UserPromptSubmit reminder. Includes ready-to-run shell commands.
- **`templates/DIALECT.template.md` §1 / §1.1 split** — section renamed
  to "Language Default & Domain Proper Nouns" with explicit English-default
  rule + concrete drift examples (ko / ja / es) prepended to the whitelist
  table. New projects scaffolded via `scripts/scaffold-dialect.sh` inherit
  the corrected structure automatically (no script change needed — the
  `{{DOMAIN_NOUNS}}` placeholder carries into the new §1.1 location).
- **`lang/ko/SKILL.ko.md` v0.1.5 note** — Korean variant gets a dedicated
  section explaining the drift risk for Korean dialect users (highest
  whitelist surface area among locales).

### Background

Motivated by a real Korean-project case where the dialect listed 11
whitelisted proper nouns (`친구톡` / `알림톡` / `발신번호` / etc.) but
omitted the inverse rule. Recent commits drifted into mixed Korean prose
like `docs(refs,adr): post-hotfix lifecycle 책임 분리 + adapter parity`
(where `책임 분리` is not on the whitelist). The LLM pattern-matched the
whitelisted Korean and over-generalized to "Korean prose is OK in this
project". Adding the explicit "default = English; native only for §1
whitelist" rule closed the gap. Since this failure mode is
language-agnostic, the fix is now part of the universal skill instead
of staying as a single-project lesson.

## [0.1.4] — 2026-05-11

### Removed

- `.github/workflows/validate-commits.yml` and `CONTRIBUTING.md`,
  both added in v0.1.3 (#6 of the polish batch). At this stage —
  single contributor, no branch protection, no README badge surfacing
  the green-build status — they added ~10KB of pollution to every
  end-user install with effectively zero ROI. The pipefail bug the
  CI caught could have been caught by a 5-second local smoke test
  before push.
- The CI infrastructure may be re-introduced at v1.0 or when external
  contributors arrive, with the install-pollution problem solved by
  whatever mechanism `npx skills` settles on (`.skillignore`,
  sparse-checkout publish branch, etc.).

### Kept

- `scripts/validate-commit-msg.sh` — its value is independent of
  repo CI. Any developer can wire it as a local `commit-msg` hook:
  ```bash
  ln -sf ~/.claude/skills/principled-git-commit/scripts/validate-commit-msg.sh \
         "$(git rev-parse --git-dir)/hooks/commit-msg"
  ```

## [0.1.3] — 2026-05-11

### Added

- **§1.3 Three commit surfaces** — distinguishes individual commit /
  PR title / PR squash body. Same §0 principles apply but constraints
  differ. Especially relevant for squash-merge teams who must lint
  PR title at creation time, not at merge time.
- **§3.5 Non-Conventional formats** — explicit acknowledgment that
  kernel-style (`mm/oom_kill: ...`), bracket-prefix (`[Component] ...`),
  Mozilla bug-numbered, no-prefix imperative, and Jira-id-prefix
  formats are all valid. The §0 founding principles apply to every
  format; only the surface vocabulary changes.
- **§8.4 AI co-authoring policy** — 6-row decision matrix for when
  to add `Co-authored-by:` for Claude / Copilot / Cursor / Gemini.
  Substantial AI authorship (≥30% of diff, architecture shaping,
  message authoring) merits the trailer; inline autocomplete and
  mechanical refactor do not. Lists canonical email identities.
- **§13.5 Org-level dialects** — extends the 2-layer model (universal
  + project) to a 3-layer model (universal + org + project) for
  companies with N repos sharing conventions. Documents what goes in
  each layer and the override rule (project beats org beats universal).
- **`scripts/validate-commit-msg.sh`** — standalone bash linter that
  checks a commit message against §0-§14. Exit codes 0/1/2 (pass /
  errors / warnings). Wires as `commit-msg` git hook for live
  enforcement, or runs ad-hoc via `--stdin`. Dependency-free
  (bash + grep + awk + sed).
- **`.github/workflows/validate-commits.yml`** — GitHub Actions CI
  that runs validate-commit-msg.sh against every commit in PRs and
  pushes to main. Eat-our-own-dogfood — the skill's own repo enforces
  the rules it teaches.
- **`CONTRIBUTING.md`** — scope of welcome contributions, the
  commit-msg hook installer one-liner, this repo's scope catalog,
  and SemVer policy.

### Changed

- GitHub repo topics added: `git`, `conventional-commits`,
  `commit-message`, `claude-skills`, `ai-skill`, `methodology`,
  `git-workflow`, `skill`. Improves discoverability on skills.sh
  marketplace and GitHub topic search.

### Migration

No code-level migration required. Optional adoptions:

- **Wire the new linter as a commit-msg hook** in your project:
  ```bash
  ln -sf ~/.claude/skills/principled-git-commit/scripts/validate-commit-msg.sh \
         "$(git rev-parse --git-dir)/hooks/commit-msg"
  ```
- **Update `npx skills update`** to pull the new SKILL.md sections
  + script. The frontmatter description and trigger keywords are
  unchanged, so the skill loads the same way as v0.1.2.

## [0.1.2] — 2026-05-11

### Changed

- Genericized every illustrative commit example so the skill no longer
  reads as if extracted from one specific project. Examples now draw
  from patterns common across real-world open-source operating models
  (Stripe-style idempotency keys, bcrypt → argon2id migrations,
  Lighthouse-measured perf wins, kernel-style mm/oom_kill long-form,
  monorepo `packages/ui` scopes, feature-flag rollouts via LaunchDarkly).
- `examples/good-commits.md` reorganized into 12 categories:
  - A: single-concept fixes (no body)
  - B: why-driven fixes (focused body)
  - C: new features with rationale
  - D: refactors
  - E: perf with measured impact
  - F: breaking changes
  - G: reverts
  - H: multi-author / pair / AI co-author (incl. `Co-authored-by: Claude`)
  - I: test / chore / docs / build / ci
  - J: long-form (kernel / Postgres style)
  - K: monorepo + feature-flag patterns
  - L: anti-patterns (vague summary / bundled concerns / past-tense /
       `##` headers / unannotated breaking / `git add -A` blanket /
       squashed-PR with thrown-away history)
- `templates/DIALECT.example.md` replaced — fictional **Acme Cloud**
  pnpm monorepo + Linear ticket integration (`Closes: ACM-1234`) +
  LaunchDarkly feature flags (`Flag:`, `Rollout:` trailers) +
  squash-merge PR workflow. Demonstrates a different operating model
  from the original PDCA-driven exemplar.
- `templates/DIALECT.template.md` placeholder examples now show three
  different workflow integrations (PDCA / squash-merge / trunk-based
  with feature flags) so users adapt to whichever matches their team.
- SKILL.md inline examples updated across §0.4 / §0.5 / §2 type table /
  §3.4 feature-scope / §4 length table / §8 trailer examples / §10
  revert format.
- Empirical attribution softened from naming a specific repo to
  "private-project 200-commit study (2026-05)" — the data is preserved
  but the project name is not leaked.

### Migration

No action required. The convention itself (§0-§14) is unchanged. Only
the strings inside example blocks moved.

## [0.1.1] — 2026-05-11

### Changed

- Renamed from `commit-skill` to `principled-git-commit`. Plain
  `commit-skill` undersold the methodology layer (5 founding principles +
  4-reader rationale + 5-step workflow + dialect scaffolding) and
  collided semantically with the bare `commit` type-name used inside
  the frontmatter `name:` field. The new name communicates that the
  skill bundles principles, not just a format spec.
- All paths and install instructions updated:
  `npx skills add rhino-ty/principled-git-commit`
  `~/.claude/skills/principled-git-commit/`
- SKILL.md frontmatter `name:` updated from `commit` to
  `principled-git-commit` so it matches the repo and skill names of
  sibling rhino-ty skills (apca-contrast / web-project-plan / etc.).

### Migration

If you installed v0.1.0 under the old name, migrate with:

```bash
npx skills remove commit
npx skills add rhino-ty/principled-git-commit -g
```

Skill content (SKILL.md §0-§14) is unchanged; only naming moves.

## [0.1.0] — 2026-05-10

### Added

- Universal SKILL.md (~580 lines) extracted from a 612-line private-
  project `docs/features/references/COMMIT.md` after a 200-commit empirical
  study (length sweet-spots, `##`-header outlier observation,
  sub/multi-scope conventions).
- §0 Principles — 4 readers (`git log` scanner / `git blame` tracer /
  `git bisect` hunter / AI agent) plus 5 principles (atomic /
  leaves-repo-green / why-over-what / imperative / searchable). Each
  principle ships with a reader-grounded `→` rationale line.
- §1 Format — type/scope/summary/body/trailer structure with a
  recommended ≤100-char summary length (deliberately looser than the
  classic 50/72 rule, derived from the empirical avg of 71 chars).
- §2 Types — `feat` / `fix` / `refactor` / `docs` / `style` / `chore` /
  `test` / `perf` / `ci` / `build` / `revert`.
- §3 Scopes — single, sub-scope (`/`), multi-scope (`,`), and
  feature-scope conventions.
- §4 Body length sweet-spots (0-2 / 5-10 / 15-25 / 30-40 / 50-80) with
  the empirical observation that >80 lines almost always indicates a
  missed split.
- §5 Markdown rules — `- ` bullets dominate (981/200 in study), `## `
  headers explicitly avoided as a 5/200 outlier signal (renders raw in
  `git log`).
- §6 Breaking Changes — `!` notation and `BREAKING CHANGE:` footer with
  a "when to flag" decision list.
- §7 Workflow (5-step) — diff inspection / staging strategies (path /
  glob / `-p` hunks / directory) / type decision tree (10-row diff-
  pattern → type mapping) / secrets blocklist (8 risky file patterns
  with grep verification) / pre-commit mental checklist.
- §8 Trailers — standard (`Co-authored-by:` / `Refs:` / `Closes:` /
  `Reviewed-by:` / `Signed-off-by:` / `BREAKING CHANGE:`) plus
  project-dialect extension hook.
- §9 Amend / fixup rules — strict policy against amending published
  commits, and `fixup!` / autosquash flow for unpublished work.
- §10 Reverts — `revert: <original>` format with mandatory reason field.
- §11 Anti-patterns — 12 entries cross-referenced to the principle each
  violates.
- §12 Quick reference card.
- §13 Project Dialect — defines what belongs in the skill vs in the
  per-project `docs/features/references/COMMIT.md`, plus the runtime loading
  order (skill → dialect → scaffold offer).
- Korean prose variant under `lang/ko/SKILL.ko.md` for Korean-first
  readers; the convention itself stays English-default regardless of
  variant.
- `templates/DIALECT.template.md` — placeholder skeleton.
- `templates/DIALECT.example.md` — filled example using "Acme Cloud"
  (fictional pnpm monorepo + Linear ticket integration + LaunchDarkly
  feature flags + squash-merge PR policy). Demonstrates how a project
  documents its own scope catalog, custom trailers (`Flag:`,
  `Storybook:`, `Rollout:`), and workflow boundaries.
- `scripts/analyze-history.sh` — portable bash tool that emits top
  type(scope) frequencies, sub/multi-scope detections, length stats,
  and `## ` header outlier counts for any git repo.
- `scripts/scaffold-dialect.sh` — interactive generator that prompts
  for project name, domain proper nouns, optional history embedding,
  workflow integration (PDCA / Linear / Jira / none), and custom
  trailers, then renders the template into
  `<cwd>/docs/features/references/COMMIT.md`.
- `references/REFERENCES.md` — full source attribution beyond SKILL.md
  §14, including a section explaining why "AI agent" is treated as a
  first-class reader (the skill's distinguishing contribution beyond
  the spec sources it builds on).
- `examples/good-commits.md` — 6 annotated good commits (single fix /
  fix with focused body / module-scale PDCA Phase commit / PDCA wrap /
  breaking change / revert) plus 5 anti-pattern examples.
- README.md with install instructions (global vs project) and
  AI-as-first-class-reader rationale.
- MIT license.
