# UC-PL-01 — Authenticate và route user

- **Actor:** Anonymous/authenticated user.
- **Flow:** request → refresh Supabase session → nếu protected và thiếu user thì
  redirect login → nếu authenticated thì role-aware route handling → dashboard.
- **Constraint:** Middleware không thay BFF authorization/RLS.
- **Evidence:** `Frontend/src/middleware.ts:4-81`.
