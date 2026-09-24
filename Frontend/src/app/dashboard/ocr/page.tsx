import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OCRClient from "./ocr-client";
import type { Metadata } from "next";
import type { UserProfile } from "./types";

export const metadata: Metadata = {
    title: "Vision OCR Studio | ITBA AI Dashboard",
    description: "Multimodal image text extraction with Gemini Vision VLM & Decree 30 Engine",
};

export default async function OCRPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Load HR profile for auto-filling legal templates
    const { data: dbUser } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

    const userProfile: UserProfile = {
        full_name:
            user.user_metadata?.full_name ||
            (user.email?.startsWith("admin") ? "NGUYỄN VĂN AN" : "NGUYỄN VĂN A"),
        organization: "CÔNG TY CỔ PHẦN CÔNG NGHỆ DOWN TOWN",
        department: "Phòng Hành chính - Nhân sự",
        title:
            dbUser?.role === "super_admin"
                ? "TỔNG GIÁM ĐỐC"
                : dbUser?.role === "admin"
                ? "GIÁM ĐỐC ĐIỀU HÀNH"
                : "TRƯỞNG PHÒNG NHÂN SỰ",
        location: "Hà Nội",
        phone: user.user_metadata?.phone || "0901 234 567",
    };

    return <OCRClient userProfile={userProfile} />;
}
