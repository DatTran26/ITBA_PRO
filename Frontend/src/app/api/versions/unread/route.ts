import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { NextResponse } from "next/server";

export async function GET() {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;

    // All users (including Super_Admin) can see approved version notifications
    // based on their individual user_version_reads record.

    // Get IDs the user has already read
    const { data: readRows } = await ctx.supabase
        .from("user_version_reads")
        .select("version_id")
        .eq("user_id", ctx.userId);

    const readIds = (readRows ?? []).map((r: { version_id: string }) => r.version_id);

    // Fetch approved versions not yet read
    let query = ctx.supabase
        .from("versions")
        .select("id, version_number, title, description, approved_at")
        .eq("status", "approved")
        .order("approved_at", { ascending: false })
        .limit(50);

    if (readIds.length > 0) {
        // format it manually to avoid Supabase JS SDK PostgREST array mismatch for .not()
        const formattedArray = `(${readIds.join(",")})`;
        query = query.not("id", "in", formattedArray);
    }

    const { data: versions, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ versions: versions ?? [] });
}

export async function POST(request: Request) {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;

    const body = await request.json();
    const { version_ids } = body;

    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (
        !Array.isArray(version_ids) ||
        version_ids.length === 0 ||
        !version_ids.every((id: unknown) => typeof id === "string" && UUID_RE.test(id))
    ) {
        return NextResponse.json({ error: "version_ids must be a non-empty array of valid UUIDs" }, { status: 400 });
    }

    const rows = version_ids.map((vid: string) => ({
        user_id: ctx.userId,
        version_id: vid,
    }));

    const { error } = await ctx.supabase
        .from("user_version_reads")
        .upsert(rows, { onConflict: "user_id,version_id", ignoreDuplicates: true });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
}
