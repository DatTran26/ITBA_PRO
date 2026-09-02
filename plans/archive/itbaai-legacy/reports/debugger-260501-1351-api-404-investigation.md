# API 404 Investigation Report
**Date**: 2026-05-01 | **Investigator**: debugger agent

---

## Executive Summary

The reported 404s are NOT from Next.js routing or application code. All five API routes return **401 Unauthorized** when hit directly — both locally and via Cloudflare tunnel. The routes exist, compile correctly, and execute application code. The 404 the user observed in browser DevTools is almost certainly from `_next/data/[BUILD_ID]/...` prefetch requests (always 404 in App Router), or from a stale production build that predates the `recruitment/activity` route.

**Status: NOT a code bug. Routes are healthy.**

---

## Investigation Results

### Check 1: Catch-all / not-found handlers
- No `src/app/api/[...path]/route.ts`
- No `src/app/api/not-found.ts` or any `not-found.ts` under `src/app/api/`
- **Result: PASS — nothing intercepting routes**

### Check 2: next.config.ts rewrites/redirects
```ts
// next.config.ts has NO rewrites, NO redirects
// Only: env, images, experimental.optimizePackageImports, poweredByHeader, output: "standalone"
// allowedDevOrigins: ['conditions-taylor-todd-char.trycloudflare.com']
```
- **Result: PASS — no config interference**

### Check 3: Middleware
- Middleware correctly sets `isApiRoute = pathname.startsWith('/api/')` and skips auth redirect for API routes
- One risk: if `NEXT_PUBLIC_SUPABASE_URL` or `NEXT_PUBLIC_SUPABASE_ANON_KEY` are missing at runtime, middleware returns **500** (not 404) for ALL routes
- **Result: PASS — middleware does not cause 404 for API routes**

### Check 4: error.ts / not-found.ts hierarchy
- No `error.ts` or `not-found.ts` under `src/app/api/`
- **Result: PASS**

### Check 5: SUPABASE env vars
```
SUPABASE_SERVICE_ROLE_KEY → MISSING from shell env (bash context)
NEXT_PUBLIC_SUPABASE_URL  → MISSING from shell env (bash context)
```
- Shell env ≠ Next.js server env. `NEXT_PUBLIC_*` vars are baked at build time. Server picks up vars from its own shell at startup.
- The running dev server started with env vars set → routes execute fine
- **Result: NOT the cause of 404**

### Check 6: Direct curl tests (CRITICAL)
```
curl http://localhost:3000/api/recruitment/dashboard   → HTTP 401
curl http://localhost:3000/api/recruitment/applications?pageSize=20 → HTTP 401
curl http://localhost:3000/api/recruitment/activity   → HTTP 401
curl http://localhost:3000/api/versions/unread        → HTTP 401
curl http://localhost:3000/api/recruitment/interviews → HTTP 401

# Via Cloudflare tunnel:
curl https://conditions-taylor-todd-char.trycloudflare.com/api/recruitment/dashboard → HTTP 401
curl https://conditions-taylor-todd-char.trycloudflare.com/api/recruitment/activity  → HTTP 401
```
- **All routes return 401, NOT 404. Routes exist and run application code.**

### Check 7: Compiled build artifacts
Server is running in **dev mode** (`.next/dev/server/`) — BUILD_ID exists from a prior `next build`.

| Route | `.next/dev/server/` | `.next/server/` (prod) | `.next/standalone/` |
|-------|---------------------|------------------------|---------------------|
| recruitment/dashboard | ✓ | ✓ | ✓ |
| recruitment/applications | ✓ | ✓ | ✓ |
| recruitment/activity | ✓ | **MISSING** | **MISSING** |
| recruitment/interviews | ✓ | ✓ | ✓ |
| versions/unread | ✓ | ✓ | ✓ |

`recruitment/activity` was added AFTER the last `next build` run. The standalone/production builds are stale.

### Check 8: instrumentation.ts / server.ts
- No `instrumentation.ts` at project root or src/
- `src/lib/supabase/server.ts` exists (Supabase client, not a custom HTTP server)
- **Result: PASS**

### The _next/data red herring
```
curl http://localhost:3000/_next/data/rHXZM1fNycPCb5nz5Lgon/api/recruitment/dashboard.json → 404
```
ALL `_next/data/[BUILD_ID]/...` requests return 404 in Next.js App Router — this is expected behavior. App Router uses RSC streaming, not the `_next/data` pattern from Pages Router. If browser DevTools shows these requests as 404, it is **not an error**.

---

## Root Cause

**The routes are working correctly.** The 404 the user observed is one of:

1. **Primary (most likely)**: Browser DevTools captured `_next/data/[BUILD_ID]/api/...` prefetch requests, which always return 404 in App Router — this is normal and harmless
2. **Secondary**: If the production standalone build was deployed before `recruitment/activity` was created, that specific route returns 404 in production. The other 4 routes would still return 401 in production.

---

## Actionable Fixes

### For `recruitment/activity` missing from production build
Run a fresh production build:
```bash
npm run build
# Then restart the server
```
This will include `activity` in `.next/server/` and `.next/standalone/`.

### If user is seeing 404 in browser DevTools
Filter out `_next/data` requests in the DevTools Network tab — these are expected 404s from App Router prefetch behavior and do not indicate a routing problem.

### For the standalone deployment
After rebuilding, re-copy the standalone output to the deployment target.

---

## What is NOT broken
- Route file structure: correct
- Route handler code: no `notFound()` calls, correct auth/error returns
- Middleware: correctly bypasses API routes
- next.config.ts: no problematic rewrites
- TypeScript: no compilation errors
- Cloudflare tunnel: passing through correctly

---

## Unresolved Questions
1. Where exactly did the user see 404? (browser DevTools Network tab? Server logs? Application error display?) — determines whether this is the `_next/data` red herring or a real production deployment gap
2. Is the production deployment using the standalone build or `next start`? If standalone, was it deployed before or after `recruitment/activity` was created?
3. The `.env.local` only has `NEXT_PUBLIC_APP_URL`. Where are `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` set? (shell profile / CI secrets) — if missing at build time, `NEXT_PUBLIC_*` would be undefined in browser, causing 500s not 404s
