"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CalendarClock, ChevronRight, DoorOpen, FileCheck2, FileX2, MapPin, RotateCcw, Video } from "lucide-react";
import { SharedDashboardPageHeader, TonePill } from "@/components/shares";
import { EmptyState } from "@/components/ui/empty-state";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import { Skeleton } from "@/components/ui/skeleton";
import { Button, buttonVariants } from "@/components/ui/button";
import { toneByName, type ToneName } from "@/lib/ui/tones";

type RoomSession = {
  id: string;
  round: 1 | 2 | 3;
  scheduled_at: string;
  duration_minutes: number;
  location_type: string;
  location_detail: string | null;
  job_descriptions: { id: string; title: string } | null;
  tests: { id: string; title: string | null; job_role: string | null; status: string } | null;
};

const ROUND_TONE: Record<number, ToneName> = { 1: "blue", 2: "violet", 3: "pink" };

function dayLabel(d: Date) {
  const today = new Date();
  const diff = Math.round((new Date(d).setHours(0, 0, 0, 0) - new Date(today).setHours(0, 0, 0, 0)) / 86_400_000);
  if (diff === 0) return "Hôm nay";
  if (diff === 1) return "Ngày mai";
  if (diff === -1) return "Hôm qua";
  return d.toLocaleDateString("vi-VN", { weekday: "long", day: "2-digit", month: "2-digit" });
}

function untilLabel(d: Date, now: number) {
  const mins = Math.round((d.getTime() - now) / 60_000);
  if (mins <= 0) return "Đang diễn ra";
  if (mins < 60) return `Còn ${mins} phút`;
  if (mins < 60 * 24) return `Còn ${Math.floor(mins / 60)} giờ ${mins % 60} phút`;
  return `Còn ${Math.floor(mins / 1440)} ngày`;
}

