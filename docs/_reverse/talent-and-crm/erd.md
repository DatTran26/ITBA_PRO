# ERD — Talent và CRM

```mermaid
erDiagram
    PERSONS }o--|| POSITIONS : assigned_to
    PERSONS ||--o{ PERSON_SKILLS : has
    SKILLS ||--o{ PERSON_SKILLS : describes
    POSITIONS ||--o{ POSITION_SKILL_REQUIREMENTS : requires
    SKILLS ||--o{ POSITION_SKILL_REQUIREMENTS : required_skill
    SKILL_CATEGORIES ||--o{ SKILLS : groups
    SKILLS ||--o{ LEVEL_SKILL_EXPECTATIONS : expected_at
    SKILLS ||--o{ SKILL_EVALUATIONS : scored_in
    RESULTS ||--o{ SKILL_EVALUATIONS : from
    GROUPS ||--o{ GROUP_MEMBERS : contains
    PERSONS ||--o{ GROUP_MEMBERS : joins
    PERSONS ||--o{ NOTES : subject
    PERSONS ||--o{ CRM_TASKS : subject
    TAGS ||--o{ ENTITY_TAGS : applied
    SKILLS ||--o{ SKILL_DOCUMENTS : evidence
```
