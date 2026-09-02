import { createAdminClient } from "@/lib/supabase/admin";

interface LogParams {
  userId?: string;
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
  _doLog(params).catch((err) =>
    console.error("[ai-usage-logger] Failed to log:", err)
  );
}

async function _doLog(params: LogParams): Promise<void> {
  if (!params.tokensIn && !params.tokensOut) return;

  const admin = createAdminClient();

  // Fetch pricing from settings (best-effort)
  const { data: settings } = await admin
    .from("system_settings")
    .select("key, value")
    .in("key", ["token_price_input_per_1k", "token_price_output_per_1k"]);

  const priceMap = Object.fromEntries(
    (settings || []).map((s: { key: string; value: unknown }) => [s.key, Number(s.value)])
  );

  const inputPrice = priceMap["token_price_input_per_1k"] ?? DEFAULT_INPUT_PRICE_PER_1K;
  const outputPrice = priceMap["token_price_output_per_1k"] ?? DEFAULT_OUTPUT_PRICE_PER_1K;

  const costEstimate =
    (params.tokensIn / 1000) * inputPrice +
    (params.tokensOut / 1000) * outputPrice;

  // If no userId, try to find a default admin user for system-level logging
  let userId = params.userId;
  if (!userId) {
    const { data: adminUser } = await admin
      .from("users")
      .select("id")
      .eq("role", "admin")
      .limit(1)
      .single();
    userId = adminUser?.id;
  }
  if (!userId) return; // Cannot log without a user

  await admin.from("ai_usage").insert({
    user_id: userId,
    feature: params.feature,
    model: params.model,
    tokens_in: params.tokensIn,
    tokens_out: params.tokensOut,
    cost_estimate: costEstimate,
    metadata: params.metadata ?? null,
  });
}
