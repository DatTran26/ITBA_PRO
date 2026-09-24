export type AiProvider = "openai" | "gemini";

export const OPENAI_MODELS = [
    "gpt-5",
    "gpt-5-mini",
    "gpt-4.1",
    "gpt-4o",
    "gpt-4o-mini",
    "gpt-4-turbo",
] as const;

export const GEMINI_MODELS = [
    "gemini-3.6-flash",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
] as const;

export const DEFAULT_MODEL: Record<AiProvider, string> = {
    openai: "gpt-4o",
    gemini: "gemini-2.0-flash",
};

export const AI_SETTING_ORDER = [
    "ai_provider",
    "openai_api_key",
    "gemini_api_key",
    "ai_model",
    "ai_temperature",
    "ai_max_tokens",
    "token_price_input_per_1k",
    "token_price_output_per_1k",
];

export function isAiProvider(value: string): value is AiProvider {
    return value === "openai" || value === "gemini";
}

export function parseSettingString(value: unknown): string {
    return typeof value === "string" ? value : "";
}

export function resolveProvider(raw: string): AiProvider {
    return raw === "gemini" ? "gemini" : "openai";
}

export function modelsFor(provider: AiProvider): readonly string[] {
    return provider === "gemini" ? GEMINI_MODELS : OPENAI_MODELS;
}

export function resolveModel(provider: AiProvider, model: string): string {
    const allowed = modelsFor(provider);
    return allowed.includes(model) ? model : DEFAULT_MODEL[provider];
}

export function resolveApiKey(
    provider: AiProvider,
    db: { openai: string; gemini: string },
    env: { openai?: string; gemini?: string } = {},
): string {
    if (provider === "gemini") return db.gemini || env.gemini || "";
    return db.openai || env.openai || "";
}
