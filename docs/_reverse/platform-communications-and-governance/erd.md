# ERD — Platform, communications và governance

```mermaid
erDiagram
    AUTH_USERS ||--o| USERS : profiles
    USERS ||--o{ ACTIVITY_LOGS : produces
    USERS ||--o{ USER_VERSION_READS : records
    VERSIONS ||--o{ USER_VERSION_READS : acknowledged
    EMAIL_TEMPLATES ||--o{ EMAIL_LOGS : renders
    EMAIL_PROVIDER_CONFIG ||--o{ EMAIL_LOGS : delivers
    USERS ||--o{ AI_USAGE : consumes
```
