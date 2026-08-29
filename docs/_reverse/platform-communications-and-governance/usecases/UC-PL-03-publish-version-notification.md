# UC-PL-03 — Publish version notification

- **Actors:** Super admin, authenticated user.
- **Flow:** tạo draft → update/approve → user query approved unread versions →
  user marks version IDs read.
- **Exception:** Chỉ draft version được xoá.
- **Evidence:** `Frontend/src/app/api/versions/route.ts:17`, `:156`,
  `Frontend/src/app/api/versions/unread/route.ts:4`, `:39`.
