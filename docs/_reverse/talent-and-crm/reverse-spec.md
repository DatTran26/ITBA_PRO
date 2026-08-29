# Reverse SRS — Talent và CRM

## Scope

✅ Feature cluster quản lý person, position, skill, group, notes/tasks/tags và
tính mức phù hợp giữa năng lực hiện có với yêu cầu vị trí. UI/BFF nằm trong
Frontend; model, RLS và lịch sử dữ liệu nằm trong Backend.

## Actors

- HR/admin: quản lý master data và quan hệ.
- Manager/reviewer: xem coverage, gap và activity trong phạm vi được cấp.
- Person/employee/candidate: subject của profile và skill evidence.

## Functional requirements

- **FR-TL-01 ✅** Persons, positions và groups có list/detail CRUD boundaries
  (`Frontend/src/app/api/persons/route.ts:5`,
  `Frontend/src/app/api/positions/route.ts:4`,
  `Frontend/src/app/api/groups/route.ts:5`).
- **FR-TL-02 ✅** Position sở hữu skill requirements
  (`Frontend/src/app/api/positions/[id]/requirements/route.ts:6`).
- **FR-TL-03 ✅** Person match trả score, missing skills và gap details
  (`Frontend/src/app/api/scoring/person/[id]/route.ts:62`).
- **FR-TL-04 ✅** Group coverage tổng hợp members, assigned positions và skill
  match (`Frontend/src/app/api/scoring/group/[id]/route.ts:20`, `:51`, `:103`).
- **FR-TL-05 ✅** Person skills là relation riêng; skill evaluations gắn với
  result (`Backend/supabase/migrations/20260331000000_crm_layer_schema.sql:32`,
  `Backend/supabase/migrations/20260326000000_talent_assessment_schema.sql:248`).
- **FR-TL-06 ✅** CRM layer có notes, activity logs, tags/entity-tags và tasks
  (`Backend/supabase/migrations/20260331000000_crm_layer_schema.sql:71`, `:88`,
  `:121`, `:146`, `:175`).

## Business rules

1. Match score là derived value từ person skills và position requirements.
2. Group skill coverage chỉ tính được khi member có assigned position.
3. 🟡 Assessment proxy theo email chưa phải employment-assessment relation chắc
   chắn (`Frontend/src/app/api/scoring/group/[id]/route.ts:110`).
4. Ownership/RLS phải được enforce ở data layer, không chỉ ẩn UI.

## Open questions

- **OQ-TL-01:** Ai sở hữu và phê duyệt skill level của một person?
- **OQ-TL-02:** Công thức match/weight/mandatory threshold là business authority nào?
- **OQ-TL-03:** Person là employee, candidate hay contact đa loại?
- **OQ-TL-04:** Email matching có được thay bằng relation chính thức không?
