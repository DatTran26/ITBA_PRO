# Role Permissions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce role-based access control so HR manages recruitment pipeline, Interviewer creates candidate tests, Recruiter creates employee tests, and Admin has full access.

**Architecture:** Three-layer enforcement — (1) API guards block unauthorized `target_type` per role, (2) UI filters `TargetTypeSelector` options to only allowed types, (3) Fix pre-existing `CAN_OVERRIDE` misassignment in recruitment UI. Foundation is adding `isRecruiter` flag to auth-helpers, which all other tasks depend on.

**Tech Stack:** Next.js App Router, TypeScript, Supabase (auth), React client components

---

## Role Permission Matrix

| Role | Recruitment pipeline | Create Candidate test | Create Employee test | Override CV score | Manage persons/skills |
|------|:-------------------:|:--------------------:|:-------------------:|:-----------------:|:---------------------:|
| `hr` | ✅ | ❌ | ❌ | ✅ | ❌ |
| `interviewer` | ✅ | ✅ | ❌ | ✅ | ❌ |
| `recruiter` | ❌ | ❌ | ✅ | ❌ | ✅ |
| `admin` / `super_admin` | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## File Map

| Action | File | Change |
|--------|------|--------|
| Modify | `src/lib/api/auth-helpers.ts` | Add `isRecruiter` flag |
| Modify | `src/app/api/tests/route.ts` | Validate `target_type` against role in POST |
| Modify | `src/app/api/recruitment/applications/[id]/override-score/route.ts` | Fix role guard: recruiter → hr+interviewer |
| Modify | `src/components/management/target-type-selector.tsx` | Add `allowedTypes` prop |
| Modify | `src/app/dashboard/create/page.tsx` | Fetch user role, compute allowedTypes, auto-select |
| Modify | `src/app/dashboard/recruitment/[id]/cv-analyze/cv-analyze-client.tsx` | Fix CAN_OVERRIDE |
| Modify | `src/app/dashboard/recruitment/[id]/application-detail-client.tsx` | Fix CAN_OVERRIDE |

---

## Task 1: Add `isRecruiter` to auth-helpers

**Files:**
- Modify: `src/lib/api/auth-helpers.ts`

**Context:** `auth-helpers.ts` exports `getAuthContext()` which returns an object with flags like `isAdmin`, `isHr`, `isInterviewer`. The `recruiter` role has no flag, making it impossible to guard API routes cleanly.

- [ ] **Step 1: Read the file**

```bash
cat "src/lib/api/auth-helpers.ts"
```

Identify the line that sets `isInterviewer` (currently last flag). Add `isRecruiter` after it.

- [ ] **Step 2: Add `isRecruiter` to the return type interface and return value**

The `AuthContext` interface (or inline type) needs:
```ts
isRecruiter: boolean;
```

The return value currently has:
```ts
isHr: role === "hr",
isInterviewer: role === "interviewer",
```

