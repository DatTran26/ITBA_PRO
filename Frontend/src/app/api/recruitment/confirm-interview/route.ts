import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ message: "Token không hợp lệ" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: schedule, error } = await admin
    .from("interview_schedules")
    .select("id, candidate_confirmation")
    .eq("confirmation_token", token)
    .single();

  if (error || !schedule) {
    return NextResponse.json({ message: "Không tìm thấy lịch phỏng vấn" }, { status: 404 });
  }

  if (schedule.candidate_confirmation === "confirmed") {
    return NextResponse.json({ message: "Bạn đã xác nhận lịch phỏng vấn này trước đó" });
  }

  const { error: updateErr } = await admin
    .from("interview_schedules")
    .update({
      candidate_confirmation: "confirmed",
      candidate_confirmed_at: new Date().toISOString(),
    })
    .eq("id", schedule.id);

  if (updateErr) {
    return NextResponse.json({ message: "Có lỗi khi xác nhận. Vui lòng thử lại." }, { status: 500 });
  }

  return NextResponse.json({ message: "Xác nhận lịch phỏng vấn thành công. Chúng tôi sẽ liên hệ với bạn sớm nhất." });
}