export default function InterviewRoomClient() {
  const [sessions, setSessions] = useState<RoomSession[]>([]);
  const [state, setState] = useState<"loading" | "error" | "ready">("loading");
  const [attempt, setAttempt] = useState(0);
  const [now, setNow] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/recruitment/interview-room/sessions")
      .then((response) => (response.ok ? response.json() : Promise.reject(response)))
      .then((data) => {
        if (cancelled) return;
        setSessions(data.sessions ?? []);
        setNow(Date.now());
        setState("ready");
      })
      .catch(() => !cancelled && setState("error"));
    return () => { cancelled = true; };
  }, [attempt]);

  const sorted = [...sessions].sort((a, b) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at));
  const upcoming = sorted.filter((s) => +new Date(s.scheduled_at) + s.duration_minutes * 60_000 >= now);
  const past = sorted.filter((s) => !upcoming.includes(s)).reverse();
  const next = upcoming[0] ?? null;

  const groups = new Map<string, RoomSession[]>();
  for (const s of upcoming.slice(1)) {
    const key = dayLabel(new Date(s.scheduled_at));
    groups.set(key, [...(groups.get(key) ?? []), s]);
  }

  return (
    <div>
      <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Interview Room" }]} />
      <SharedDashboardPageHeader
        title="Phòng phỏng vấn"
        icon={DoorOpen}
        badge={state === "ready" ? { label: `${upcoming.length} buổi sắp tới`, tone: "teal" } : undefined}
        description="Chọn buổi đã được chấp nhận để mở hồ sơ ứng viên, phân tích CV, link bài test và ghi chú phỏng vấn"
      />

      {state === "loading" && (
        <div className="space-y-3">
          <Skeleton className="h-40 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
          <Skeleton className="h-20 rounded-2xl" />
        </div>
      )}

      {state === "error" && (
        <EmptyState
          className="rounded-2xl border border-border bg-card py-16"
          icon={<AlertTriangle className="text-destructive" />}
          title="Không tải được danh sách buổi phỏng vấn"
          description="Máy chủ trả lỗi — có thể dữ liệu phỏng vấn chưa được khởi tạo. Thử lại sau hoặc báo quản trị viên."
          action={<Button variant="outline" onClick={() => { setState("loading"); setAttempt((n) => n + 1); }}><RotateCcw />Thử lại</Button>}
        />
      )}

      {state === "ready" && sessions.length === 0 && (
        <EmptyState
          className="rounded-2xl border border-dashed border-border bg-card py-16"
          icon={<CalendarClock />}
          title="Chưa có buổi phỏng vấn nào được chấp nhận"
          description="Buổi sẽ xuất hiện ở đây khi ứng viên xác nhận lịch trong mục Tuyển dụng › Phiên phỏng vấn."
          action={<Link href="/dashboard/recruitment/sessions" className={buttonVariants({ variant: "outline" })}>Mở phiên phỏng vấn</Link>}
        />
      )}

      {state === "ready" && sessions.length > 0 && (
        <div className="space-y-6">
          {next ? <NextUp session={next} now={now} /> : (
            <p className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Không còn buổi nào sắp tới.
            </p>
          )}

          {[...groups.entries()].map(([label, items]) => (
            <section key={label}>
              <h2 className="mb-2 text-sm font-bold capitalize text-foreground">{label}</h2>
              <div className="space-y-2">{items.map((s) => <Row key={s.id} session={s} />)}</div>
            </section>
          ))}

          {past.length > 0 && (
            <section>
              <h2 className="mb-2 text-sm font-bold text-muted-foreground">Đã diễn ra</h2>
              <div className="space-y-2 opacity-75">{past.map((s) => <Row key={s.id} session={s} />)}</div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

function Meta({ session }: { session: RoomSession }) {
  return (
    <>
      <TonePill tone={toneByName(ROUND_TONE[session.round] ?? "blue")}>Vòng {session.round}</TonePill>
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><Video className="h-3.5 w-3.5" />{session.duration_minutes} phút</span>
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3.5 w-3.5" />{session.location_detail ?? session.location_type}</span>
      {session.tests
        ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-success"><FileCheck2 className="h-3.5 w-3.5" />Có bài test</span>
        : <span className="inline-flex items-center gap-1 text-xs font-semibold text-warning"><FileX2 className="h-3.5 w-3.5" />Chưa gắn test</span>}
    </>
  );
}

/** Thẻ lớn cho buổi gần nhất — thứ interviewer cần mở ngay. */
function NextUp({ session, now }: { session: RoomSession; now: number }) {
  const at = new Date(session.scheduled_at);
  const tone = toneByName(ROUND_TONE[session.round] ?? "blue");
  return (
    <Link
      href={`/dashboard/interview-room/${session.id}`}
      className="group flex items-stretch overflow-hidden rounded-2xl border border-border bg-card shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)] transition hover:border-primary/40"
    >
      <div className="flex w-40 shrink-0 flex-col items-center justify-center gap-1 p-5 text-center" style={{ backgroundColor: tone.bg, color: tone.ink }}>
        <span className="text-xs font-bold">{dayLabel(at)}</span>
        <span className="font-display text-4xl font-black tabular-nums">{at.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}</span>
        <span className="text-[11px] font-semibold">{untilLabel(at, now)}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-3 p-6">
        <p className="text-xs font-bold text-primary">Buổi tiếp theo</p>
        <p className="truncate text-xl font-bold text-foreground">{session.job_descriptions?.title ?? "Buổi phỏng vấn"}</p>
        <div className="flex flex-wrap items-center gap-3"><Meta session={session} /></div>
      </div>
      <div className="flex items-center pr-6">
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition group-hover:bg-primary/90">
          Vào phòng <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function Row({ session }: { session: RoomSession }) {
  const at = new Date(session.scheduled_at);
  return (
    <Link
      href={`/dashboard/interview-room/${session.id}`}
      className="group flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-3 transition hover:border-primary/40"
    >
      <span className="w-14 shrink-0 font-display text-lg font-bold tabular-nums text-foreground">
        {at.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{session.job_descriptions?.title ?? "Buổi phỏng vấn"}</span>
        <span className="mt-1 flex flex-wrap items-center gap-3"><Meta session={session} /></span>
      </span>
      <ChevronRight className="h-4 w-4 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}
