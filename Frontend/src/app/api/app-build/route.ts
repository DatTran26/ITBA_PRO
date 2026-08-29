import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import pkg from "../../../../package.json";

// Returns the build timestamp, current internal version, and the latest approved version from DB.
// Client compares its own version against the latest approved version to show the update banner.
export async function GET() {
    const admin = createAdminClient();

    // Fetch latest approved version - use .limit(1) to avoid 500 if result is empty
    const { data: versions } = await admin
        .from("versions")
        .select("version_number")
        .eq("status", "approved")
        .order("created_at", { ascending: false })
        .limit(1);

    const latestApprovedVersion = versions?.[0]?.version_number || pkg.version;

    return NextResponse.json({
        buildTime: process.env.NEXT_PUBLIC_BUILD_TIME ?? "dev",
        version: pkg.version,
        latestApprovedVersion,
    });
}
