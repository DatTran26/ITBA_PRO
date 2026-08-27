---
phase: 4
title: "API Routes for Topics"
status: pending
priority: P1
effort: "2h"
dependencies: [1]
---

# Phase 4: API Routes for Topics

## Overview

Create 4 new Next.js App Router API routes to support the 2-phase pipeline. These are the bridge between the UI and Supabase (direct DB calls + edge function invocations). All routes require `canManage` permission via `requireOrgRole`.

## Requirements

- Functional:
  - `POST /api/document-sources/[id]/extract-topics` — trigger Pass 1 (invoke `extract-document-topics` edge fn)
  - `GET /api/document-sources/[id]/topics` — list all topics for a document
  - `PUT /api/document-topics/[id]` — update topic (title, summary, key_points, is_approved)
  - `DELETE /api/document-topics/[id]` — delete a topic
  - `POST /api/document-sources/[id]/generate-questions` — trigger Pass 2 (invoke `generate-questions-from-doc` edge fn with approvedTopicIds)
- Non-functional:
  - All routes: auth via `requireOrgRole` (same pattern as existing question-bank routes)
  - `extract-topics` and `generate-questions`: check `document_sources.org_id` matches caller's org
  - Return consistent `{ error: string }` on failure with appropriate HTTP status codes

## Architecture

```
UI → POST /api/document-sources/[id]/extract-topics
  → supabase.functions.invoke("extract-document-topics", { documentId: id })
  → returns { success, jobId? }

UI → GET /api/document-sources/[id]/topics
  → supabase.from("document_topics").select("*").eq("document_id", id).order("order_index")
  → returns DocumentTopic[]

UI → PUT /api/document-topics/[id]
  → supabase.from("document_topics").update({ title, summary, key_points, is_approved }).eq("id", id)
  → returns updated row

UI → DELETE /api/document-topics/[id]
  → supabase.from("document_topics").delete().eq("id", id)
  → returns 204

UI → POST /api/document-sources/[id]/generate-questions { approvedTopicIds: string[] }
  → supabase.functions.invoke("generate-questions-from-doc", { documentId: id, approvedTopicIds })
  → returns { success, questionCount, jobId }
```

## Related Code Files

- Create: `src/app/api/document-sources/[id]/extract-topics/route.ts`
- Create: `src/app/api/document-sources/[id]/topics/route.ts`
- Create: `src/app/api/document-topics/[id]/route.ts`
- Create: `src/app/api/document-sources/[id]/generate-questions/route.ts`
- Read (pattern): `src/app/api/document-sources/route.ts`
- Read (pattern): `src/lib/api/auth-helpers.ts`

## Implementation Steps

1. **`src/app/api/document-sources/[id]/extract-topics/route.ts`**:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireOrgRole } from "@/lib/api/auth-helpers";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: documentId } = await params;
  const auth = await requireOrgRole(req, ["admin", "manager", "teacher"]);
  if (!auth.ok) return auth.response;

  const supabase = createServiceClient();

  // Verify document belongs to caller's org
  const { data: doc } = await supabase
    .from("document_sources")
    .select("id, org_id, status")
    .eq("id", documentId)
    .single();

  if (!doc || doc.org_id !== auth.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await supabase.functions.invoke("extract-document-topics", {
    body: { documentId },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

2. **`src/app/api/document-sources/[id]/topics/route.ts`**:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireOrgRole } from "@/lib/api/auth-helpers";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: documentId } = await params;
  const auth = await requireOrgRole(req, ["admin", "manager", "teacher"]);
  if (!auth.ok) return auth.response;

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("document_topics")
    .select("*")
    .eq("document_id", documentId)
    .order("order_index", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
```

3. **`src/app/api/document-topics/[id]/route.ts`**:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireOrgRole } from "@/lib/api/auth-helpers";
import { createServiceClient } from "@/lib/supabase/service";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireOrgRole(req, ["admin", "manager", "teacher"]);
  if (!auth.ok) return auth.response;

  const body = await req.json() as {
    title?: string;
    summary?: string;
    key_points?: string[];
    is_approved?: boolean;
  };

  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("document_topics")
    .update(body)
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const auth = await requireOrgRole(req, ["admin", "manager", "teacher"]);
  if (!auth.ok) return auth.response;

  const supabase = createServiceClient();
  const { error } = await supabase.from("document_topics").delete().eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
```

4. **`src/app/api/document-sources/[id]/generate-questions/route.ts`**:
```typescript
import { NextRequest, NextResponse } from "next/server";
import { requireOrgRole } from "@/lib/api/auth-helpers";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id: documentId } = await params;
  const auth = await requireOrgRole(req, ["admin", "manager", "teacher"]);
  if (!auth.ok) return auth.response;

  const { approvedTopicIds } = await req.json() as { approvedTopicIds: string[] };
  if (!approvedTopicIds?.length) {
    return NextResponse.json({ error: "approvedTopicIds required" }, { status: 400 });
  }

  const supabase = createServiceClient();

  const { data: doc } = await supabase
    .from("document_sources")
    .select("id, org_id")
    .eq("id", documentId)
    .single();

  if (!doc || doc.org_id !== auth.orgId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data, error } = await supabase.functions.invoke("generate-questions-from-doc", {
    body: { documentId, approvedTopicIds },
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
```

5. **Verify `createServiceClient` helper exists** — check `src/lib/supabase/service.ts`. If it uses a different export name, adjust imports accordingly.

6. **Verify `requireOrgRole` return shape** — check `src/lib/api/auth-helpers.ts` for `auth.orgId` field name; adjust if different.

## Success Criteria

- [ ] `POST /extract-topics` invokes edge fn and returns success
- [ ] `GET /topics` returns ordered `DocumentTopic[]` for a document
- [ ] `PUT /document-topics/[id]` updates and returns updated row
- [ ] `DELETE /document-topics/[id]` returns 204
- [ ] `POST /generate-questions` invokes edge fn with `approvedTopicIds` and returns `{ questionCount }`
- [ ] All routes return `401` for unauthenticated requests
- [ ] All routes return `404` for documents outside caller's org

## Risk Assessment

- `requireOrgRole` + `auth.orgId` — verify exact field names in auth-helpers before writing code
- `createServiceClient` — verify this helper exists; existing routes may use a different pattern (e.g., `createClient` from `@/lib/supabase/server`)
- `supabase.functions.invoke` timeout — edge functions can take 60-90s. Next.js default is 60s; may need `export const maxDuration = 120` on routes that invoke edge fns
