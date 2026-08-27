# ERD — Knowledge và question bank

```mermaid
erDiagram
    DOCUMENT_SOURCES ||--o{ DOCUMENT_JOBS : processes
    DOCUMENT_SOURCES ||--o{ DOCUMENT_TOPICS : yields
    DOCUMENT_SOURCES ||--o{ QUESTION_BANK : provenance
    DOCUMENTS ||--o{ DOCUMENT_TOPICS : contains
    QUESTION_BANK }o--o{ TESTS : selected_for
```
