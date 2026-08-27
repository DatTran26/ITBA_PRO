import { createClient } from "@supabase/supabase-js";

export interface AiConfig {
    apiKey: string;
    model: string;
}

// In-memory cache with TTL to avoid hitting DB on every AI request
let cachedConfig: AiConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000; // 1 minute

/**
 * Get AI configuration (API key + model) from system_settings table.
 * Falls back to process.env if the DB values are empty.
 *
 * Uses a service-role Supabase client to bypass RLS.
 * Results are cached for 1 minute to avoid excessive DB calls.
 */
export async function getAiConfig(): Promise<AiConfig> {
    const now = Date.now();

    // Return cached value if still fresh
    if (cachedConfig && now - cacheTimestamp < CACHE_TTL_MS) {
        return cachedConfig;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    // If Supabase URL is not set at all, this is a non-Supabase deployment → env fallback
    if (!supabaseUrl) {
        return envFallback();
    }

    const clientKey = serviceRoleKey || anonKey;

    if (!clientKey) {
        console.warn("[getAiConfig] Missing Supabase keys. Falling back to basic environment variables.");
        return envFallback();
    }

    try {
        const supabase = createClient(supabaseUrl, clientKey, {
            auth: { persistSession: false },
        });

        const { data: settings } = await supabase
            .from("system_settings")
            .select("key, value")
            .in("key", ["openai_api_key", "ai_model"]);

        const map = new Map(
            (settings ?? []).map((s: { key: string; value: unknown }) => [s.key, s.value])
        );

        const dbApiKey = typeof map.get("openai_api_key") === "string"
            ? (map.get("openai_api_key") as string)
            : "";
        const dbModel = typeof map.get("ai_model") === "string"
            ? (map.get("ai_model") as string)
            : "";

        const config: AiConfig = {
            apiKey: dbApiKey || process.env.OPENAI_API_KEY || "",
            model: dbModel || process.env.OPENAI_MODEL || "gpt-4o",
        };

        // Update cache
        cachedConfig = config;
        cacheTimestamp = now;

        return config;
    } catch (err) {
        console.error("[getAiConfig] DB read failed, using env fallback:", err);
        return envFallback();
    }
}

/** Call this after saving settings so the new key takes effect on the next request. */
export function clearAiConfigCache() {
    cachedConfig = null;
    cacheTimestamp = 0;
}

function envFallback(): AiConfig {
    return {
        apiKey: process.env.OPENAI_API_KEY || "",
        model: process.env.OPENAI_MODEL || "gpt-4o",
    };
}
