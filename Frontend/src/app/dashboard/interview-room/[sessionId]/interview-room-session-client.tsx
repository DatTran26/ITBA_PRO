"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft, Copy, ExternalLink, FileText, Loader2, Search,
  Mic, Square, Pause, Play, Trash2, Upload, Sparkles, Edit3, Save, X, Volume2, DoorOpen, CalendarX2
} from "lucide-react";
import { SharedDashboardPageHeader } from "@/components/shares";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type CandidateSchedule = {
  id: string;
  job_application_id: string;
  candidate_confirmation: string;
  status: string;
  job_applications: {
    id: string;
    pipeline_status: string;
    persons: { id: string; full_name: string; email: string } | null;
    candidate_screenings: Array<{
      final_score: number | null;
      ai_score: number | null;
      summary?: string | null;
      strengths_json?: string[] | null;
      weaknesses_json?: string[] | null;
    }>;
    results: Array<{
      id: string;
      test_id: string;
      score: number | null;
      total_questions: number | null;
      status: string | null;
      submitted_at: string | null;
      tests: { id: string; title: string | null } | null;
    }>;
  } | null;
};

type RoomSession = {
  id: string;
  round: 1 | 2 | 3;
  scheduled_at: string;
  duration_minutes: number;
  location_type: string;
  location_detail: string | null;
  recruiter_note: string | null;
  test_id: string | null;
  recording_url?: string | null;
  signed_recording_url?: string | null;
  transcript?: string | null;
  ai_summary?: string | null;
  job_descriptions: { id: string; title: string } | null;
  tests: { id: string; title: string | null; job_role: string | null; share_token: string; status: string; time_limit_minutes: number | null } | null;
};

