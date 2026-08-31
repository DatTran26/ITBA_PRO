# Evidence matrix — Recruitment và interviews

| Requirement | BFF/logic | Schema/platform | Confidence |
| --- | --- | --- | --- |
| FR-RC-01 | upload route | CV storage + application tables | High |
| FR-RC-02 | cv-analysis route | screenings/CV states + CV Edge Function | High |
| FR-RC-03 | status route/state machine | status history | High |
| FR-RC-04 | schedule route | interview_schedules | High |
| FR-RC-05 | respond route | acceptance-flow migration | High |
| FR-RC-06 | result route | interview_results | High |
| FR-RC-07 | offer route | person/application update | High |

Negative evidence: `checkOfferEligibility` không có caller trong `Frontend/src`;
không tìm thấy automated test files trong source/Backend Supabase scope.
