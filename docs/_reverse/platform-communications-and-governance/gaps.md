# Gaps — Platform, communications và governance

| ID | Gap | Mức | Evidence/impact |
| --- | --- | --- | --- |
| GAP-PL-01 | Lint baseline đỏ | High | ESLint chạy được nhưng còn 34 errors/154 warnings; chủ yếu React hooks/purity |
| GAP-PL-02 | Không có automated tests | High | Manifest không có `test`; auth/email/version thiếu regression gate |
| GAP-PL-03 | Dependency audit | High | Frontend `npm ci` báo 22 vulnerabilities (14 high); cần triage, không auto-fix |
| GAP-PL-04 | CI chưa match GitFlow | Medium | GitLab jobs chỉ branch `release`, repo dùng `release/x.y.z` |
| GAP-PL-05 | SSH/deploy hardening | High | Legacy pipeline dùng permissive host-key workflow và tạo `.env` trên runner |
| GAP-PL-06 | Middleware convention deprecated | Low | Next build cảnh báo migrate `middleware` sang `proxy` |
| GAP-PL-07 | `npm run version` broken | Medium | Manifest trỏ `.claude/scripts/version-manager.mjs` không tồn tại |
| GAP-PL-08 | doc-drift baseline thiếu | Process | Không có `docs/features`; strict drift audit chưa hợp lệ |

Build production 2026-08-27: pass, 71 static generation units; all pages/BFF routes
được discover. Backend utilities syntax/package audit: pass, 0 vulnerabilities.

## Unresolved questions

OQ-PL-01 đến OQ-PL-05 trong [reverse spec](reverse-spec.md).
