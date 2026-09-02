# States — Platform, communications và governance

```mermaid
stateDiagram-v2
    [*] --> Draft
    Draft --> Approved: super-admin approval
    Approved --> Published: publication condition reached
    Published --> Read: user read marker
    Published --> Published: unread for another user
```

Diagram mô hình hoá version-notification lifecycle từ routes/migrations; không
đại diện Git release lifecycle.
