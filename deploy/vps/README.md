# VPS: ITBA-OCR beside Max Claw

This host already runs **Traefik** on `:80`/`:443`. Town Hown / ITBA-OCR binds
origin ports and joins `traefik-public`. GitHub Actions deploys:

| Git branch | GitHub Environment | VPS path | Host port | Domain |
| --- | --- | --- | --- | --- |
| `main` | `production` | `/opt/ITBA-OCR/production` | **2005** | production.wpcteam.shop |
| `develop` | `staging` | `/opt/ITBA-OCR/staging` | **2026** | staging.wpcteam.shop |

Local compose still defaults to `APP_PORT=3000` and does **not** need the Traefik overlay.

Do not `docker compose down` other stacks. Port **3000** is `orchestration`
(grownyourcv). Claw uses loopback `18790`, not these ports.

## Layout

```text
/opt/ITBA-OCR/production/.env     # from env.production.example; never overwritten by CI
/opt/ITBA-OCR/production/docker-compose.yml
/opt/ITBA-OCR/production/deploy/vps/
/opt/ITBA-OCR/staging/.env        # from env.staging.example
/opt/ITBA-OCR/staging/...
```

Runtime secrets stay in those `.env` files (mode `600`, owner `root`).
`NEXT_PUBLIC_*` must already be baked in the GHCR image.

## GitHub Actions

`.github/workflows/docker-publish.yml`:

1. Build `linux/amd64` and push `ghcr.io/dattran26/down-town` (`:staging` from
   `develop`, `:latest` from `main`, plus `:sha-<7>`).
2. rsync compose files (never `.env`) to `VPS_DEPLOY_PATH`.
3. SSH as **`root`** and run `deploy/vps/remote-up.sh` (flock, GHCR pull, health).

Environment vars (not secrets): `VPS_HOST`, `VPS_USER`, `VPS_DEPLOY_PATH`.
Environment secrets: `SSH_PRIVATE_KEY`, `SSH_KNOWN_HOSTS`.

## Reverse proxy

This VPS: Traefik overlay `docker-compose.traefik.yml` (HTTP origin). Cloudflare
already proxies `*.wpcteam.shop`. Set the Cloudflare **origin** A record to this
VPS. Keep SSL mode compatible with HTTP origin (Flexible, or Full + origin cert).
Do not enable `docker-compose.traefik-acme.yml` while the hostname stays orange-clouded.

## Smoke

```bash
curl -fsS http://127.0.0.1:2005/api/health
curl -fsS http://127.0.0.1:2026/api/health
curl -fsS -H 'Host: production.wpcteam.shop' http://127.0.0.1/api/health
curl -fsS -H 'Host: staging.wpcteam.shop' http://127.0.0.1/api/health
```
