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

mkdir -p \
  "${FACE_DATA_HOST_DIR:-./data/vision-ai/faces}" \
  "${VIOLATION_DATA_HOST_DIR:-./data/vision-ai/violations}" \
  "${INSIGHTFACE_HOST_DIR:-./data/vision-ai/insightface}" \
  "${VISION_AI_CONFIG_HOST_DIR:-./data/vision-ai/config}" \
  "${VISION_AI_MODEL_HOST_DIR:-./models/vision-ai}"

export DOCKER_IMAGE="${DOCKER_IMAGE:-}"
export VISION_AI_IMAGE="${VISION_AI_IMAGE:-}"
export VISION_OCR_IMAGE="${VISION_OCR_IMAGE:-}"

IMAGES=()
[[ -n "${DOCKER_IMAGE}" ]] && IMAGES+=("${DOCKER_IMAGE}")
[[ -n "${VISION_AI_IMAGE}" ]] && IMAGES+=("${VISION_AI_IMAGE}")
[[ -n "${VISION_OCR_IMAGE}" ]] && IMAGES+=("${VISION_OCR_IMAGE}")

if [[ ${#IMAGES[@]} -gt 0 ]]; then
  "${COMPOSE[@]}" pull web vision-ai-api vision-ocr-api || true
  missing=0
  for img in "${IMAGES[@]}"; do
    if ! docker image inspect "${img}" >/dev/null 2>&1; then
      echo "image not present: ${img}" >&2
      missing=1
    fi
  done
  if [[ "${missing}" -ne 0 ]]; then
    docker logout ghcr.io >/dev/null 2>&1 || true
    exit 1
  fi
fi

if ! "${COMPOSE[@]}" up -d --remove-orphans --no-build; then
  echo "compose up failed" >&2
  "${COMPOSE[@]}" ps || true
  "${COMPOSE[@]}" logs --tail=80 web vision-ai-api vision-ocr-api || true
  docker logout ghcr.io >/dev/null 2>&1 || true
  exit 1
fi

APP_PORT="$(awk -F= '/^APP_PORT=/{print $2; exit}' .env | tr -d '\r')"
HEALTH_URL="${HEALTH_URL:-http://127.0.0.1:${APP_PORT}/api/health}"

ok=0
for _ in $(seq 1 60); do
  if curl -fsS --max-time 5 "${HEALTH_URL}" | grep -q '"ok"'; then
    ok=1
    break
  fi
  sleep 2
done

sidecar_ok=1
for service in vision-ai-api vision-ocr-api; do
  ready=0
  for _ in $(seq 1 45); do
    if "${COMPOSE[@]}" exec -T "${service}" python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3)"; then
      ready=1
      break
    fi
    sleep 2
  done
  if [[ "${ready}" -ne 1 ]]; then
    echo "${service} health failed" >&2
    sidecar_ok=0
  fi
done

docker logout ghcr.io >/dev/null 2>&1 || true

if [[ "${ok}" -ne 1 || "${sidecar_ok}" -ne 1 ]]; then
  echo "health check failed: ${HEALTH_URL}" >&2
  "${COMPOSE[@]}" ps || true
  "${COMPOSE[@]}" logs --tail=80 web vision-ai-api vision-ocr-api || true
  exit 1
fi

echo "deploy ok ${DEPLOY_PATH} ${HEALTH_URL}"
