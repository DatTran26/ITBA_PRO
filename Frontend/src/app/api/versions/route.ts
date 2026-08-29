import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const VALID_CATEGORIES = ["platform", "feature", "security", "performance"] as const;
type Category = typeof VALID_CATEGORIES[number];

const STATUS_TRANSITIONS: Record<string, string[]> = {
    draft: ["pending"],
    pending: ["approved", "rejected"],
    approved: ["archived"],
    rejected: [],
    archived: [],
};

// POST: Create version (admin-only)
export async function POST(request: Request) {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;

    // System evolution requires Super Admin authorization for direct identity modification
    if (!ctx.isSuperAdmin) {
        return NextResponse.json({ error: "Access denied. Super Admin authorization required for version initialization." }, { status: 403 });
    }

    const body = await request.json();
    const { version_number, title, description, features, category, ui_changes, ux_changes, bug_fixes, is_critical } = body;

    if (!version_number || !title) {
        return NextResponse.json({ error: "version_number and title are required" }, { status: 400 });
    }

    if (category && !VALID_CATEGORIES.includes(category as Category)) {
        return NextResponse.json({ error: "Invalid category" }, { status: 400 });
    }

    const featuresArray = Array.isArray(features)
        ? features
        : typeof features === "string"
            ? features.split(",").map((f: string) => f.trim()).filter(Boolean)
            : [];

    const { data, error } = await ctx.supabase
        .from("versions")
        .insert({
            version_number,
            title,
            description: description || null,
            features: featuresArray,
            category: category || null,
            status: "draft",
            created_by: ctx.userId,
            ui_changes: ui_changes || null,
            ux_changes: ux_changes || null,
            bug_fixes: bug_fixes || null,
            is_critical: is_critical || false
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ version: data }, { status: 201 });
}

// PATCH: Update version (admin-only)
export async function PATCH(request: Request) {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;
    if (!ctx.isSuperAdmin) {
        return NextResponse.json({ error: "Access denied. Super Admin authorization required for identity modification." }, { status: 403 });
    }

    const body = await request.json();
    const { id, status: newStatus, ...rest } = body;

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    // If status transition requested, validate it
    if (newStatus) {
        const { data: current, error: fetchError } = await ctx.supabase
            .from("versions")
            .select("status")
            .eq("id", id)
            .single();

        if (fetchError || !current) {
            return NextResponse.json({ error: "Version not found" }, { status: 404 });
        }

        const allowed = STATUS_TRANSITIONS[current.status] ?? [];
        if (!ctx.isSuperAdmin && !allowed.includes(newStatus)) {
            return NextResponse.json(
                { error: `Cannot transition from '${current.status}' to '${newStatus}'` },
                { status: 422 }
            );
        }
    }

    const updatePayload: Record<string, unknown> = { ...rest };
    if (newStatus) {
        updatePayload.status = newStatus;
        if (newStatus === "approved") {
            updatePayload.approved_at = new Date().toISOString();
            updatePayload.scheduled_publish_at = null; // Clear any existing schedule on manual approval
        }
    }

    const { data, error } = await ctx.supabase
        .from("versions")
        .update(updatePayload)
        .eq("id", id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Synchronization with global CHANGELOG.md if transition to 'approved' state
    if (newStatus === "approved" && data) {
        try {
            const changelogPath = path.join(process.cwd(), "CHANGELOG.md");
            const dateStr = new Date().toLocaleDateString("en-GB"); // DD/MM/YYYY

            let appendContent = `\n## [${data.version_number}] - ${dateStr}\n`;
            appendContent += `### ${data.title}\n`;

            if (data.description) appendContent += `${data.description}\n\n`;

            if (data.ui_changes) {
                appendContent += `#### 🎨 UI (User Interface)\n- ${data.ui_changes}\n\n`;
            }
            if (data.ux_changes) {
                appendContent += `#### ✨ UX (User Experience)\n- ${data.ux_changes}\n\n`;
            }
            if (data.bug_fixes) {
                appendContent += `#### 🐛 Critical Bug Fixes\n- ${data.bug_fixes}\n\n`;
            }

            if (fs.existsSync(changelogPath)) {
                const currentContent = fs.readFileSync(changelogPath, "utf-8");
                // Insert after the first header if possible, or just prepend after the main title
                const newContent = currentContent.replace("# Changelog\n", `# Changelog\n${appendContent}`);
                fs.writeFileSync(changelogPath, newContent);
            } else {
                fs.writeFileSync(changelogPath, `# Changelog\n${appendContent}`);
            }
        } catch (fsErr) {
            console.error("[CHANGELOG Sync Failure]", fsErr);
            // Non-blocking error for DB update, but logged for administrative awareness
        }
    }

    return NextResponse.json({ version: data });
}

// DELETE: Delete version (admin-only, drafts only)
export async function DELETE(request: Request) {
    const ctx = await getAuthContext();
    if (isAuthError(ctx)) return ctx;
    if (!ctx.isSuperAdmin) return NextResponse.json({ error: "Access denied. Super Admin authorization required for version purging." }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ error: "id is required" }, { status: 400 });

    const { data: current, error: fetchError } = await ctx.supabase
        .from("versions")
        .select("status")
        .eq("id", id)
        .single();

    if (fetchError || !current) {
        return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    if (current.status !== "draft") {
        return NextResponse.json({ error: "Only draft versions can be deleted" }, { status: 422 });
    }

    const { error } = await ctx.supabase.from("versions").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}
