# ERD — Platform, communications và governance

```mermaid
erDiagram
    AUTH_USERS ||--o| USERS : profiles
    USERS ||--o{ ACTIVITY_LOGS : produces
    USERS ||--o{ USER_VERSION_READS : records
    VERSIONS ||--o{ USER_VERSION_READS : acknowledged
    USERS ||--o{ VERSIONS : authors
    EMAIL_TEMPLATES ||--o{ EMAIL_LOGS : renders
    EMAIL_PROVIDER_CONFIG ||--o{ EMAIL_LOGS : delivers
    USERS ||--o{ AI_USAGE : consumes
    USERS ||--o{ ASSESSMENT_TEMPLATES : owns
    SYSTEM_SETTINGS ||--o{ USERS : configures
```

`versions` có `CREATE TABLE` trong
`Backend/supabase/migrations/20260325000000_create_versions_table.sql` (trước
đây chỉ ALTER, bảng do dashboard tạo trên live).
