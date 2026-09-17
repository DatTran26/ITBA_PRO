# Code standards

Engineering choices and contribution constraints for Town Hown. Implementation
detail belongs in source, linters, and CI.

Canonical development guide: [`downtown/development.md`](downtown/development.md).
GitFlow and agent process: [`../AGENTS.md`](../AGENTS.md).
Contributor workflow: [`../CONTRIBUTING.md`](../CONTRIBUTING.md).

## Repository shape

One Git repository. Application source lives at `Frontend/` and `Backend/`.
Do not add nested Git remotes or a second branching model. Personal and feature
branches PR into `develop` only; `main` accepts `release/*` and `hotfix/*`.

## Why these choices

- **Next.js App Router + same-origin BFF.** Keeps cookies, uploads, and
  `/api/*` on one deployable. Splitting handlers into a separate service is a
  later architecture migration, not a local convenience.
- **Supabase migrations as schema authority.** RLS and storage policies evolve
  in `Backend/supabase/migrations`. Docs do not inventory tables.
- **Strict TypeScript at the HTTP boundary.** Unknown input stays `unknown`
  until parsed. Hiding a control in the UI is not authorization.
- **Server Components by default.** `use client` is for interaction and browser
  APIs. Secrets and full rows stay on the server.
- **Open build toolchain.** Node/npm, Docker, and Python from public
  distributions. Do not require closed compilers or hand-edited headers to
  configure a build.

## Quality bar

- Prefer existing UI primitives in `Frontend/src/components/ui` and domain
  modules in `Frontend/src/lib` before adding a parallel path.
- Domain rules that must not diverge (example: recruitment transitions) have
  one owner; the recruitment state machine lives in
  `Frontend/src/lib/recruitment/state-machine.ts`.
- New public, schema, or security contracts need validation plus an update on
  the smallest owning doc.
- Never commit `.env`, tokens, or real personal data.

## Testing policy

Manifests, not this page, own exact commands.

- Frontend targeted Vitest entries are declared in
  [`Frontend/package.json`](../Frontend/package.json).
- Vision services keep tests next to their backends under `modules/`.
- There is no single repo-wide `npm test` at the root. Do not invent one in
  docs.
- Start with the smallest test that proves the changed business rule or contract;
  use integration or end-to-end coverage only when its boundary is the risk.
  Run the affected lint/build gate before handing off a change.
- Keep test data and credentials separate from development and production.
  A failed test is investigated at its smallest reproducible scope; do not
  weaken assertions or skip a failing test to obtain a green result.

Commit messages stay English Conventional Commits. Fallback commit notes:
[`references/COMMIT.md`](references/COMMIT.md).
