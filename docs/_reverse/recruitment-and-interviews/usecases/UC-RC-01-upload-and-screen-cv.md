# UC-RC-01 — Upload và screen CV

- **Actor:** HR/admin/interviewer theo route gate.
- **Flow:** validate file → upload storage → resolve/create person → create CV và
  NEW application → analyze against JD → persist screening → SCREENED/REJECTED.
- **Failure:** parse exception chuyển CV FAILED; missing JD path có rủi ro để
  PROCESSING và cần fix riêng.
- **Evidence:** upload route `:23-124`, cv-analysis route `:40-291`.
