import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";

export type UiLayout = "topnav" | "sidebar";

/** Cookie name — kept as a string literal; client writer (nav-shell) uses the same string. */
const LAYOUT_COOKIE = "ui_layout";
const DEFAULT_LAYOUT: UiLayout = "topnav";

/**
 * Server-side read of the global navigation layout.
 * Cookie (written by NavShell on client) is the primary source — fast and
 * survives transient DB failures. Falls back to DB on first load (no cookie).
 * Falls back to "topnav" if both are unavailable.
 */
export async function readUiLayout(): Promise<UiLayout> {
    const store = await cookies();
    const fromCookie = store.get(LAYOUT_COOKIE)?.value;
    if (fromCookie === "sidebar" || fromCookie === "topnav") return fromCookie;

    try {
        const supabase = await createClient();
        const { data } = await supabase
            .from("system_settings")
            .select("value")
            .eq("key", "ui_layout")
            .single();
        return data?.value === "sidebar" ? "sidebar" : DEFAULT_LAYOUT;
    } catch {
        return DEFAULT_LAYOUT;
    }
}
