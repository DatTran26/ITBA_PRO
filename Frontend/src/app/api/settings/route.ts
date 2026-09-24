import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { clearAiConfigCache } from "@/lib/get-ai-config";
import { maskSensitiveSettings, SETTINGS_MASK_PLACEHOLDER, SENSITIVE_SETTING_KEYS } from "@/lib/settings/sensitive";

export async function GET() {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;

    const admin = createAdminClient();
    const { data: settings, error } = await admin
        .from("system_settings")
        .select("id, key, value, category, label, description, input_type, options")
        .order("category")
        .order("key");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const masked = maskSensitiveSettings(settings ?? []);

    const categories: Record<string, typeof settings> = {};
    for (const setting of masked) {
        const cat = setting.category ?? "general";
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(setting);
    }

    return NextResponse.json({ categories });
}

export async function PATCH(request: Request) {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;
    if (!ctx.isAdmin) {
        return NextResponse.json({ error: "Forbidden: admin only" }, { status: 403 });
    }

    const body = await request.json();
    const { updates } = body as { updates: Record<string, unknown> };

    if (!updates || typeof updates !== "object") {
        return NextResponse.json({ error: "Missing updates object" }, { status: 400 });
    }

    // Service role: user-session SELECT is denied for openai_api_key, so
    // UPDATE ... RETURNING via the user client fails even for admins.
    const admin = createAdminClient();

    const entries = Object.entries(updates).filter(([key, value]) => {
        if (SENSITIVE_SETTING_KEYS.has(key) && value === SETTINGS_MASK_PLACEHOLDER) return false;
        return true;
    });

    if (entries.length === 0) {
        return NextResponse.json({ success: true, updated: [] });
    }

    const results = await Promise.all(
        entries.map(([key, value]) =>
            admin
                .from("system_settings")
                .update({ value, updated_at: new Date().toISOString() })
                .eq("key", key)
                .select("key, value")
                .single()
        )
    );

    const failed = results.filter((r) => r.error);
    if (failed.length > 0) {
        return NextResponse.json(
            { error: "Some updates failed", details: failed.map((r) => r.error?.message) },
            { status: 500 }
        );
    }

    // Invalidate AI config cache if any AI-related keys were changed
    const AI_CONFIG_KEYS = new Set(["ai_provider", "openai_api_key", "gemini_api_key", "ai_model"]);
    const touchedAiKey = entries.some(([key]) => AI_CONFIG_KEYS.has(key));
    if (touchedAiKey) clearAiConfigCache();

    return NextResponse.json({ success: true, updated: entries.map(([key]) => key) });
}
