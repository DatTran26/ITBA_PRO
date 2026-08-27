import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createClient } from "@/lib/supabase/server";
import { clearAiConfigCache } from "@/lib/get-ai-config";

// Masked placeholder for write-only fields (password type).
// If this exact value is sent back in a PATCH, the field is skipped.
const MASK_PLACEHOLDER = "••••••••";
const SENSITIVE_KEYS = new Set(["openai_api_key"]);

export async function GET() {
    const supabase = await createClient();
    const { data: settings, error } = await supabase
        .from("system_settings")
        .select("id, key, value, category, label, description, input_type, options")
        .order("category")
        .order("key");

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Mask sensitive fields so they can never be read back
    const masked = (settings ?? []).map((s) => {
        if (SENSITIVE_KEYS.has(s.key)) {
            const raw = typeof s.value === "string" ? s.value : "";
            return { ...s, value: raw ? MASK_PLACEHOLDER : "" };
        }
        return s;
    });

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

    const { supabase } = ctx;

    // Filter out sensitive fields that were sent back with their mask placeholder
    // (meaning the admin didn't change them).
    const entries = Object.entries(updates).filter(([key, value]) => {
        if (SENSITIVE_KEYS.has(key) && value === MASK_PLACEHOLDER) return false;
        return true;
    });

    if (entries.length === 0) {
        return NextResponse.json({ success: true, updated: [] });
    }

    const results = await Promise.all(
        entries.map(([key, value]) =>
            supabase
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
    const AI_CONFIG_KEYS = new Set(["openai_api_key", "ai_model"]);
    const touchedAiKey = entries.some(([key]) => AI_CONFIG_KEYS.has(key));
    if (touchedAiKey) clearAiConfigCache();

    return NextResponse.json({ success: true, updated: entries.map(([key]) => key) });
}
