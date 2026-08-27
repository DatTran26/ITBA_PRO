# Evidence matrix — Talent và CRM

| Requirement | BFF/logic | Schema | Confidence |
| --- | --- | --- | --- |
| FR-TL-01 | persons/positions/groups routes | owner-scoped RLS tables | High |
| FR-TL-02 | requirements route | position_skill_requirements | High |
| FR-TL-03 | scoring person route | person_skills + requirements | High |
| FR-TL-04 | scoring group route | group_members | High |
| FR-TL-05 | evaluation routes | skill_evaluations | High |
| FR-TL-06 | CRM BFF routes | notes/logs/tags/tasks | High |

Negative evidence: không tìm thấy test runner; không có evidence business owner
đã phê duyệt công thức score.
