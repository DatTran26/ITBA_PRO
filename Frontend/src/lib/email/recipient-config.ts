export type RecipientMode = "single" | "multi";
export type RecipientSource = "persons" | "users";

export interface RecipientConfig {
    mode: RecipientMode;
    source: RecipientSource;
    sessionPickerEnabled: boolean;
}

const CONFIGS: Record<string, RecipientConfig> = {
    schedule_interview: { mode: "multi",  source: "persons", sessionPickerEnabled: true },
    interview_reminder: { mode: "multi",  source: "users",   sessionPickerEnabled: true },
    offer:              { mode: "single", source: "persons", sessionPickerEnabled: false },
    onboard_confirm:    { mode: "single", source: "persons", sessionPickerEnabled: false },
};

export function templateRecipientConfig(type: string): RecipientConfig {
    return CONFIGS[type] ?? { mode: "single", source: "persons", sessionPickerEnabled: false };
}
