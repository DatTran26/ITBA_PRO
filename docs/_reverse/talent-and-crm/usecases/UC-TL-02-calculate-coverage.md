# UC-TL-02 — Tính position/group coverage

- **Actor:** HR/manager.
- **Precondition:** Requirements và person skills đã có.
- **Flow:** chọn person/group → load relations → calculate match/missing/gaps →
  trả aggregate.
- **Exception:** Member chưa có position không góp skill coverage.
- **Postcondition:** Derived response; không chứng minh persisted score.
- **Evidence:** `Frontend/src/app/api/scoring/person/[id]/route.ts:62`,
  `Frontend/src/app/api/scoring/group/[id]/route.ts:51`.
