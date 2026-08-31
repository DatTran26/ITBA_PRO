# Phase 2: API Foundation — Persons, Positions, Skills CRUD

## Context Links
- [Phase 1: Database Schema](./phase-01-database-schema.md)
- [Existing tests route pattern](../../src/app/api/tests/route.ts)
- [Existing results/[id] pattern](../../src/app/api/results/[id]/route.ts)
- [Code Standards - API routes](../../docs/code-standards.md)

## Overview
- **Priority**: P1
- **Status**: Pending
- **Effort**: 6h
- **Dependencies**: Phase 1 (database schema)
- **Description**: Create CRUD API routes for persons, positions, and skills following existing auth+ownership patterns

## Key Insights
- Existing auth pattern: `createClient()` -> `getUser()` -> lookup `users.id` via `auth_id` -> use as ownership FK
- Admin users (`role === 'admin'`) bypass ownership filters (seen in dashboard page.tsx)
- PATCH routes use partial update pattern with field whitelisting (see `results/[id]/route.ts`)
- All routes return JSON with consistent error shape: `{ error: string }`
- Next.js 15 async params: `{ params }: { params: Promise<{ id: string }> }`

## Requirements

### Functional
- F1: CRUD for persons (list with type filter, create, get by id, update, delete)
- F2: CRUD for positions (list, create, get by id with skill requirements, update, delete)
- F3: Position skill requirements management (list, add, remove)
- F4: CRUD for skills (list with category filter, create, get by id, update, delete)

### Non-Functional
- NF1: Auth required on all endpoints
- NF2: Ownership check via `created_by` matching current user's `users.id`
- NF3: Admin bypass for SELECT operations
- NF4: Input validation with proper 400 responses
- NF5: Each route file under 200 LOC

## Architecture

### Auth + Ownership Helper
Extract repeated auth/ownership logic into a shared utility to satisfy DRY:

```typescript
// src/lib/api/auth-helpers.ts
import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export interface AuthContext {
  supabase: Awaited<ReturnType<typeof createClient>>;
  userId: string;       // users.id (not auth_id)
  authId: string;       // auth.uid()
  isAdmin: boolean;
}

export async function getAuthContext(): Promise<AuthContext | NextResponse> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: userData } = await supabase
    .from("users")
    .select("id, role")
    .eq("auth_id", user.id)
    .single();

  if (!userData) return NextResponse.json({ error: "User not found" }, { status: 401 });

  return {
    supabase,
    userId: userData.id,
    authId: user.id,
    isAdmin: userData.role === "admin",
  };
}

export function isAuthError(ctx: AuthContext | NextResponse): ctx is NextResponse {
  return ctx instanceof NextResponse;
}
```

### Route Map

| Route | Methods | File |
|-------|---------|------|
| `/api/persons` | GET, POST | `src/app/api/persons/route.ts` |
| `/api/persons/[id]` | GET, PATCH, DELETE | `src/app/api/persons/[id]/route.ts` |
| `/api/positions` | GET, POST | `src/app/api/positions/route.ts` |
| `/api/positions/[id]` | GET, PATCH, DELETE | `src/app/api/positions/[id]/route.ts` |
| `/api/positions/[id]/requirements` | GET, POST, DELETE | `src/app/api/positions/[id]/requirements/route.ts` |
| `/api/skills` | GET, POST | `src/app/api/skills/route.ts` |
| `/api/skills/[id]` | GET, PATCH, DELETE | `src/app/api/skills/[id]/route.ts` |

## Related Code Files

| File | Action | Purpose |
|------|--------|---------|
| `src/lib/api/auth-helpers.ts` | CREATE | Shared auth context extraction |
| `src/app/api/persons/route.ts` | CREATE | List + create persons |
| `src/app/api/persons/[id]/route.ts` | CREATE | Get, update, delete person |
| `src/app/api/positions/route.ts` | CREATE | List + create positions |
| `src/app/api/positions/[id]/route.ts` | CREATE | Get, update, delete position |
| `src/app/api/positions/[id]/requirements/route.ts` | CREATE | Manage skill requirements |
| `src/app/api/skills/route.ts` | CREATE | List + create skills |
| `src/app/api/skills/[id]/route.ts` | CREATE | Get, update, delete skill |

## Implementation Steps

### Step 1: Create auth helper utility
Create `src/lib/api/auth-helpers.ts` with the `getAuthContext` function shown above. This eliminates the repeated auth boilerplate in every route (currently ~15 lines duplicated per handler).

### Step 2: Persons API routes

**`src/app/api/persons/route.ts`** (~80 LOC)
```typescript
// GET: List persons for authenticated user
// Query params: ?type=candidate|employee (optional filter)
// Returns: { persons: Person[] }

// POST: Create a new person
// Body: { full_name, email, type, department?, position_id?, current_level?, joined_date?, phone?, notes? }
// Validation: full_name required, type must be 'candidate' or 'employee'
// Sets created_by = current user's users.id
// Returns: { person: Person } (201)
```

