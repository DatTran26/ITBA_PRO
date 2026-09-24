import { createClient } from "@supabase/supabase-js";
import {
    type AiProvider,
    parseSettingString,
    resolveApiKey,
    resolveModel,
    resolveProvider,
} from "@/lib/ai-providers";

export interface AiConfig {
    provider: AiProvider;
    apiKey: string;
    model: string;
}

let cachedConfig: AiConfig | null = null;
let cacheTimestamp = 0;
const CACHE_TTL_MS = 60_000;

/**
 * AI config from system_settings. ENV is last-resort fallback only
 * when the matching DB key is empty or the DB cannot be read.
 */
export async function getAiConfig(): Promise<AiConfig> {
    const now = Date.now();
    if (cachedConfig && now - cacheTimestamp < CACHE_TTL_MS) {
        return cachedConfig;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl) {
        return envFallback();
    }

    const clientKey = serviceRoleKey || anonKey;
    if (!clientKey) {
        console.warn("[getAiConfig] Missing Supabase keys. Falling back to environment variables.");
        return envFallback();
    }

    try {
        const supabase = createClient(supabaseUrl, clientKey, {
            auth: { persistSession: false },
        });

        const { data: settings } = await supabase
            .from("system_settings")
            .select("key, value")
            .in("key", ["ai_provider", "openai_api_key", "gemini_api_key", "ai_model"]);

        const map = new Map(
            (settings ?? []).map((s: { key: string; value: unknown }) => [s.key, s.value])
        );

        const provider = resolveProvider(parseSettingString(map.get("ai_provider")));
        const model = resolveModel(provider, parseSettingString(map.get("ai_model")));
        const apiKey = resolveApiKey(
            provider,
            {
                openai: parseSettingString(map.get("openai_api_key")),
                gemini: parseSettingString(map.get("gemini_api_key")),
            },
            {
                openai: process.env.OPENAI_API_KEY,
                gemini: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY,
            },
        );

        const config: AiConfig = { provider, apiKey, model };
        cachedConfig = config;
        cacheTimestamp = now;
        return config;
    } catch (err) {
        console.error("[getAiConfig] DB read failed, using env fallback:", err);
        return envFallback();
    }
}

export function clearAiConfigCache() {
    cachedConfig = null;
    cacheTimestamp = 0;
}

function envFallback(): AiConfig {
    const provider = resolveProvider(process.env.AI_PROVIDER || "");
    return {
        provider,
        apiKey: resolveApiKey(
            provider,
            { openai: "", gemini: "" },
            {
                openai: process.env.OPENAI_API_KEY,
                gemini: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENAI_API_KEY,
            },
        ),
        model: resolveModel(provider, process.env.OPENAI_MODEL || process.env.GEMINI_MODEL || ""),
    };
}
