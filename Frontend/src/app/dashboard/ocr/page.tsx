import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OCRClient from "./ocr-client";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Vision OCR Studio | ITBA AI Dashboard",
    description: "Multimodal image text extraction with Gemini Vision VLM",
};

export default async function OCRPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return <OCRClient />;
}
