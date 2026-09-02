# Flows — Talent và CRM

```mermaid
flowchart LR
    HR[HR/Admin] --> P[Person profile]
    HR --> POS[Position]
    HR --> R[Skill requirements]
    P --> PS[Person skills]
    POS --> R
    PS --> S[Match calculator]
    R --> S
    S --> O[Score, missing skills, gaps]
    P --> G[Group membership]
    O --> GC[Group coverage]
    G --> GC
```
