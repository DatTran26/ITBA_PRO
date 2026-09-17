#!/usr/bin/env bash
# Recreate the Town Hown stack in DEPLOY_PATH. Runtime .env is never overwritten.
set -euo pipefail

DEPLOY_PATH="${DEPLOY_PATH:?DEPLOY_PATH is required}"
cd "${DEPLOY_PATH}"

if [[ ! -f .env ]]; then
  echo "missing ${DEPLOY_PATH}/.env" >&2
  exit 1
fi
if [[ ! -f docker-compose.yml || ! -f deploy/vps/docker-compose.traefik.yml ]]; then
  echo "missing compose files under ${DEPLOY_PATH}" >&2
  exit 1
fi

LOCK="${DEPLOY_PATH}/.deploy.lock"
exec 9>"${LOCK}"
if ! flock -n 9; then
  echo "deploy lock held: ${LOCK}" >&2
  exit 1
fi

COMPOSE=(docker compose --env-file .env -f docker-compose.yml -f deploy/vps/docker-compose.traefik.yml)

if [[ -n "${GHCR_TOKEN_FILE:-}" && -f "${GHCR_TOKEN_FILE}" ]]; then
  GHCR_TOKEN="$(cat "${GHCR_TOKEN_FILE}")"
  shred -u "${GHCR_TOKEN_FILE}" 2>/dev/null || rm -f "${GHCR_TOKEN_FILE}"
fi

if [[ -n "${GHCR_TOKEN:-}" ]]; then
  echo "${GHCR_TOKEN}" | docker login ghcr.io -u "${GHCR_USER:-github}" --password-stdin >/dev/null
  unset GHCR_TOKEN
fi

if [[ -n "${DOCKER_IMAGE:-}" ]]; then
  export DOCKER_IMAGE
  "${COMPOSE[@]}" pull web || true
  if ! docker image inspect "${DOCKER_IMAGE}" >/dev/null 2>&1; then
    echo "image not present: ${DOCKER_IMAGE}" >&2
    docker logout ghcr.io >/dev/null 2>&1 || true
    exit 1
  fi
  "${COMPOSE[@]}" up -d --remove-orphans --no-deps --no-build web
else
  "${COMPOSE[@]}" up -d --remove-orphans --no-deps --no-build web
fi

APP_PORT="$(awk -F= '/^APP_PORT=/{print $2; exit}' .env | tr -d '\r')"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:${APP_PORT}/api/health}"

ok=0
for _ in $(seq 1 45); do
  if curl -fsS --max-time 5 "${HEALTH_URL}" | grep -q '"ok"'; then
    ok=1
    break
  fi
  sleep 2
done

docker logout ghcr.io >/dev/null 2>&1 || true

if [[ "${ok}" -ne 1 ]]; then
  echo "health check failed: ${HEALTH_URL}" >&2
  "${COMPOSE[@]}" ps || true
  "${COMPOSE[@]}" logs --tail=80 web || true
  exit 1
fi

echo "deploy ok ${DEPLOY_PATH} ${HEALTH_URL}"