**`src/app/api/persons/[id]/route.ts`** (~90 LOC)
```typescript
// GET: Get person by id with position details
// Select: "*, positions(title, department)"
// Ownership check: created_by matches user OR admin
// Returns: { person: Person }

// PATCH: Update person fields (partial update)
// Whitelist: full_name, email, type, department, position_id, current_level, joined_date, phone, notes
// Returns: { person: Person }

// DELETE: Remove person
// Ownership check required
// Returns: { success: true }
```

### Step 3: Positions API routes

**`src/app/api/positions/route.ts`** (~70 LOC)
```typescript
// GET: List positions for authenticated user
// Select with count: "*, position_skill_requirements(count)"
// Returns: { positions: Position[] }

// POST: Create a new position
// Body: { title, department?, description?, target_level? }
// Validation: title required
// Returns: { position: Position } (201)
```

**`src/app/api/positions/[id]/route.ts`** (~80 LOC)
```typescript
// GET: Get position by id with full skill requirements
// Select: "*, position_skill_requirements(*, skills(name, category))"
// Returns: { position: Position }

// PATCH: Update position fields
// Whitelist: title, department, description, target_level
// Returns: { position: Position }

// DELETE: Remove position (cascades to requirements)
// Returns: { success: true }
```

**`src/app/api/positions/[id]/requirements/route.ts`** (~90 LOC)
```typescript
// GET: List skill requirements for a position
// Select: "*, skills(name, category, description)"
// Order by checklist_order
// Returns: { requirements: PositionSkillRequirement[] }

// POST: Add a skill requirement
// Body: { skill_id, required_level?, is_mandatory?, checklist_order? }
// Validation: skill_id required, required_level 1-5
// Returns: { requirement: PositionSkillRequirement } (201)

// DELETE: Remove a skill requirement
// Body: { requirement_id }
// Returns: { success: true }
```

### Step 4: Skills API routes

**`src/app/api/skills/route.ts`** (~70 LOC)
```typescript
// GET: List skills for authenticated user
// Query params: ?category=string (optional filter)
// Returns: { skills: Skill[] }

// POST: Create a new skill
// Body: { name, category?, description? }
// Validation: name required
// Returns: { skill: Skill } (201)
```

**`src/app/api/skills/[id]/route.ts`** (~80 LOC)
```typescript
// GET: Get skill by id
// Returns: { skill: Skill }

// PATCH: Update skill fields
// Whitelist: name, category, description
// Returns: { skill: Skill }

// DELETE: Remove skill (cascades to requirements + evaluations)
// Returns: { success: true }
```

### Step 5: Verify compilation
Run `npm run build` after each route file to catch TypeScript errors early.

## Todo List
- [ ] Create `src/lib/api/auth-helpers.ts`
- [ ] Create `src/app/api/persons/route.ts` (GET, POST)
- [ ] Create `src/app/api/persons/[id]/route.ts` (GET, PATCH, DELETE)
- [ ] Create `src/app/api/positions/route.ts` (GET, POST)
- [ ] Create `src/app/api/positions/[id]/route.ts` (GET, PATCH, DELETE)
- [ ] Create `src/app/api/positions/[id]/requirements/route.ts` (GET, POST, DELETE)
- [ ] Create `src/app/api/skills/route.ts` (GET, POST)
- [ ] Create `src/app/api/skills/[id]/route.ts` (GET, PATCH, DELETE)
- [ ] Verify all routes compile (`npm run build`)
- [ ] Test each endpoint with authenticated requests

## Success Criteria
- All 7 route files exist and compile without errors
- Auth helper extracts user context consistently across all routes
- Each route validates required fields and returns 400 for invalid input
- Ownership checks prevent cross-user data access
- Admin users can read all records
- DELETE cascades work correctly (deleting position removes its requirements)
- All files under 200 LOC

## Risk Assessment
| Risk | Impact | Mitigation |
|------|--------|------------|
| Auth helper breaks existing routes | MEDIUM | New file, no changes to existing code |
| RLS blocks valid requests | MEDIUM | Test with real Supabase auth, not mocks |
| Circular FK (persons -> positions, positions used by persons) | LOW | FK added after both tables exist |

## Security Considerations
- All endpoints require authentication (no anonymous access)
- Ownership verified at both API level (explicit check) and DB level (RLS)
- Input validation prevents SQL injection via parameterized Supabase queries
- Field whitelisting on PATCH prevents mass assignment attacks
- No sensitive data in error messages (generic "Failed to save" on DB errors)

## Next Steps
- Phase 3: Groups and Skill Evaluations API routes
- Phase 4: UI pages that consume these API routes
