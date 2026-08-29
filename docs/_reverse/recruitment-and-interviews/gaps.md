# Gaps — Recruitment và interviews

| ID | Gap | Mức | Evidence/impact |
| --- | --- | --- | --- |
| GAP-RC-01 | Multi-round offer gate không được gọi | High | `offer-gate.ts:15`; negative search không có caller |
| GAP-RC-02 | First result có thể chốt pipeline | High | interview result route `:72`; conflict với three-round helper |
| GAP-RC-03 | CV có thể kẹt PROCESSING | High | State set trước JD validation; 422 paths chưa reset (`cv-analysis/route.ts:50`) |
| GAP-RC-04 | Admin-client ownership scope | High | Broad role gates + service access có thể vượt RLS intent |
| GAP-RC-05 | API role và RLS matrix khác nhau | High | Schedule API cho HR/interviewer, migration policy mô tả khác |
| GAP-RC-06 | Duplicate person/application | Medium | Email-only matching; không thấy unique person/JD application |
| GAP-RC-07 | Không có automated tests | High | Pipeline/auth/CV failure không có regression suite |

## Unresolved questions

OQ-RC-01 đến OQ-RC-06 trong [reverse spec](reverse-spec.md).