export default function InterviewRoomSessionClient({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [session, setSession] = useState<RoomSession | null>(null);
  const [candidates, setCandidates] = useState<CandidateSchedule[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Tabs state
  const [activeTab, setActiveTab] = useState<"info" | "recording">("info");

  // Recording State
  const [recordingState, setRecordingState] = useState<"idle" | "recording" | "paused" | "stopped">("idle");
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Editing state
  const [editedTranscript, setEditedTranscript] = useState("");
  const [editedAiSummary, setEditedAiSummary] = useState("");
  const [isEditingTranscript, setIsEditingTranscript] = useState(false);
  const [isEditingAiSummary, setIsEditingAiSummary] = useState(false);
  const [isSavingTranscript, setIsSavingTranscript] = useState(false);
  const [isSavingAiSummary, setIsSavingAiSummary] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    fetch(`/api/recruitment/interview-room/sessions/${sessionId}`)
      .then((response) => response.ok ? response.json() : Promise.reject(response))
      .then((data) => {
        setSession(data.session);
        setCandidates(data.candidates ?? []);
        setSelectedId(data.candidates?.[0]?.id ?? null);
        setEditedTranscript(data.session?.transcript ?? "");
        setEditedAiSummary(data.session?.ai_summary ?? "");
      })
      .catch(() => toast.error("Không tải được session interview room"))
      .finally(() => setLoading(false));
  }, [sessionId]);

  // Recording Timer
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (recordingState === "recording") {
      interval = setInterval(() => {
        setDuration((prev) => prev + 1);
      }, 1000);
    } else if (recordingState === "paused" || recordingState === "stopped" || recordingState === "idle") {
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [recordingState]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Use standard settings for maximum browser compatibility
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
      };

      setMediaRecorder(recorder);
      setAudioChunks(chunks);
      recorder.start(1000); // chunk every second
      setRecordingState("recording");
      setDuration(0);
      toast.success("Bắt đầu ghi âm cuộc phỏng vấn");
    } catch (err) {
      console.error("Microphone access error:", err);
      toast.error("Không thể truy cập microphone. Vui lòng kiểm tra quyền truy cập microphone của trình duyệt.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "recording") {
      mediaRecorder.pause();
      setRecordingState("paused");
      toast.info("Đã tạm dừng ghi âm");
    }
  };

  const resumeRecording = () => {
    if (mediaRecorder && mediaRecorder.state === "paused") {
      mediaRecorder.resume();
      setRecordingState("recording");
      toast.info("Đang ghi âm tiếp tục");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && (mediaRecorder.state === "recording" || mediaRecorder.state === "paused")) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach((track) => track.stop());
      setRecordingState("stopped");
      toast.success("Đã dừng ghi âm cuộc phỏng vấn");
    }
  };

  const discardRecording = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingState("idle");
    setDuration(0);
    toast.info("Đã hủy bản ghi âm");
  };

  const uploadAudio = async () => {
    if (!audioBlob) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("file", audioBlob, "recording.webm");

    try {
      const res = await fetch(`/api/recruitment/interview-room/sessions/${sessionId}/recording`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Upload failed");
      }

      const data = await res.json();
      toast.success("Tải bản ghi âm lên hệ thống thành công!");

      setSession((prev) => prev ? {
        ...prev,
        recording_url: data.recording_url,
        signed_recording_url: data.signedUrl,
      } : null);

      if (audioUrl) URL.revokeObjectURL(audioUrl);
      setAudioBlob(null);
      setAudioUrl(null);
      setRecordingState("idle");
      setDuration(0);
    } catch (err: any) {
      toast.error(`Không thể upload file: ${err.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const analyzeSession = async () => {
    setIsAnalyzing(true);
    try {
      const res = await fetch(`/api/recruitment/interview-room/sessions/${sessionId}/analyze`, {
        method: "POST",
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Phân tích thất bại");
      }

      const data = await res.json();
      toast.success("Phân tích AI hoàn thành!");

      setSession((prev) => prev ? {
        ...prev,
        transcript: data.transcript,
        ai_summary: data.ai_summary,
      } : null);

      setEditedTranscript(data.transcript || "");
      setEditedAiSummary(data.ai_summary || "");
    } catch (err: any) {
      toast.error(`Lỗi phân tích: ${err.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const saveTranscript = async () => {
    setIsSavingTranscript(true);
    try {
      const res = await fetch(`/api/recruitment/interview-room/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript: editedTranscript }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Lỗi lưu");
      }

      const data = await res.json();
      toast.success("Cập nhật bản ghi transcript thành công!");
      setSession((prev) => prev ? { ...prev, transcript: data.session.transcript } : null);
      setIsEditingTranscript(false);
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
    } finally {
      setIsSavingTranscript(false);
    }
  };

  const saveAiSummary = async () => {
    setIsSavingAiSummary(true);
    try {
      const res = await fetch(`/api/recruitment/interview-room/sessions/${sessionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ai_summary: editedAiSummary }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Lỗi lưu");
      }

      const data = await res.json();
      toast.success("Cập nhật AI summary thành công!");
      setSession((prev) => prev ? { ...prev, ai_summary: data.session.ai_summary } : null);
      setIsEditingAiSummary(false);
    } catch (err: any) {
      toast.error(`Lỗi: ${err.message}`);
    } finally {
      setIsSavingAiSummary(false);
    }
  };

  const handleExportPdf = async () => {
    if (!person || !session) return;
    setIsExporting(true);
    try {
      const { generateResultPdf } = await import("@/lib/generate-result-pdf");

      const pdfResult = {
        candidate_name: person.full_name,
        candidate_email: person.email,
        score: sessionResult?.score ?? 0,
        total_questions: sessionResult?.total_questions ?? 0,
        time_taken: 0,
        submitted_at: sessionResult?.submitted_at ?? "",
        answers: [],
        ai_analysis: screening ? {
          overall_assessment: screening.summary ?? "",
          strengths: screening.strengths_json ?? [],
          weaknesses: screening.weaknesses_json ?? [],
          recommendation: "",
        } : null,
        note: null,
        status: (sessionResult?.status === "pass" || sessionResult?.status === "fail") ? sessionResult.status as "pass" | "fail" : null,
        interview: {
          round: session.round,
          scheduled_at: session.scheduled_at,
          duration_minutes: session.duration_minutes,
          location_type: session.location_type,
          location_detail: session.location_detail,
          transcript: session.transcript,
          ai_summary: session.ai_summary,
          recruiter_note: session.recruiter_note,
        }
      };

      const pdfTest = session.tests ? {
        title: session.tests.title ?? undefined,
        job_role: session.tests.job_role ?? session.job_descriptions?.title ?? "N/A",
        level: "",
        questions: [],
      } : null;

      await generateResultPdf(pdfResult, pdfTest);
      toast.success("Đã tải xuống báo cáo PDF thành công!");
    } catch (err: any) {
      toast.error(`Xuất PDF thất bại: ${err.message}`);
    } finally {
      setIsExporting(false);
    }
  };

  // Custom simple Markdown Parser
  const parseMarkdown = (text: string) => {
    if (!text) return <p className="text-sm italic text-muted-foreground">Chưa có thông tin phân tích.</p>;
    return text.split("\n").map((line, idx) => {
      if (line.startsWith("### ")) {
        return <h4 key={idx} className="mt-4 mb-2 text-md font-bold text-foreground">{line.replace("### ", "")}</h4>;
      }
      if (line.startsWith("## ")) {
        return <h3 key={idx} className="mt-5 mb-2 text-lg font-bold text-foreground">{line.replace("## ", "")}</h3>;
      }
      if (line.startsWith("# ")) {
        return <h2 key={idx} className="mt-6 mb-3 text-xl font-bold text-foreground">{line.replace("# ", "")}</h2>;
      }

      let content: React.ReactNode = line;
      if (line.includes("**")) {
        const parts = line.split("**");
        content = parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-foreground font-semibold">{part}</strong> : part);
      }

      if (line.trim().startsWith("- ") || line.trim().startsWith("* ")) {
        return (
          <li key={idx} className="ml-4 list-disc text-sm text-muted-foreground py-0.5">
            {typeof content === "string" ? content.trim().substring(2) : content}
          </li>
        );
      }
      if (line.trim() === "") {
        return <div key={idx} className="h-2" />;
      }
      return <p key={idx} className="text-sm text-muted-foreground leading-relaxed mb-1">{content}</p>;
    });
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const filtered = useMemo(() => {
    const normalized = query.toLowerCase().trim();
    if (!normalized) return candidates;
    return candidates.filter((item) => {
      const person = item.job_applications?.persons;
      return `${person?.full_name ?? ""} ${person?.email ?? ""}`.toLowerCase().includes(normalized);
    });
  }, [candidates, query]);

  const selected = candidates.find((item) => item.id === selectedId) ?? filtered[0] ?? null;
  const person = selected?.job_applications?.persons ?? null;
  const screening = selected?.job_applications?.candidate_screenings?.[0] ?? null;
  const cvScore = screening?.final_score ?? screening?.ai_score ?? null;
  const sessionResult = selected?.job_applications?.results?.find((result) => result.test_id === session?.test_id) ?? null;
  const testLink = session?.tests?.share_token ? `${window.location.origin}/test/${session.tests.share_token}` : null;

  if (loading) {
    return <div className="flex justify-center py-24"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!session) {
    return (
      <EmptyState
        className="rounded-2xl border border-border bg-card py-16"
        icon={<CalendarX2 />}
        title="Không mở được buổi phỏng vấn"
        description="Buổi này không tồn tại, chưa được chấp nhận, hoặc dữ liệu phỏng vấn chưa sẵn sàng."
        action={<Button variant="outline" onClick={() => router.push("/dashboard/interview-room")}><ArrowLeft />Về phòng chờ</Button>}
      />
    );
  }

  return (
    <div className="space-y-5">
      <SharedDashboardPageHeader
        className="mb-6"
        title={session.job_descriptions?.title ?? "Buổi phỏng vấn"}
        icon={DoorOpen}
        badge={{ label: `Vòng ${session.round}`, tone: session.round === 1 ? "blue" : session.round === 2 ? "violet" : "pink" }}
        description={`${new Date(session.scheduled_at).toLocaleString("vi-VN")} · ${session.duration_minutes} phút`}
        actions={<Button variant="outline" onClick={() => router.push("/dashboard/interview-room")}><ArrowLeft />Phòng chờ</Button>}
      />

      <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm tên/email candidate..." className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm text-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/15 focus:outline-none" />
          </div>
          <div className="space-y-2">
            {filtered.map((item) => {
              const itemPerson = item.job_applications?.persons;
              const active = selected?.id === item.id;
              return (
                <button key={item.id} onClick={() => setSelectedId(item.id)} className={`w-full rounded-lg border p-3 text-left transition-colors ${active ? "border-primary bg-primary/5" : "border-border bg-primary hover:border-border"}`}>
                  <p className="truncate text-sm font-semibold text-foreground">{itemPerson?.full_name ?? "Candidate"}</p>
                  <p className="truncate text-xs text-muted-foreground">{itemPerson?.email ?? "-"}</p>
                </button>
              );
            })}
            {filtered.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">Không có candidate phù hợp.</p>}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card p-5">
          {!selected || !person ? (
            <p className="text-sm text-muted-foreground">Chọn candidate để xem chi tiết.</p>
          ) : (
            <div className="space-y-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">{person.full_name}</h2>
                  <p className="text-sm text-muted-foreground">{person.email}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={handleExportPdf}
                    disabled={isExporting}
                    className="inline-flex items-center gap-2 rounded-lg border border-border bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary/20 disabled:opacity-50 transition-colors"
                  >
                    {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                    Xuất PDF Report
                  </button>
                  <button onClick={() => router.push(`/dashboard/recruitment/${selected.job_application_id}`)} className="inline-flex items-center gap-2 rounded-lg border border-border bg-primary/10 px-3 py-2 text-sm text-primary hover:bg-primary/20 transition-colors"><FileText className="h-4 w-4" />Mở hồ sơ CV</button>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex border-b border-border">
                <button
                  onClick={() => setActiveTab("info")}
                  className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
                    activeTab === "info"
                      ? "border-border text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Hồ sơ & Đánh giá
                </button>
                <button
                  onClick={() => setActiveTab("recording")}
                  className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition-all duration-200 ${
                    activeTab === "recording"
                      ? "border-border text-primary bg-primary/5"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Ghi âm & Phân tích AI
                </button>
              </div>

              {activeTab === "info" && (
                <div className="space-y-5">
                  <div className="grid gap-3 md:grid-cols-3">
                    <Metric label="CV Analysis Score" value={cvScore === null ? "-" : Math.round(cvScore)} />
                    <Metric label="Session Test Score" value={sessionResult?.score === null || sessionResult?.score === undefined ? "-" : Math.round(sessionResult.score)} />
                    <Metric label="Test Status" value={sessionResult?.status ?? "not_started"} />
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold text-foreground">CV Analysis</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{screening?.summary ?? "Chưa có summary CV analysis."}</p>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-4">
                    <h3 className="text-sm font-semibold text-foreground">Session Test</h3>
                    {session.tests ? (
                      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="text-sm text-foreground">{session.tests.title ?? session.tests.job_role ?? "Session Test"}</p>
                          <p className="text-xs text-muted-foreground">Candidate làm bài trong suốt buổi phỏng vấn.</p>
                        </div>
                        {testLink && <button onClick={() => navigator.clipboard.writeText(testLink).then(() => toast.success("Đã copy test link"))} className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white"><Copy className="h-4 w-4" />Copy test link</button>}
                      </div>
                    ) : <p className="mt-2 text-sm text-warning">Session chưa gắn test.</p>}
                  </div>

                  {sessionResult && (
                    <div className="rounded-xl border border-border bg-success/10 p-4 text-sm text-success">
                      Submitted: {sessionResult.submitted_at ? new Date(sessionResult.submitted_at).toLocaleString("vi-VN") : "-"}
                      <button onClick={() => router.push(`/dashboard/results/${sessionResult.id}`)} className="ml-3 inline-flex items-center gap-1 text-foreground underline"><ExternalLink className="h-3 w-3" />View result</button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "recording" && (
                <div className="space-y-6">
                  {/* Voice Recorder Control Panel */}
                  <div className="rounded-xl border border-border bg-card p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-foreground">Ghi âm cuộc phỏng vấn</h3>
                        <p className="text-xs text-muted-foreground mt-1">Lưu trữ giọng nói và phân tích tự động bằng OpenAI AI</p>
                      </div>

                      {/* State visual indicator */}
                      <div className="flex items-center gap-3">
                        {recordingState === "recording" && (
                          <span className="flex h-3 w-3 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive/60 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive"></span>
                          </span>
                        )}
                        <span className="text-lg font-mono text-foreground">
                          {recordingState !== "idle" && formatTimer(duration)}
                        </span>
                        <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
                          {recordingState}
                        </span>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="mt-5 flex flex-wrap gap-2">
                      {recordingState === "idle" && !session.recording_url && !audioUrl && (
                        <button
                          onClick={startRecording}
                          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          <Mic className="h-4.5 w-4.5" /> Bắt đầu ghi âm
                        </button>
                      )}

                      {recordingState === "recording" && (
                        <>
                          <button
                            onClick={pauseRecording}
                            className="inline-flex items-center gap-2 rounded-lg bg-warning px-4 py-2.5 text-sm font-semibold text-background hover:bg-warning transition-colors"
                          >
                            <Pause className="h-4.5 w-4.5" /> Tạm dừng
                          </button>
                          <button
                            onClick={stopRecording}
                            className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-white hover:bg-destructive/90 transition-colors"
                          >
                            <Square className="h-4.5 w-4.5" /> Dừng & Lưu
                          </button>
                        </>
                      )}

                      {recordingState === "paused" && (
                        <>
                          <button
                            onClick={resumeRecording}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
                          >
                            <Play className="h-4.5 w-4.5" /> Tiếp tục
                          </button>
                          <button
                            onClick={stopRecording}
                            className="inline-flex items-center gap-2 rounded-lg bg-destructive px-4 py-2.5 text-sm font-semibold text-white hover:bg-destructive/90 transition-colors"
                          >
                            <Square className="h-4.5 w-4.5" /> Dừng & Lưu
                          </button>
                        </>
                      )}

                      {/* Preview recorded but not yet uploaded */}
                      {audioUrl && (
                        <div className="w-full space-y-3 mt-2">
                          <p className="text-xs text-muted-foreground">Bản ghi âm hoàn tất. Bạn có thể nghe thử trước khi upload:</p>
                          <div className="flex items-center gap-3">
                            <audio src={audioUrl} controls className="w-full h-10 rounded" />
                            <button
                              onClick={uploadAudio}
                              disabled={isUploading}
                              className="inline-flex items-center gap-2 rounded-lg bg-success px-4 py-2 text-sm font-semibold text-background hover:bg-success disabled:opacity-50"
                            >
                              {isUploading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Upload className="h-4 w-4" />
                              )}
                              Upload
                            </button>
                            <button
                              onClick={discardRecording}
                              disabled={isUploading}
                              className="inline-flex items-center justify-center p-2 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/10 disabled:opacity-50"
                            >
                              <Trash2 className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Already uploaded recording playback and AI analyze trigger */}
                      {session.signed_recording_url && (
                        <div className="w-full space-y-4 mt-2">
                          <div className="flex items-center justify-between">
                            <span className="inline-flex items-center gap-1.5 text-xs text-success bg-success/10 px-2.5 py-1 rounded-full border border-border">
                              <Volume2 className="h-3.5 w-3.5" /> Đã lưu trên cloud
                            </span>

                            {/* Re-record capability */}
                            {recordingState === "idle" && (
                              <button
                                onClick={startRecording}
                                className="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 underline"
                              >
                                Ghi âm đè/lại bản mới
                              </button>
                            )}
                          </div>

                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <audio src={session.signed_recording_url} controls className="w-full h-10 rounded" />
                            <button
                              onClick={analyzeSession}
                              disabled={isAnalyzing}
                              className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50 whitespace-nowrap"
                            >
                              {isAnalyzing ? (
                                <>
                                  <Loader2 className="h-4 w-4 animate-spin" /> Phân tích...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-4 w-4" /> Phân tích AI
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Transcript and AI Summary side-by-side columns */}
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

                    {/* Transcript Panel */}
                    <div className="rounded-xl border border-border bg-card p-4 flex flex-col min-h-[400px]">
                      <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                          <FileText className="h-4 w-4 text-primary" /> Transcript cuộc phỏng vấn
                        </h3>
                        {!isEditingTranscript ? (
                          <button
                            onClick={() => {
                              setEditedTranscript(session.transcript || "");
                              setIsEditingTranscript(true);
                            }}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:text-foreground"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Sửa thủ công
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={saveTranscript}
                              disabled={isSavingTranscript}
                              className="inline-flex items-center gap-1 text-xs text-success hover:text-foreground"
                            >
                              {isSavingTranscript ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                              Lưu
                            </button>
                            <button
                              onClick={() => setIsEditingTranscript(false)}
                              disabled={isSavingTranscript}
                              className="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80"
                            >
                              <X className="h-3.5 w-3.5" /> Hủy
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col">
                        {isEditingTranscript ? (
                          <textarea
                            value={editedTranscript}
                            onChange={(e) => setEditedTranscript(e.target.value)}
                            className="w-full flex-1 min-h-[300px] rounded-lg border border-border bg-card p-3 text-sm text-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/15 focus:outline-none resize-none font-sans"
                            placeholder="Nhập nội dung transcript cuộc phỏng vấn..."
                          />
                        ) : (
                          <div className="max-h-[400px] overflow-y-auto pr-1 text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap font-sans">
                            {session.transcript || (
                              <p className="italic text-muted-foreground text-center mt-12">
                                Chưa có bản ghi transcript. Hãy ghi âm và thực hiện Phân tích AI.
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Summary Panel */}
                    <div className="rounded-xl border border-border bg-card p-4 flex flex-col min-h-[400px]">
                      <div className="flex items-center justify-between border-b border-border pb-3 mb-3">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                          <Sparkles className="h-4 w-4 text-warning" /> AI Summary & Đánh giá
                        </h3>
                        {!isEditingAiSummary ? (
                          <button
                            onClick={() => {
                              setEditedAiSummary(session.ai_summary || "");
                              setIsEditingAiSummary(true);
                            }}
                            className="inline-flex items-center gap-1 text-xs text-primary hover:text-foreground"
                          >
                            <Edit3 className="h-3.5 w-3.5" /> Sửa nội dung
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={saveAiSummary}
                              disabled={isSavingAiSummary}
                              className="inline-flex items-center gap-1 text-xs text-success hover:text-foreground"
                            >
                              {isSavingAiSummary ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                              Lưu
                            </button>
                            <button
                              onClick={() => setIsEditingAiSummary(false)}
                              disabled={isSavingAiSummary}
                              className="inline-flex items-center gap-1 text-xs text-destructive hover:text-destructive/80"
                            >
                              <X className="h-3.5 w-3.5" /> Hủy
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 flex flex-col">
                        {isEditingAiSummary ? (
                          <textarea
                            value={editedAiSummary}
                            onChange={(e) => setEditedAiSummary(e.target.value)}
                            className="w-full flex-1 min-h-[300px] rounded-lg border border-border bg-card p-3 text-sm text-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/15 focus:outline-none resize-none font-sans"
                            placeholder="Nhập nội dung đánh giá bằng định dạng Markdown..."
                          />
                        ) : (
                          <div className="max-h-[400px] overflow-y-auto pr-1">
                            {parseMarkdown(session.ai_summary || "")}
                          </div>
                        )}
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold text-foreground">{value}</p></div>;
}
