import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { completeChat, transcribeAudio } from "@/lib/ai-complete";
import { logAiUsage } from "@/lib/ai-usage-logger";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  if (!ctx.isHr && !ctx.isInterviewer && !ctx.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id: sessionId } = await params;
  const admin = createAdminClient();

  // Interviewers can only analyze sessions they are assigned to
  if (ctx.isInterviewer && !ctx.isAdmin && !ctx.isHr) {
    const { count } = await admin
      .from("interview_session_interviewers")
      .select("id", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .eq("interviewer_id", ctx.userId)
      .eq("status", "accepted");

    if (!count) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    // 1. Fetch the session and its recording_url + associated JD
    const { data: session, error: sessionError } = await admin
      .from("interview_sessions")
      .select(`
        id, recording_url, round,
        job_descriptions(id, title, seniority, required_skills, full_text)
      `)
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (!session.recording_url) {
      return NextResponse.json({ error: "No recording found for this session. Please record or upload audio first." }, { status: 400 });
    }

    // 2. Download the audio file from storage
    const { data: audioBlob, error: downloadError } = await admin.storage
      .from("interview-recordings")
      .download(session.recording_url);

    if (downloadError || !audioBlob) {
      return NextResponse.json({ error: "Failed to download recording file from storage", detail: downloadError?.message }, { status: 500 });
    }

    const arrayBuffer = await audioBlob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const fileExtension = session.recording_url.split(".").pop() || "webm";
    const filename = `recording.${fileExtension}`;
    const contentType = audioBlob.type || "audio/webm";

    const transcription = await transcribeAudio({
      bytes: buffer,
      filename,
      mimeType: contentType,
    });
    const transcript = transcription.text;
    if (!transcript) {
      return NextResponse.json({ error: "Failed to transcribe audio or audio is silent." }, { status: 500 });
    }

    logAiUsage({
      userId: ctx.userId,
      feature: "interview_transcription",
      model: transcription.model,
      tokensIn: 0,
      tokensOut: 0,
      metadata: { sessionId, recordingUrl: session.recording_url, audioSize: audioBlob.size, provider: transcription.provider },
    });

    const jdInfo = session.job_descriptions as any;
    const jdTitle = jdInfo?.title || "Không rõ vị trí";
    const jdSeniority = jdInfo?.seniority || "Không rõ level";
    const jdSkills = jdInfo?.required_skills ? (Array.isArray(jdInfo.required_skills) ? jdInfo.required_skills.join(", ") : String(jdInfo.required_skills)) : "Không rõ";
    const jdFullText = jdInfo?.full_text || "Không có JD chi tiết";

    const summary = await completeChat({
      userId: ctx.userId,
      feature: "interview_summary",
      messages: [
        {
          role: "system",
          content: `Bạn là trợ lý AI chuyên nghiệp hỗ trợ phỏng vấn tuyển dụng. Nhiệm vụ của bạn là đọc bản ghi cuộc phỏng vấn (transcript) và thông tin Job Description (JD) để tạo một báo cáo tóm tắt cuộc phỏng vấn chi tiết bằng TIẾNG VIỆT.

Thông tin JD:
- Vị trí: ${jdTitle}
- Level: ${jdSeniority}
- Yêu cầu kỹ năng: ${jdSkills}
- Mô tả chi tiết: ${jdFullText}

Hãy phân tích transcript và trả về kết quả bằng định dạng Markdown rõ ràng, chuyên nghiệp với các phần sau:
1. **Tóm tắt cuộc phỏng vấn**: Tóm tắt ngắn gọn diễn biến và các nội dung chính được trao đổi.
2. **Điểm mạnh nổi bật**: Liệt kê 3-5 điểm mạnh kỹ thuật hoặc kỹ năng mềm của ứng viên thể hiện rõ trong cuộc trao đổi.
3. **Điểm cần cải thiện/Hạn chế**: Liệt kê các điểm yếu, lỗ hổng kiến thức hoặc kỹ năng cần cải thiện của ứng viên.
4. **Đánh giá mức độ phù hợp (JD Fit Assessment)**: Phân tích xem ứng viên có đáp ứng được yêu cầu của vị trí phỏng vấn hay không, cho điểm phù hợp (trên thang điểm 10) kèm theo giải thích chi tiết.
5. **Gợi ý câu hỏi hoặc bước tiếp theo**: Gợi ý các bước tiếp theo hoặc các câu hỏi cần làm rõ thêm (nếu có).

Yêu cầu định dạng: Viết trực tiếp bằng tiếng Việt, ngôn ngữ trang trọng, mạch lạc, dễ đọc. Tránh sử dụng các ký tự đặc biệt không cần thiết.`,
        },
        {
          role: "user",
          content: `Bản ghi cuộc phỏng vấn (Transcript):\n\n${transcript}`,
        },
      ],
    });

    const aiSummary = summary.content || "";

    // 6. Save transcript and ai_summary back to the session
    const { data: updatedSession, error: updateError } = await admin
      .from("interview_sessions")
      .update({
        transcript,
        ai_summary: aiSummary
      })
      .eq("id", sessionId)
      .select()
      .single();

    if (updateError) {
      throw new Error(updateError.message);
    }

    return NextResponse.json({
      success: true,
      transcript,
      ai_summary: aiSummary,
      session: updatedSession
    });

  } catch (err) {
    console.error("[InterviewAnalyze] Error processing AI:", err);
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
