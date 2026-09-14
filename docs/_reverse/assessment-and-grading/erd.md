# ERD — Assessment và grading

```mermaid
erDiagram
    USERS ||--o{ TESTS : creates
    TESTS ||--|{ QUESTIONS : contains
    TESTS ||--o{ RESULTS : receives
    RESULTS ||--o{ ANSWER_GRADES : overlays
    RESULTS ||--o{ FOLLOW_UP_SESSIONS : supports
    QUESTION_BANK ||--o{ TESTS : pulled_into
    FAVOURITE_QUESTIONS }o--o| QUESTION_BANK : copies
```

Cardinality được suy ra từ foreign-key usage và query relations; xem
[sources](sources.md) trước khi dùng làm migration authority.

Bảng authority: `Backend/supabase/migrations` khớp live `itba-ai` (46 bảng
`public`) tại 2026-09-02, trừ `lock_public_assessment_access` chưa apply lên
live.