Add after `isInterviewer`:
```ts
isRecruiter: role === "recruiter",
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```
Expected: no errors (adding a new field shouldn't break callers unless the return type is `exact`).

- [ ] **Step 4: Commit**

```bash
git add src/lib/api/auth-helpers.ts
git commit -m "feat: add isRecruiter flag to auth context"
```

---

## Task 2: Fix override-score API — recruiter → hr+interviewer

**Files:**
- Modify: `src/app/api/recruitment/applications/[id]/override-score/route.ts`

**Context:** The override-score API currently allows `recruiter` and `admin` to override candidate screening scores. Per requirements, recruiters don't manage the recruitment pipeline — only HR, Interviewer, and Admin should override.

Current (wrong):
```ts
if (ctx.role !== "recruiter" && !ctx.isAdmin) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

- [ ] **Step 1: Read the file**

```bash
cat "src/app/api/recruitment/applications/[id]/override-score/route.ts"
```

- [ ] **Step 2: Replace the role guard**

Find:
```ts
if (ctx.role !== "recruiter" && !ctx.isAdmin) {
```

Replace with:
```ts
if (!ctx.isHr && !ctx.isInterviewer && !ctx.isAdmin) {
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/recruitment/applications/[id]/override-score/route.ts
git commit -m "fix: restrict override-score to hr/interviewer/admin — remove recruiter access"
```

---

## Task 3: Fix test POST API — validate target_type per role

**Files:**
- Modify: `src/app/api/tests/route.ts`

**Context:** The test creation API (`POST /api/tests`) accepts a `target_type` field (`"candidate"` | `"employee"`) but doesn't validate it against the creator's role. An interviewer could POST `target_type: "employee"` to bypass the UI restriction. Needs server-side enforcement.

Current state (lines ~44-103):
```ts
const TEST_CREATE_ROLES = ["recruiter", "interviewer", "admin", "super_admin"];
// ...
if (!TEST_CREATE_ROLES.includes(userData?.role ?? "")) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
// ...
const { ..., target_type = 'candidate', ... } = body;
```

No validation between `role` and `target_type`.

- [ ] **Step 1: Read the POST handler in route.ts**

```bash
sed -n '44,120p' "src/app/api/tests/route.ts"
```

Identify: (a) where `userData` is fetched, (b) where `target_type` is destructured from body, (c) where role check happens.

- [ ] **Step 2: Add target_type validation after the role check**

After the existing role check (`if (!TEST_CREATE_ROLES.includes(...))`), add:

```ts
// Enforce target_type per role
const role = userData?.role ?? "";
if (role === "interviewer" && target_type !== "candidate") {
  return NextResponse.json(
    { error: "Interviewers can only create candidate assessments" },
    { status: 403 }
  );
}
if (role === "recruiter" && target_type !== "employee") {
  return NextResponse.json(
    { error: "Recruiters can only create employee assessments" },
    { status: 403 }
  );
}
```

**Important:** This block must go AFTER `target_type` is destructured from `body` and AFTER the initial role check.

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/api/tests/route.ts
git commit -m "fix: enforce target_type per role in test creation API"
```

---

## Task 4: Update TargetTypeSelector — add allowedTypes prop

**Files:**
- Modify: `src/components/management/target-type-selector.tsx`

**Context:** Currently renders both Candidate and Employee options unconditionally. Needs an `allowedTypes` prop to filter which options are displayed.

Current component signature:
```ts
interface Props {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

const OPTIONS = [
    { value: "candidate", label: "Candidate", icon: Users, desc: "For external applicants" },
    { value: "employee", label: "Employee", icon: UserCheck, desc: "For internal evaluation" },
];
```

- [ ] **Step 1: Add `allowedTypes` to Props and filter OPTIONS**

Replace the entire file content with:

```tsx
"use client";

import { Users, UserCheck } from "lucide-react";

interface Props {
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
    allowedTypes?: string[]; // if omitted, all types shown
}

const OPTIONS = [
    { value: "candidate", label: "Candidate", icon: Users, desc: "For external applicants" },
    { value: "employee", label: "Employee", icon: UserCheck, desc: "For internal evaluation" },
];

export default function TargetTypeSelector({ value, onChange, disabled, allowedTypes }: Props) {
    const visibleOptions = allowedTypes
        ? OPTIONS.filter((o) => allowedTypes.includes(o.value))
        : OPTIONS;

    return (
        <div className="flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-[#5A6882]">
                Assessment Type<span className="text-red-500 text-sm font-bold ml-1">*</span>
            </span>
            <div className={`grid gap-3 ${visibleOptions.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
                {visibleOptions.map((opt) => {
                    const Icon = opt.icon;
                    const active = value === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            disabled={disabled}
                            onClick={() => onChange(opt.value)}
                            className={`flex flex-col items-start gap-2 p-3 rounded-xl border text-left transition-all duration-300 disabled:opacity-50 ${
                                active
                                    ? "bg-[#5B6CF0] border-[#5B6CF0] text-white shadow-[0_4px_15px_-3px_rgba(91,108,240,0.4)] ring-1 ring-[#5B6CF0]"
                                    : "bg-black/30 border-white/5 text-[#8B99B0] hover:border-white/10 hover:bg-white/5 hover:text-white"
                            }`}
                        >
                            <div className="flex items-center gap-2">
                                <Icon className={`w-3.5 h-3.5 ${active ? "text-white" : "text-[#5A6882]"}`} />
                                <div className="text-[11px] font-bold tracking-wide">{opt.label}</div>
                            </div>
                            <div className="text-[9px] opacity-70 leading-tight">{opt.desc}</div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors (new optional prop is backward-compatible — existing callers without `allowedTypes` still work).

- [ ] **Step 3: Commit**

```bash
git add src/components/management/target-type-selector.tsx
git commit -m "feat: add allowedTypes prop to TargetTypeSelector for role-based filtering"
```

---

## Task 5: Update create/page.tsx — fetch role, filter types, auto-select

**Files:**
- Modify: `src/app/dashboard/create/page.tsx`

**Context:** `create/page.tsx` is a large client component (`"use client"`). It uses `TargetTypeSelector` with a `targetType` state that defaults to `"candidate"`. Needs to:
1. Fetch current user's role from Supabase on mount
2. Compute `allowedTargetTypes` from role
3. Pass to `TargetTypeSelector`
4. Auto-set `targetType` to the single allowed value when role has only one option

Role → allowedTypes mapping:
- `"interviewer"` → `["candidate"]`
- `"recruiter"` → `["employee"]`
- `"admin"` / `"super_admin"` → `["candidate", "employee"]`
- `"hr"` → `[]` (HR can't create tests — should be blocked at nav level, but defensive)

- [ ] **Step 1: Read the relevant section of create/page.tsx**

```bash
sed -n '140,175p' "src/app/dashboard/create/page.tsx"
```

Find: (a) where `targetType` state is initialized, (b) where `TargetTypeSelector` is rendered.

- [ ] **Step 2: Add userRole state and fetch**

Near the top of the component function (after existing `useState` declarations), add:

```tsx
const [userRole, setUserRole] = useState<string>("");

useEffect(() => {
    const fetchRole = async () => {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        const { data } = await supabase
            .from("users")
            .select("role")
            .eq("auth_id", user.id)
            .single();
        if (data?.role) setUserRole(data.role);
    };
    fetchRole();
}, []);
```

- [ ] **Step 3: Add allowedTargetTypes computation and auto-select effect**

After the `userRole` state, add:

```tsx
const allowedTargetTypes: string[] = (() => {
    if (userRole === "interviewer") return ["candidate"];
    if (userRole === "recruiter") return ["employee"];
    if (userRole === "admin" || userRole === "super_admin") return ["candidate", "employee"];
    return ["candidate", "employee"]; // fallback while loading or hr (nav blocks hr)
})();

// Auto-select when role has exactly one allowed type
useEffect(() => {
    if (allowedTargetTypes.length === 1) {
        setTargetType(allowedTargetTypes[0]);
    }
}, [userRole]); // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 4: Pass allowedTypes to TargetTypeSelector**

Find the `<TargetTypeSelector` JSX in the file. Add the `allowedTypes` prop:

Before:
```tsx
<TargetTypeSelector
    value={targetType}
    onChange={setTargetType}
```

After:
```tsx
<TargetTypeSelector
    value={targetType}
    onChange={setTargetType}
    allowedTypes={allowedTargetTypes}
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Fix any errors before proceeding.

- [ ] **Step 6: Commit**

```bash
git add src/app/dashboard/create/page.tsx
git commit -m "feat: filter assessment type options by user role in test creation form"
```

---

## Task 6: Fix CAN_OVERRIDE in recruitment UI files

**Files:**
- Modify: `src/app/dashboard/recruitment/[id]/cv-analyze/cv-analyze-client.tsx`
- Modify: `src/app/dashboard/recruitment/[id]/application-detail-client.tsx`

**Context:** Both files define:
```ts
const CAN_OVERRIDE = ["recruiter", "admin", "super_admin"];
```

Per requirements, recruiters don't touch the recruitment pipeline. Override scoring is an HR/Interviewer/Admin action.

Correct value:
```ts
const CAN_OVERRIDE = ["hr", "interviewer", "admin", "super_admin"];
```

- [ ] **Step 1: Fix cv-analyze-client.tsx**

Find:
```ts
const CAN_OVERRIDE = ["recruiter", "admin", "super_admin"];
```

Replace with:
```ts
const CAN_OVERRIDE = ["hr", "interviewer", "admin", "super_admin"];
```

- [ ] **Step 2: Fix application-detail-client.tsx**

Same change — find and replace the same line.

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit 2>&1 | head -20
```

- [ ] **Step 4: Commit**

```bash
git add src/app/dashboard/recruitment/[id]/cv-analyze/cv-analyze-client.tsx
git add src/app/dashboard/recruitment/[id]/application-detail-client.tsx
git commit -m "fix: correct CAN_OVERRIDE roles — hr+interviewer replace recruiter for CV score override"
```

---

## Task 7: TypeScript + Build validation

- [ ] **Step 1: Full TypeScript check**

```bash
npx tsc --noEmit 2>&1 | head -50
```

Expected: zero errors. Fix any errors found before continuing.

- [ ] **Step 2: Production build**

```bash
npm run build 2>&1 | tail -20
```

Expected: clean build with no errors.

- [ ] **Step 3: Verify route still renders**

```bash
npm run build 2>&1 | grep -E "cv-analyze|tests|override|create"
```

Expected: routes appear as `ƒ` (dynamic server-rendered).

- [ ] **Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: resolve TypeScript/build errors from role permissions implementation"
```

---

## Self-Review Checklist

- [x] `isRecruiter` added to auth-helpers (Task 1) — used by API guards in Tasks 2+3
- [x] `override-score` API fixed: was recruiter-only → now hr+interviewer+admin (Task 2)
- [x] Test POST API validates `target_type` per role server-side (Task 3) — can't bypass via API
- [x] `TargetTypeSelector` backward-compatible (`allowedTypes` is optional) (Task 4)
- [x] Create page auto-selects when role has one allowed type (Task 5)
- [x] `CAN_OVERRIDE` fixed in both cv-analyze-client + application-detail-client (Task 6)
- [x] Navbar role arrays (`RECRUITMENT_ROLES`, `MGMT_ALLOWED_ROLES`) already correct — no change needed
- [x] Test GET API already scoped by `recruiter_id = userData.id` — no additional filter needed

**Known gaps (out of scope):**
- No route-level middleware guard on `/dashboard/create` for HR role (nav hides it, defensive enough per YAGNI)
- Dashboard stats/KPI cards may show cross-role data — separate task if needed
- `getAuthContext()` callers that destructure the return type need no changes since `isRecruiter` is additive
