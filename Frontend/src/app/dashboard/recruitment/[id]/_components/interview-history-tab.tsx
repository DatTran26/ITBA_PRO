"use client";

import { useState, useEffect } from "react";
import { CalendarDays, Video, Building2, Phone, CheckCircle2, XCircle, Clock, Loader2 } from "lucide-react";

const LOCATION_ICON = { online: Video, office: Building2, phone: Phone } as const;
const LOCATION_LABEL = { online: "Online", office: "Văn phòng", phone: "Điện thoại" };

const CONFIRM_CFG = {
  confirmed: { label: "Đã xác nhận", cls: "text-success" },
  pending:   { label: "Chờ xác nhận", cls: "text-warning" },
  declined:  { label: "Từ chối",       cls: "text-danger" },
} as const;

const STATUS_CFG = {
  scheduled:  { label: "Đã lên lịch",  cls: "bg-primary/10 text-primary border-border/20" },
  completed:  { label: "Đã hoàn thành", cls: "bg-success/10 text-success border-border/20" },
  cancelled:  { label: "Đã huỷ",        cls: "bg-danger/10 text-danger border-border/20" },
} as const;

interface InterviewResult {
  id: string;
  result: "pass" | "fail";
  note: string | null;
  submitted_at: string;
}

interface InterviewRecord {
  id: string;
  session_id: string | null;
  scheduled_at: string;
  timezone: string;
  status: "scheduled" | "completed" | "cancelled";
  interviewer_status: string;
  candidate_confirmation: "pending" | "confirmed" | "declined";
  candidate_confirmed_at: string | null;
  interview_round: string;
  duration_minutes: number;
  location_type: "online" | "office" | "phone";
  location_detail: string | null;
  recruiter_note: string | null;
  test_link: string | null;
  interview_sessions: { id: string; round: number } | null;
  interview_results: InterviewResult[];
}

interface Props {
  applicationId: string;
}

function formatViDateTime(iso: string) {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()} ${hh}:${min}`;
}

export default function InterviewHistoryTab({ applicationId }: Props) {
  const [records, setRecords] = useState<InterviewRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/recruitment/applications/${applicationId}/interviews`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.interviews) setRecords(d.interviews); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [applicationId]);

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-10">
        <CalendarDays className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Chưa có lịch sử phỏng vấn</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {records.map((rec) => {
        const LocationIcon = LOCATION_ICON[rec.location_type];
        const statusCfg = STATUS_CFG[rec.status];
        const confirmCfg = CONFIRM_CFG[rec.candidate_confirmation];
        const result = rec.interview_results?.[0] ?? null;

        return (
          <div key={rec.id} className="bg-background border border-border/10 rounded-xl p-4 space-y-3">
            {/* Header row */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-lg text-xs font-bold bg-primary/10 text-primary border border-border/20">
                  {rec.interview_round}
                </span>
                <span className={`px-2 py-0.5 rounded-full text-xs border ${statusCfg.cls}`}>
                  {statusCfg.label}
                </span>
              </div>
              {result && (
                <div className={`flex items-center gap-1.5 text-xs font-bold ${result.result === "pass" ? "text-success" : "text-danger"}`}>
                  {result.result === "pass"
                    ? <CheckCircle2 className="w-4 h-4" />
                    : <XCircle className="w-4 h-4" />}
                  {result.result === "pass" ? "Đạt" : "Không đạt"}
                </div>
              )}
            </div>

            {/* Info row */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5" />
                {formatViDateTime(rec.scheduled_at)}
              </span>
              <span className="flex items-center gap-1.5">
                <LocationIcon className="w-3.5 h-3.5" />
                {LOCATION_LABEL[rec.location_type]}
                {rec.location_detail && <span className="text-muted-foreground">· {rec.location_detail}</span>}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                {rec.duration_minutes} phút
              </span>
            </div>

            {/* Confirmation row */}
            <div className="flex items-center gap-3 text-xs flex-wrap">
              <span className={`font-medium ${confirmCfg.cls}`}>
                Ứng viên: {confirmCfg.label}
              </span>
              {rec.candidate_confirmed_at && rec.candidate_confirmation === "confirmed" && (
                <span className="text-muted-foreground">
                  lúc {new Date(rec.candidate_confirmed_at).toLocaleString("vi-VN")}
                </span>
              )}
              {rec.test_link && (
                <a
                  href={rec.test_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  Link test →
                </a>
              )}
            </div>

            {/* Result note */}
            {result?.note && (
              <p className="text-xs text-muted-foreground bg-muted-foreground/5 rounded-lg px-3 py-2">
                {result.note}
              </p>
            )}

            {/* Recruiter note */}
            {rec.recruiter_note && (
              <p className="text-xs text-muted-foreground italic">
                Ghi chú: {rec.recruiter_note}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
