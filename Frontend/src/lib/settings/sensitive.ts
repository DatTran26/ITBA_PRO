// Masked placeholder for write-only fields (password type).
// If this exact value is sent back in a PATCH, the field is skipped.
export const SETTINGS_MASK_PLACEHOLDER = "••••••••";
export const SENSITIVE_SETTING_KEYS = new Set(["openai_api_key", "gemini_api_key"]);

export function maskSensitiveSettings<T extends { key: string; value: unknown }>(settings: T[]): T[] {
    return settings.map((setting) => {
        if (!SENSITIVE_SETTING_KEYS.has(setting.key)) return setting;
        const raw = typeof setting.value === "string" ? setting.value : "";
        return { ...setting, value: raw ? SETTINGS_MASK_PLACEHOLDER : "" };
    });
}
