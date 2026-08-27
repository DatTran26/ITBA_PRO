# Evidence matrix — Assessment và grading

| Requirement | UI/API | Logic | Schema | Confidence |
| --- | --- | --- | --- | --- |
| FR-AS-01 | tests routes | share token generation | tests | High |
| FR-AS-02 | test detail GET | relation select | questions/results | High |
| FR-AS-03 | result POST | auto/manual split | results | High |
| FR-AS-04 | result POST | grade overlay insert | answer_grades | High |
| FR-AS-05 | grade PATCH | recompute owner | results/answer_grades | High |
| FR-AS-06 | — | recompute formula | results | High |
| FR-AS-07 | follow-up route | CRUD mapping | follow_up_sessions | High |

Negative evidence: reverse scan không tìm thấy test runner/script trong
`Frontend/package.json`; không tuyên bố các luồng đã được integration-tested.
