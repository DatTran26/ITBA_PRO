# Phase 4: Token Usage Monitoring

## Context Links

- [Brainstorm Report](../reports/brainstorm-260326-2322-admin-role-and-version-management.md)
- [Phase 1 — DB Schema](./phase-01-database-schema.md) (`ai_usage` table)
- [Phase 2 — System Settings](./phase-02-system-settings.md) (token pricing config)
- [Generate Route](../../src/app/api/ai/generate/route.ts)

## Overview

- **Priority**: P2
- **Status**: pending
- **Effort**: 5h

Track AI token consumption per feature across all 8 AI API routes. Create a fire-and-forget `logAiUsage()` utility, admin-only usage API with aggregation, and dashboard components for visualization.

## Key Insights

- OpenAI response object includes `response.usage.prompt_tokens` and `response.usage.completion_tokens`
- All 8 AI routes use `new OpenAI()` + `openai.chat.completions.create()` — same pattern for extracting usage
- Token logging must NOT block the response — use fire-and-forget (no `await`, or use `after()` from Next.js)
- Cost estimation uses `token_price_input_per_1k` and `token_price_output_per_1k` from `system_settings`
- `ai_usage` table uses service role client for inserts (bypasses RLS, avoids requiring user session)
- 8 features to track: `generate`, `regenerate`, `analyze`, `analyze-result`, `analyze-jd`, `enhance-instruction`, `evaluate-level`, `generate-followup`

## Requirements

### Functional
- `logAiUsage()` utility: accepts user_id, feature, model, tokens_in, tokens_out, metadata
- Calculates `cost_estimate` using settings table pricing
- Integrates into all 8 AI API routes
- Admin API: `/api/ai-usage` GET with aggregation (by day, week, month; by feature; totals)
- Dashboard components for Phase 8 (token chart, feature breakdown)

### Non-functional
- Logging must not add latency to AI responses
- Aggregation queries must be efficient (indexed on `created_at`, `feature`)
- Handle cases where settings pricing is missing (fallback defaults)

## Architecture

### Data Flow

```
AI API Route → OpenAI call → response.usage
                                  │
                          logAiUsage() [fire-and-forget]
                                  │
                          ┌───────▼────────┐
                          │ system_settings │ ← fetch pricing
                          └───────┬────────┘
                                  │
                          ┌───────▼────────┐
                          │   ai_usage     │ ← insert row
                          └────────────────┘
                                  │
                          ┌───────▼────────┐
                          │ /api/ai-usage  │ ← admin reads
                          └────────────────┘
```

### Interfaces

```typescript
interface AiUsageLog {
  user_id: string;
  feature: string;
  model: string;
  tokens_in: number;
  tokens_out: number;
  cost_estimate: number;
  metadata?: Record<string, unknown>;
}

interface AiUsageStats {
  totalTokensIn: number;
  totalTokensOut: number;
  totalCost: number;
  byFeature: { feature: string; tokens_in: number; tokens_out: number; cost: number; count: number }[];
  byDay: { date: string; tokens_in: number; tokens_out: number; cost: number }[];
}
```

## Related Code Files

### Files to Create
- `D:\Projects\Git Private\ITBAAI\src\lib\ai-usage-logger.ts`
- `D:\Projects\Git Private\ITBAAI\src\app\api\ai-usage\route.ts`

### Files to Modify (add `logAiUsage()` call after OpenAI response)
- `D:\Projects\Git Private\ITBAAI\src\app\api\ai\generate\route.ts`
- `D:\Projects\Git Private\ITBAAI\src\app\api\ai\regenerate\route.ts`
- `D:\Projects\Git Private\ITBAAI\src\app\api\ai\analyze\route.ts`
- `D:\Projects\Git Private\ITBAAI\src\app\api\ai\analyze-result\route.ts`
- `D:\Projects\Git Private\ITBAAI\src\app\api\ai\analyze-jd\route.ts`
- `D:\Projects\Git Private\ITBAAI\src\app\api\ai\enhance-instruction\route.ts`
- `D:\Projects\Git Private\ITBAAI\src\app\api\ai\evaluate-level\route.ts`
- `D:\Projects\Git Private\ITBAAI\src\app\api\ai\generate-followup\route.ts`

## Implementation Steps

### Step 1: Create `ai-usage-logger.ts`

