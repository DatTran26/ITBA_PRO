# Docker Guide — ITBA AI

> **Archived reference.** Kiểm chứng mọi lệnh với `learning-and-testing-system/Dockerfile`
> và tài liệu triển khai hiện hành trước khi chạy.

> **Phiên bản:** Next.js 15 · Node.js 20-alpine · Standalone output
> **Cập nhật:** 2026-04-04

---

## Mục lục

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Multi-Stage Build — Tại sao?](#2-multi-stage-build--tại-sao)
3. [Phân tích từng stage](#3-phân-tích-từng-stage)
   - [Stage 1: base](#stage-1-base)
   - [Stage 2: deps](#stage-2-deps)
   - [Stage 3: builder](#stage-3-builder)
   - [Stage 4: runner](#stage-4-runner)
4. [Environment Variables — Chiến lược phân tầng](#4-environment-variables--chiến-lược-phân-tầng)
5. [Bảo mật](#5-bảo-mật)
6. [Layer Caching — Tối ưu tốc độ build](#6-layer-caching--tối-ưu-tốc-độ-build)
7. [Tích hợp CI/CD (GitLab)](#7-tích-hợp-cicd-gitlab)
8. [docker-compose.yml](#8-docker-composeyml)
9. [Checklist vận hành](#9-checklist-vận-hành)
10. [FAQ & Pitfalls](#10-faq--pitfalls)

---

## 1. Tổng quan kiến trúc

```
┌─────────────────────────────────────────────────────────┐
│                     CI/CD Pipeline                      │
│                                                         │
│  git push release ──► GitLab Runner                    │
│                           │                             │
│              ┌────────────▼────────────┐                │
│              │   docker build (4 stage)│                │
│              │  base → deps → builder  │                │
│              │          └──► runner    │                │
│              └────────────┬────────────┘                │
│                           │ docker push                  │
│              ┌────────────▼────────────┐                │
│              │  GitLab Container Reg.  │                │
│              └────────────┬────────────┘                │
│                           │ docker pull (via SSH)        │
│              ┌────────────▼────────────┐                │
│              │     VPS Production      │                │
│              │  docker compose up -d   │                │
│              └─────────────────────────┘                │
└─────────────────────────────────────────────────────────┘
```

**Image cuối cùng trên production chỉ chứa:**
- `node:20-alpine` runtime (~50 MB)
- Next.js standalone output (`server.js` + minimal deps)
- Static assets (`/_next/static`, `/public`)

**Không có:** source code, `node_modules` đầy đủ, dev tools.

---

## 2. Multi-Stage Build — Tại sao?

| Tiêu chí | Single-stage | Multi-stage (hiện tại) |
|---|---|---|
| Kích thước image cuối | ~1.5–2 GB | ~150–200 MB |
| Source code trong image | ✅ Có | ❌ Không |
| Tốc độ deploy | Chậm | Nhanh |
| Bảo mật | Thấp | Cao |
| Layer cache | Kém | Tối ưu |

Multi-stage cho phép mỗi `FROM` tạo ra một môi trường build độc lập. Stage cuối (`runner`) chỉ `COPY` đúng những thứ cần thiết từ các stage trước.

---

## 3. Phân tích từng stage

### Stage 1: `base`

```dockerfile
# syntax=docker/dockerfile:1

FROM node:20-alpine AS base

LABEL org.opencontainers.image.title="ITBA AI"
LABEL org.opencontainers.image.description="ITBA AI - Next.js 15 Application"
LABEL org.opencontainers.image.source="https://gitlab.com"
```

**Mục đích:** Định nghĩa image gốc dùng chung cho tất cả stage.

| Điểm | Giải thích |
|---|---|
| `node:20-alpine` | Alpine Linux ~5 MB, tiết kiệm dung lượng đáng kể so với `node:20-slim` (~150 MB) hay `node:20` (~1 GB) |
| `# syntax=docker/dockerfile:1` | Kích hoạt BuildKit, cho phép dùng cache mounts, heredocs và các tính năng mới nhất |
| `LABEL` | Metadata theo chuẩn OCI — hiển thị trên GitLab Registry, DockerHub, `docker inspect` |

> **Tại sao dùng Alpine?** Bề mặt tấn công nhỏ hơn, không có các tiện ích không cần thiết. Nhược điểm: phải cài `libc6-compat` cho một số native module (xem stage `deps`).

---

### Stage 2: `deps`

```dockerfile
FROM base AS deps

# libc6-compat is required for some native Node.js modules on Alpine
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy lockfiles first to maximise Docker layer caching
COPY package.json package-lock.json ./
RUN npm ci
```

**Mục đích:** Cài đặt toàn bộ dependencies (bao gồm devDependencies cần cho build).

| Điểm | Giải thích |
|---|---|
| `libc6-compat` | Cung cấp `glibc` compatibility shim — cần cho các module native như `sharp`, `bcrypt`, `pg` sử dụng binary được compile cho glibc |
| `COPY package.json package-lock.json ./` trước | Layer này chỉ rebuild khi lockfile thay đổi. Nếu chỉ sửa source code, Docker dùng lại cache → **tiết kiệm 1–3 phút build** |
| `npm ci` vs `npm install` | `npm ci` = clean install, luôn dùng chính xác version trong `package-lock.json`, xoá `node_modules` cũ nếu có. Phù hợp cho CI/CD |

> ⚠️ **Khi nào stage này rebuild?** Khi `package.json` hoặc `package-lock.json` thay đổi.

---

### Stage 3: `builder`

```dockerfile
FROM base AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# NEXT_PUBLIC_* vars are baked into the client bundle at build time,
# so they MUST be provided as --build-arg in CI and set to ENV here.
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build
```

**Mục đích:** Biên dịch toàn bộ Next.js app thành standalone bundle.

| Điểm | Giải thích |
|---|---|
| `COPY --from=deps` | Lấy `node_modules` từ stage `deps` — không cài lại từ đầu |
| `COPY . .` | Copy source code (có `.dockerignore` kiểm soát file nào được copy) |
| `ARG` → `ENV` | **Quan trọng:** `NEXT_PUBLIC_*` được nhúng vào JavaScript bundle khi build. Không có ENV này tại build-time → client-side code nhận `undefined` |
| `NEXT_TELEMETRY_DISABLED=1` | Tắt Next.js telemetry — tránh requests ra ngoài trong môi trường bảo mật |
| `npm run build` | Chạy `next build`. Output được đặt vào `.next/` |

**Output quan trọng của `next build`:**
```
.next/
├── standalone/          ← Chứa server.js + minimal node_modules
│   ├── server.js        ← Entry point của production server
│   └── node_modules/    ← Chỉ gồm runtime deps tối thiểu
├── static/              ← CSS, JS chunks, images (đã hash)
└── cache/               ← Build cache (không cần copy sang runner)
```

> **Yêu cầu:** `next.config.js` phải có `output: 'standalone'` để tạo ra file `server.js`.

---

### Stage 4: `runner`

```dockerfile
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Create a non-root system user for security (single RUN to reduce layers)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy only the standalone output (no node_modules, no source code)
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Drop root privileges before starting the process
USER nextjs

EXPOSE 3000

# server.js is auto-generated by Next.js when output: 'standalone' is set
CMD ["node", "server.js"]
```

**Mục đích:** Image production tối giản — chỉ chạy app, không build.

#### Phân tích chi tiết:

**ENV production:**
| Biến | Giá trị | Tác dụng |
|---|---|---|
| `NODE_ENV` | `production` | Tắt dev warnings, kích hoạt optimizations trong Express/Next.js |
| `PORT` | `3000` | Port mà `server.js` lắng nghe |
| `HOSTNAME` | `0.0.0.0` | Bind tất cả network interfaces — cần thiết trong container |
| `NEXT_TELEMETRY_DISABLED` | `1` | Tắt telemetry ở runtime |

**User security:**
```dockerfile
# Tối ưu so với viết tách thành 2 RUN (tạo ra 2 layers)
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs
```
- `--system`: User không có shell, không có home dir, không thể login
- GID/UID = 1001: Tránh conflict với system users phổ biến (root=0, nobody=65534)

**3 lệnh COPY từ builder:**
```
.next/standalone  →  ./          (server.js + minimal runtime)
.next/static      →  ./.next/static   (JS/CSS assets)
public/           →  ./public         (favicon, icons, images)
```

> ⚠️ **Thứ tự COPY quan trọng:** `standalone` phải copy trước vì nó tạo ra cấu trúc thư mục. `static` copy sau để đặt đúng vị trí `.next/static` bên trong standalone output.

**CMD:**
```dockerfile
CMD ["node", "server.js"]
```
- Dùng exec form (array) thay vì shell form (`CMD node server.js`) để process nhận trực tiếp SIGTERM từ Docker → graceful shutdown

---

## 4. Environment Variables — Chiến lược phân tầng

Đây là điểm phức tạp nhất và hay gây lỗi nhất:

```
┌─────────────────────────────────────────────────────────────┐
│  Loại biến          │ Khi nào cần  │ Cách truyền            │
├─────────────────────┼──────────────┼────────────────────────┤
│ NEXT_PUBLIC_*       │ Build time   │ --build-arg → ARG→ENV  │
│  (client-side)      │              │ trong stage builder    │
├─────────────────────┼──────────────┼────────────────────────┤
│ Server-side secrets │ Runtime only │ env_file / -e flag     │
│ (API keys, DB URL)  │              │ trong docker compose   │
└─────────────────────┴──────────────┴────────────────────────┘
```

### `NEXT_PUBLIC_*` — Build-time variables

```
CI pipeline:
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
                    ↓
  Dockerfile ARG → ENV (trong builder stage)
                    ↓
  Next.js nhúng vào JavaScript bundle trong quá trình build
                    ↓
  Trình duyệt người dùng nhận được giá trị này
```

**Nếu không truyền `--build-arg`:** Biến = empty string → Supabase client khởi tạo với URL rỗng → lỗi ở runtime.

### Server-side secrets — Runtime variables

Các biến như `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, `DATABASE_URL` **KHÔNG cần** trong Dockerfile. Chúng được truyền qua:

```yaml
# docker-compose.yml
env_file:
  - .env
```

File `.env` được tạo động trong CI deploy stage:
```bash
echo "OPENAI_API_KEY=$OPENAI_API_KEY" >> .env
```

Và không bao giờ được commit vào repository.

### Tại sao runner stage cũng khai báo lại `NEXT_PUBLIC_*`?

```dockerfile
# Stage runner
ARG NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
```

Lý do: Nếu server-side code (API Routes, Server Components) đọc `process.env.NEXT_PUBLIC_SUPABASE_URL` → cần giá trị này tồn tại trong runtime environment. Nếu chỉ dùng client-side → có thể bỏ.

---

## 5. Bảo mật

| Thực hành | Trạng thái | Giải thích |
|---|---|---|
| Non-root user | ✅ | `USER nextjs` — process không có quyền root |
| Minimal base image | ✅ | Alpine Linux, bề mặt tấn công nhỏ |
| Multi-stage (no source) | ✅ | Source code không có trong image final |
| No secrets in image | ✅ | Secrets truyền qua `env_file` runtime |
| LABEL metadata | ✅ | Traceability — biết image được tạo từ đâu |
| `npm ci` | ✅ | Reproducible builds, không bị dependency drift |

**Không nên làm:**
```dockerfile
# ❌ ĐỪNG làm thế này
ENV OPENAI_API_KEY=sk-xxx
COPY .env ./
```

---

## 6. Layer Caching — Tối ưu tốc độ build

Docker cache hoạt động theo nguyên tắc: **layer thay đổi → tất cả layers sau đó đều rebuild**.

```
Layer 1: FROM node:20-alpine          → Hầu như không bao giờ thay đổi
Layer 2: RUN apk add libc6-compat      → Chỉ rebuild khi sửa Dockerfile
Layer 3: COPY package*.json ./         → Rebuild khi thêm/xoá package
Layer 4: RUN npm ci                    → Rebuild khi layer 3 thay đổi
Layer 5: COPY . .                      ← Thay đổi thường xuyên nhất
Layer 6: RUN npm run build             ← Rebuild sau mỗi code change
```

**Chiến lược áp dụng:**
- `COPY package.json package-lock.json` → TRƯỚC khi `COPY . .`
- `npm ci` chạy trước khi copy source → Cache node_modules khi code thay đổi

**Kết quả:** Khi chỉ sửa code (không thay đổi dependencies), `npm ci` được lấy từ cache → rút ngắn build time từ ~3 phút xuống ~1 phút.

---

## 7. Tích hợp CI/CD (GitLab)

### Build stage

```yaml
script:
  - docker build
    --build-arg NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
    --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
    -t $CI_REGISTRY_IMAGE:$APP_VERSION
    -t $CI_REGISTRY_IMAGE:latest .
```

- `$NEXT_PUBLIC_SUPABASE_URL` → biến CI/CD trong GitLab Settings → CI/CD → Variables
- Tag theo version (`1.0.7`) + `latest` để dễ rollback

### Deploy stage

```yaml
ssh $VPS_USER@$VPS_IP "
  cd /app/itba-ai &&
  DOCKER_IMAGE=$DOCKER_IMAGE_VERSION docker compose pull &&
  DOCKER_IMAGE=$DOCKER_IMAGE_VERSION docker compose up -d --force-recreate
"
```

- `--force-recreate`: Bắt buộc tạo lại container dù image giống nhau
- `docker compose pull` trước: Đảm bảo đã có image mới trước khi up

### Luồng version:

```
package.json version: 1.0.7
         ↓
CI extracts: APP_VERSION=1.0.7
         ↓
Tag image: registry.gitlab.com/org/repo:1.0.7
         ↓
Deploy: DOCKER_IMAGE=....:1.0.7 docker compose up
```

---

## 8. `docker-compose.yml`

```yaml
services:
  itba-ai:
    image: ${DOCKER_IMAGE:-itba-ai:latest}
    ports:
      - "3000:3000"
    restart: always
    env_file:
      - .env
```

| Field | Giải thích |
|---|---|
| `${DOCKER_IMAGE:-itba-ai:latest}` | Dùng biến env, fallback về `itba-ai:latest` nếu không có |
| `restart: always` | Auto-restart khi crash hoặc VPS reboot |
| `env_file: .env` | Inject runtime secrets — file này được tạo bởi CI/không commit vào git |

**Lưu ý:** `docker-compose.yml` không có `build:` → chỉ pull image từ registry, không build local.

---

## 9. Checklist vận hành

### Trước khi release:
- [ ] `next.config.js` có `output: 'standalone'`
- [ ] `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` đã khai báo trong GitLab CI Variables
- [ ] `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY` đã khai báo trong GitLab CI Variables
- [ ] `.dockerignore` loại trừ: `.env`, `node_modules`, `.git`, `.next/cache`
- [ ] `package.json` version đã bump

### Sau khi deploy:
- [ ] Container đang chạy: `docker ps`
- [ ] Logs không có lỗi: `docker compose logs -f`
- [ ] App accessible tại port 3000
- [ ] Supabase connection hoạt động

### Rollback:
```bash
# Trên VPS
DOCKER_IMAGE=registry.gitlab.com/org/repo:1.0.6 \
  docker compose up -d --force-recreate
```

---

## 10. FAQ & Pitfalls

### ❓ Tại sao UI bị trắng/CSS mất sau khi deploy?

**Nguyên nhân:** `.dockerignore` quá strict, loại trừ các file CSS cần thiết cho Tailwind v4.

**Giải pháp:** Đảm bảo các file như `globals.css`, `postcss.config.*` không bị exclude.

---

### ❓ Tại sao `NEXT_PUBLIC_*` là `undefined` ở client?

**Nguyên nhân:** Biến không được truyền qua `--build-arg` trong CI.

**Kiểm tra:**
```bash
docker inspect <image> | grep NEXT_PUBLIC
```

**Giải pháp:** Xác nhận biến được khai báo trong **GitLab → Settings → CI/CD → Variables** và không phải protected-only.

---

### ❓ Port 3000 không accessible?

**Kiểm tra:**
```bash
# Trong container có listen không?
docker exec <container> netstat -tlnp | grep 3000
# Firewall VPS cho phép port 3000?
ufw status
```

---

### ❓ Container crash ngay sau khi start?

```bash
docker compose logs itba-ai
# Thường do:
# - Thiếu biến env (OPENAI_API_KEY, DATABASE_URL)
# - .next/standalone/server.js không tồn tại (quên output: 'standalone')
```

---

### ❓ Khi nào dùng `npm install` thay vì `npm ci`?

- `npm ci`: CI/CD, build reproducible → **Luôn dùng trong Dockerfile**
- `npm install`: Local development, khi muốn cập nhật lockfile

---

*Tài liệu này mô tả trạng thái Dockerfile tính đến phiên bản app 1.0.7*
