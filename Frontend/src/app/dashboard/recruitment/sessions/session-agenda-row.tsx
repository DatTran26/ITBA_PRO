"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Video, Building2, Phone, Bell, BellRing, Loader2, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { toneByName } from "@/lib/ui/tones";

/* Vòng là phân loại → dùng tông; xanh/vàng/đỏ chỉ cho xác nhận của ứng viên. */
export const ROUND = {
    1: { label: "Vòng 1", tone: toneByName("blue") },
    2: { label: "Vòng 2", tone: toneByName("orange") },
    3: { label: "Vòng cuối", tone: toneByName("violet") },
} as const;

const LOC = {
    online: { icon: Video, label: "Online" },
    office: { icon: Building2, label: "Văn phòng" },
    phone: { icon: Phone, label: "Điện thoại" },
} as const;

const WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export interface SessionRowData {
    id: string; round: 1 | 2 | 3; scheduled_at: string; duration_minutes: number;
    location_type: "online" | "office" | "phone"; location_detail: string | null;
    notification_sent_at: string | null; candidate_count: number;
    confirmed_count: number; pending_count: number; declined_count: number;
    job_descriptions: { title: string } | null;
}

export default function SessionAgendaRow({ session, onNotified }: { session: SessionRowData; onNotified: () => void }) {
    const router = useRouter();
    const [notifying, setNotifying] = useState(false);

    const round = ROUND[session.round];
    const loc = LOC[session.location_type];
    const start = new Date(session.scheduled_at);
    const end = new Date(start.getTime() + session.duration_minutes * 60_000);
    const past = start.getTime() <= Date.now();
    const n = session.candidate_count;
    const pct = (v: number) => (n ? (v / n) * 100 : 0);

    const handleNotify = async (e: React.MouseEvent) => {
        e.stopPropagation();
        setNotifying(true);
        try {
            const res = await fetch(`/api/recruitment/sessions/${session.id}/notify`, { method: "POST" });
            const json = await res.json();
            if (!res.ok) { toast.error(json.error ?? "Gửi thất bại"); return; }
            toast.success(`Đã gửi ${json.sent} email`);
            onNotified();
        } catch { toast.error("Lỗi kết nối"); }
        finally { setNotifying(false); }
    };

    return (
        <div
            onClick={() => router.push(`/dashboard/recruitment/sessions/${session.id}`)}
            className={`group grid grid-cols-[120px_6px_1fr_260px_150px_24px] items-center gap-5 px-5 py-4 cursor-pointer hover:bg-muted/40 transition-colors ${past ? "opacity-60" : ""}`}
        >
            <div className="tabular-nums">
                <p className="text-[11px] font-bold uppercase text-muted-foreground">
                    {WEEKDAY[start.getDay()]} {start.getDate()}/{start.getMonth() + 1}
                </p>
                <p className="text-2xl font-black leading-tight text-foreground">{hhmm(start)}</p>
                <p className="text-[11px] text-muted-foreground">đến {hhmm(end)}</p>
            </div>

            <span className="self-stretch rounded-full" style={{ backgroundColor: round.tone.mark }} />

            <div className="min-w-0">
                <div className="flex items-center gap-2">
                    <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: round.tone.ink, backgroundColor: round.tone.bg }}>
                        {round.label}
                    </span>
                    {past && <span className="text-[10px] font-semibold text-muted-foreground">Đã diễn ra</span>}
                </div>
                <p className="mt-1 font-bold text-foreground truncate">{session.job_descriptions?.title ?? "Chưa gắn JD"}</p>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-muted-foreground truncate">
                    <loc.icon className="w-3.5 h-3.5 shrink-0" />{loc.label}
                    {session.location_detail && <span className="truncate">· {session.location_detail}</span>}
                </p>
            </div>

            <div>
                {n > 0 ? (
                    <>
                        <div className="flex h-2 rounded-full overflow-hidden gap-0.5 bg-muted">
                            {session.confirmed_count > 0 && <span style={{ width: `${pct(session.confirmed_count)}%`, backgroundColor: "var(--success)" }} />}
                            {session.pending_count > 0 && <span style={{ width: `${pct(session.pending_count)}%`, backgroundColor: "var(--warning)" }} />}
                            {session.declined_count > 0 && <span style={{ width: `${pct(session.declined_count)}%`, backgroundColor: "var(--danger)" }} />}
                        </div>
                        <p className="mt-1.5 text-xs text-muted-foreground tabular-nums">
                            <span className="font-bold text-foreground">{session.confirmed_count}/{n}</span> xác nhận
                            {session.pending_count > 0 && <> · {session.pending_count} chờ</>}
                            {session.declined_count > 0 && <> · {session.declined_count} từ chối</>}
                        </p>
                    </>
                ) : <p className="text-xs text-muted-foreground">Chưa xếp ứng viên</p>}
            </div>

            <div className="justify-self-end">
                {session.notification_sent_at ? (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-success"><BellRing className="w-3.5 h-3.5" />Đã gửi lịch</span>
                ) : n > 0 ? (
                    <button onClick={handleNotify} disabled={notifying}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:border-primary hover:text-primary transition-colors disabled:opacity-50 cursor-pointer">
                        {notifying ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Bell className="w-3.5 h-3.5" />}Gửi lịch
                    </button>
                ) : null}
            </div>

            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
        </div>
    );
}
