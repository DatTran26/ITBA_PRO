import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callVisionOcr } from "@/lib/vision-ocr";

export async function GET(req: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const fastApiRes = await callVisionOcr("/api/ocr/nd30/knowledge-graph", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            signal: AbortSignal.timeout(10_000),
        });

        if (!fastApiRes.ok) {
            const errText = await fastApiRes.text();
            return NextResponse.json(
                { error: `Backend Knowledge Graph fetch failed: ${errText}` },
                { status: fastApiRes.status }
            );
        }

        const data = await fastApiRes.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("Knowledge Graph error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error fetching Knowledge Graph" },
            { status: 500 }
        );
    }
}
