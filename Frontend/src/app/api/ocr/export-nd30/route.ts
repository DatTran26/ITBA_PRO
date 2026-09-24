import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { callVisionOcr } from "@/lib/vision-ocr";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        let payload: any;
        const contentType = req.headers.get("content-type") || "";

        if (
            contentType.includes("application/x-www-form-urlencoded") ||
            contentType.includes("multipart/form-data")
        ) {
            const formData = await req.formData();
            const rawPayload = formData.get("payload");
            if (typeof rawPayload === "string") {
                payload = JSON.parse(rawPayload);
            } else {
                payload = {};
            }
        } else {
            payload = await req.json();
        }

        const fastApiRes = await callVisionOcr("/api/ocr/export-nd30", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(45_000),
        });

        if (!fastApiRes.ok) {
            const errText = await fastApiRes.text();
            return NextResponse.json(
                { error: `Backend export failed: ${errText}` },
                { status: fastApiRes.status }
            );
        }

        const buffer = await fastApiRes.arrayBuffer();
        const rawType = String(payload.doc_type || "van-ban");
        const safeDocType = rawType
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/[đĐ]/g, "d")
            .toLowerCase()
            .replace(/[^a-z0-9_\-]/g, "_")
            .replace(/_+/g, "_");
        const filename = `ND30_${safeDocType || "van_ban"}.docx`;

        return new NextResponse(buffer, {
            status: 200,
            headers: {
                "Content-Type":
                    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                "Content-Disposition": `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
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
