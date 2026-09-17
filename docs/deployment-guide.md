# Deployment guide

Environments, deploy targets, and pointers to the scripts that own each step.
Do not treat this page as a second runbook.

**Owning operations guide:** [`downtown/operations.md`](downtown/operations.md).
Release notes: [`releases/`](releases/).
Changelog: [`../CHANGELOG.md`](../CHANGELOG.md).
Release script: `scripts/create-release.ps1` (see [`../AGENTS.md`](../AGENTS.md)).

## Environments

| Environment | Git trigger | Runtime layout (VPS) |
| --- | --- | --- |
| Local | developer machine | `docker compose` at repo root, or `npm run dev` in `Frontend/` |
| Staging | push `develop` | `/opt/ITBA-OCR/staging` |
| Production | push `main` (and version tags `v*`) | `/opt/ITBA-OCR/production` |

Image owner: [`Frontend/Dockerfile`](../Frontend/Dockerfile).
Compose owner: [`docker-compose.yml`](../docker-compose.yml).
Publish workflow: [`.github/workflows/docker-publish.yml`](../.github/workflows/docker-publish.yml).

Public `NEXT_PUBLIC_*` values are baked at image build. Server secrets are not
GitHub Actions secrets for this path; they stay in the VPS runtime `.env`.

## Route records (systems this repository does not own)

### GitHub Environment public vars

| Field | Record |
| --- | --- |
| When to use | Publishing a GHCR image that must embed the correct origin and Supabase anon config |
| Scope | GitHub Environments named `staging` and `production` on this repository |
| Source of truth | Repository Settings → Environments; workflow [`.github/workflows/docker-publish.yml`](../.github/workflows/docker-publish.yml) |
| How to look up | Open the Environment; confirm `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`, Turnstile flags |
| Access and permission | Maintainer with Environment admin. Request access through the repository owners. Do not paste values into chat |
| Limits | Only public client values. Never place service-role, SMTP, or Turnstile **secret** keys here |
| Verification | A `workflow_dispatch` or push whose workflow logs show vars populated (redact values). Empty `NEXT_PUBLIC_APP_URL` on production must fail the job |

### VPS runtime secrets

| Field | Record |
| --- | --- |
| When to use | App cannot talk to Supabase/AI/SMTP after a deploy, or a new server-only key is required |
| Scope | One machine path per environment (`staging` vs `production` directories above). Do not copy production `.env` onto staging |
| Source of truth | gitignored `.env` on the VPS, created from [`.env.example`](../.env.example) names only |
| How to look up | SSH with the deploy identity already authorized for that host; inspect **names** of keys, not values, unless you are the operator rotating them |
| Access and permission | Operator with VPS access. Holding a deploy key is not standing permission to dump secrets into tickets |
| Limits | Never commit, log, or paste secret values. Do not read a secret in order to document it |
| Verification | Service health after compose up; fallback is restore from the team's approved secret store, not from git history |

### Supabase project pairing

| Field | Record |
| --- | --- |
| When to use | Auth, RLS, storage, or Edge Function behavior disagrees with git |
| Scope | The Supabase project bound to that Environment (names in [`downtown/operations.md`](downtown/operations.md)) |
| Source of truth | Supabase dashboard for that project; schema contract notes in [`Backend/README.md`](../Backend/README.md) |
| How to look up | Dashboard → the project for that environment. Migrations remain in `Backend/supabase/migrations` |
| Access and permission | Org member on that Supabase org. Missing access is requested from the org owner, not by widening GitHub tokens |
| Limits | Staging and production are different projects. A staging fix is not a production apply |
| Verification | Object inventory vs git as described in `Backend/README.md`. Dashboard timestamps in `schema_migrations` are not 1-1 with git filenames |

### Application and deploy logs

| Field | Record |
| --- | --- |
| When to use | Failed GHCR publish, failed SSH deploy, or runtime 5xx |
| Scope | GitHub Actions run for the branch/tag; VPS compose logs for that environment path |
| Source of truth | Actions tab for [`.github/workflows/docker-publish.yml`](../.github/workflows/docker-publish.yml); container logs on the VPS |
| How to look up | Filter by workflow run id or compose project name. Pin a short time window |
| Access and permission | Repo read for Actions; VPS operator for container logs |
| Limits | Logs may contain PII from HR payloads. Redact before paste. Read-only log access does not authorize restart or secret rotation |
| Verification | Match commit SHA on the image/tag to the run. Empty logs are not proof of success |

Hostnames, package visibility, and Turnstile pairing steps stay in
[`downtown/operations.md`](downtown/operations.md) so they have a single owner.
