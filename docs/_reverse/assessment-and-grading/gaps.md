# Gaps — Assessment và grading

| ID | Gap | Mức | Evidence/ảnh hưởng |
| --- | --- | --- | --- |
| GAP-AS-01 | Không có automated test | High | Không tìm thấy `*.test.*`/`*.spec.*`; scoring/RLS chưa có regression gate |
| GAP-AS-02 | Public-select policy rộng | High | `Backend/supabase/migrations/20260310000000_init_schema.sql:49`, `:73`, `:98` cần threat-model review |
| GAP-AS-03 | Token lifecycle chưa rõ | Medium | Có `share_token` nhưng reverse scan chưa chứng minh expiry/revoke/attempt limit |
| GAP-AS-04 | Rubric/re-grade policy thiếu | Medium | Code chứng minh boolean grade, chưa chứng minh governance |
| GAP-AS-05 | AI outcome boundary chưa test | Medium | Có AI analysis/follow-up nhưng không có contract test/provider fallback evidence |
| GAP-AS-06 | Public test có thể trả answer key | Critical | Page select full question rows; base question policy public select (`Frontend/src/app/test/[token]/page.tsx:75`, init migration `:73`) |
| GAP-AS-07 | Submit controls chủ yếu ở client | High | Result POST chưa chứng minh server enforce schedule/capacity/single-attempt trước insert (`Frontend/src/app/api/results/route.ts:10`, `:121`) |

## Unresolved questions

OQ-AS-01 đến OQ-AS-04 trong [reverse spec](reverse-spec.md).
