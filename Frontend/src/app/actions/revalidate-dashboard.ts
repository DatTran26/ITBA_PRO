"use server";

import { revalidatePath } from "next/cache";

/**
 * Forcibly invalidate the dashboard layout cache so server re-fetches
 * ui_layout from DB on next render. Used by realtime listener after
 * receiving a layout-change event — router.refresh() alone does not
 * reliably bust Next.js 16 static cache for layout files.
 */
export async function revalidateDashboard() {
    revalidatePath("/dashboard", "layout");
}
