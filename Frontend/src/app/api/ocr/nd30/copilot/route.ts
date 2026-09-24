import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callVisionOcr } from "@/lib/vision-ocr";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user && process.env.NODE_ENV === "production") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await req.json();

        const fastApiRes = await callVisionOcr("/api/ocr/nd30/copilot", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(45_000),
        });

        if (!fastApiRes.ok) {
            const errText = await fastApiRes.text();
            return NextResponse.json(
                { error: `AI Copilot failed: ${errText}` },
                { status: fastApiRes.status }
            );
        }

        const data = await fastApiRes.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("AI Copilot error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error during AI copilot drafting" },
            { status: 500 }
        );
    }
}
