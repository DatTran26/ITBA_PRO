import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const maxDuration = 120;

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        // Allow dev/local testing even if session cookie is momentarily refreshing
        if (!user && process.env.NODE_ENV === "production") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await req.json();

        const fastApiRes = await fetch("http://localhost:8000/api/ocr/nd30/deep-synthesis", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(120_000),
        });

        if (!fastApiRes.ok) {
            const errText = await fastApiRes.text();
            return NextResponse.json(
                { error: `AI Deep Synthesis failed: ${errText}` },
                { status: fastApiRes.status }
            );
        }

        const data = await fastApiRes.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("AI Deep Synthesis error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error during deep synthesis" },
            { status: 500 }
        );
    }
}
