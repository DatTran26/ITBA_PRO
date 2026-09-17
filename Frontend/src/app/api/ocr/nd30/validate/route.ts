import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const payload = await req.json();

        const fastApiRes = await fetch("http://localhost:8000/api/ocr/nd30/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(15_000),
        });

        if (!fastApiRes.ok) {
            const errText = await fastApiRes.text();
            return NextResponse.json(
                { error: `Validation failed: ${errText}` },
                { status: fastApiRes.status }
            );
        }

        const data = await fastApiRes.json();
        return NextResponse.json(data);
    } catch (error: any) {
        console.error("ND30 Validate error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error during ND30 validation" },
            { status: 500 }
        );
    }
}
