import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { NextResponse } from "next/server";

export async function GET() {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;
    if (!ctx.supabase) return NextResponse.json({ versions: [] });

    const { data: readRows } = await ctx.supabase
        .from("user_version_reads")
        .select("version_id")
        .eq("user_id", ctx.userId);

    const readIds = (readRows ?? []).map((r: { version_id: string }) => r.version_id);

    let query = ctx.supabase
        .from("versions")
        .select("id, version_number, title, description, published_at, created_at")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(50);

    if (readIds.length > 0) {
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
    if (!ctx.supabase) return NextResponse.json({ success: true });

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
