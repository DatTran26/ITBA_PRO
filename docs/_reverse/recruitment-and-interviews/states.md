# States — Recruitment và interviews

```mermaid
stateDiagram-v2
    [*] --> NEW
    NEW --> SCREENED
    NEW --> REJECTED
    SCREENED --> SHORTLISTED
    SCREENED --> REJECTED
    SHORTLISTED --> INTERVIEW_SCHEDULED
    INTERVIEW_SCHEDULED --> PASSED
    INTERVIEW_SCHEDULED --> FAILED
    PASSED --> OFFERED
    OFFERED --> ACCEPTED
    OFFERED --> OFFER_REJECTED
    ACCEPTED --> ONBOARDED
```

Conflict cần quyết định: helper ba vòng mô tả lifecycle sâu hơn nhưng chưa được
live route gọi.
