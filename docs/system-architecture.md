---
type: architecture-navigation
status: active
---

# System architecture

Town Hown separates the web application, Supabase platform, independently
deployable vision services, and external AI/email providers. This boundary keeps
personnel decisions and their audit trail under the product's control while AI
and integrations remain supporting providers.

The authoritative architecture guide is
[`downtown/architecture.md`](downtown/architecture.md). It records the current
system boundaries, trust boundaries, durable design decisions, and links to the
source, schema, and deployment owners. Use the executable owners it links to
for implementation detail.

## Architecture decisions

- `Frontend/` is the single Next.js deployable and owns the same-origin BFF.
- `Backend/` owns Supabase schema evolution, RLS, storage policy, and Edge
  Functions.
- Human review and authorization remain required before AI-derived output
  becomes a personnel decision or business fact.
- Vision services may run independently; they do not own HRMS business state.

See [`downtown/security.md`](downtown/security.md) for the security constraints
that apply across these boundaries and
[`codebase-summary.md`](codebase-summary.md) for repository navigation.
