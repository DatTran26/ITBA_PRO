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

        const fastApiRes = await fetch("http://localhost:8000/api/ocr/export-nd30", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        });

        if (!fastApiRes.ok) {
            const errText = await fastApiRes.text();
            return NextResponse.json(
                { error: `Backend export failed: ${errText}` },
                { status: fastApiRes.status }
            );
        }

        const buffer = await fastApiRes.arrayBuffer();
        const filename = encodeURIComponent(
            `van-ban-nd30-${payload.doc_type || "van-ban"}.docx`.toLowerCase().replace(/\s+/g, "-")
        );

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Content-Disposition": `attachment; filename="${filename}"`,
            },
        });
    } catch (error: any) {
        console.error("Export ND30 error:", error);
        return NextResponse.json(
            { error: error?.message || "Internal server error exporting ND30 docx" },
            { status: 500 }
        );
    }
}