```typescript
import { createAdminClient } from "@/lib/supabase/admin";

interface LogParams {
  userId: string;
  feature: string;
  model: string;
  tokensIn: number;
  tokensOut: number;
  metadata?: Record<string, unknown>;
}

// Fallback pricing if settings fetch fails
const DEFAULT_INPUT_PRICE_PER_1K = 0.0025;
const DEFAULT_OUTPUT_PRICE_PER_1K = 0.01;

/**
 * Fire-and-forget AI usage logger.
 * Uses admin client to bypass RLS.
 * Does NOT throw — logs errors to console.
 */
export function logAiUsage(params: LogParams): void {
  // Intentionally not awaited
  _doLog(params).catch((err) =>
    console.error("[ai-usage-logger] Failed to log:", err)
  );
}

async function _doLog(params: LogParams): Promise<void> {
  const admin = createAdminClient();

  // Fetch pricing from settings (best-effort)
  const { data: settings } = await admin
    .from("system_settings")
    .select("key, value")
    .in("key", ["token_price_input_per_1k", "token_price_output_per_1k"]);

  const priceMap = Object.fromEntries(
    (settings || []).map((s) => [s.key, Number(s.value)])
  );

  const inputPrice = priceMap["token_price_input_per_1k"] ?? DEFAULT_INPUT_PRICE_PER_1K;
  const outputPrice = priceMap["token_price_output_per_1k"] ?? DEFAULT_OUTPUT_PRICE_PER_1K;

  const costEstimate =
    (params.tokensIn / 1000) * inputPrice +
    (params.tokensOut / 1000) * outputPrice;

  await admin.from("ai_usage").insert({
    user_id: params.userId,
    feature: params.feature,
    model: params.model,
    tokens_in: params.tokensIn,
    tokens_out: params.tokensOut,
    cost_estimate: costEstimate,
    metadata: params.metadata ?? null,
  });
}
```

### Step 2: Integrate into AI routes

For each of the 8 AI routes, add after the OpenAI response:

```typescript
// After: const response = await openai.chat.completions.create({...});
const usage = response.usage;
if (usage) {
  logAiUsage({
    userId: /* user id from auth context */,
    feature: "generate", // or the specific feature name
    model: response.model || "gpt-4o",
    tokensIn: usage.prompt_tokens,
    tokensOut: usage.completion_tokens,
  });
}
```

**Important**: Each AI route currently does NOT use `getAuthContext()` — some use `createClient()` directly. Need to extract userId for logging. Options:
- Add `getAuthContext()` at top of route (preferred — also adds auth enforcement)
- Or pass userId from the request body if available

For routes that don't currently authenticate (like `/api/ai/generate` which is called after auth in the frontend), add `getAuthContext()` for user identification.

### Step 3: Create AI usage API route

**`src/app/api/ai-usage/route.ts`**:

```typescript
// GET — admin-only aggregated usage stats
// Query params: ?period=day|week|month (default: month), ?days=30 (lookback)
```

- `requireAdmin()` check
- Query `ai_usage` table with date range filter
- Aggregate by feature: SUM tokens_in, tokens_out, cost_estimate, COUNT
- Aggregate by day: SUM per date
- Return `AiUsageStats` object

### Step 4: Create reusable chart components (for Phase 8)

These will be used in Phase 8 but can be created now:
- Token usage bar/line chart data preparation
- Feature breakdown pie chart data preparation

(Actual chart rendering deferred to Phase 8 dashboard implementation.)

## Todo List

- [ ] Create `src/lib/ai-usage-logger.ts` with `logAiUsage()` fire-and-forget
- [ ] Add `logAiUsage()` to `/api/ai/generate/route.ts`
- [ ] Add `logAiUsage()` to `/api/ai/regenerate/route.ts`
- [ ] Add `logAiUsage()` to `/api/ai/analyze/route.ts`
- [ ] Add `logAiUsage()` to `/api/ai/analyze-result/route.ts`
- [ ] Add `logAiUsage()` to `/api/ai/analyze-jd/route.ts`
- [ ] Add `logAiUsage()` to `/api/ai/enhance-instruction/route.ts`
- [ ] Add `logAiUsage()` to `/api/ai/evaluate-level/route.ts`
- [ ] Add `logAiUsage()` to `/api/ai/generate-followup/route.ts`
- [ ] Create `src/app/api/ai-usage/route.ts` (GET with aggregation)
- [ ] Test: trigger AI generation → verify row appears in `ai_usage`
- [ ] Test: cost estimate calculated correctly
- [ ] Test: admin can GET /api/ai-usage, recruiter gets 403

## Success Criteria

- Every OpenAI API call creates a row in `ai_usage` table
- Token counts match OpenAI response `usage` object
- Cost estimate calculated from `system_settings` pricing
- Logging does NOT add latency to AI responses (fire-and-forget)
- Admin API returns aggregated stats by feature and by day
- Non-admin gets 403 on `/api/ai-usage`

## Risk Assessment

| Risk | Impact | Mitigation |
|------|--------|------------|
| Logging adds latency to AI routes | High | Fire-and-forget pattern — never await `logAiUsage()` |
| Settings fetch in logger adds overhead | Low | Can cache pricing in-memory; settings change rarely |
| OpenAI response missing `usage` field | Low | Guard with `if (usage)` check before logging |
| Admin client creation per log call | Low | `createAdminClient()` is lightweight — creates new client each call |

## Security Considerations

- `logAiUsage()` uses admin/service-role Supabase client (bypasses RLS)
- Admin API route uses `requireAdmin()` — only admin sees all usage
- RLS on `ai_usage` also allows users to see their own usage (future self-serve)
- No PII in metadata — only technical data (model, feature, token counts)

## Next Steps

- Phase 8 (Admin Dashboard) renders token usage charts from `/api/ai-usage` data
- Token pricing editable via Phase 2 Settings page
