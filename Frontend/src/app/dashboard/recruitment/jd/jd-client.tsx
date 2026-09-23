"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Plus, Pencil, Trash2, FileSearch, CircleSlash } from "lucide-react";
import JdFormDialog from "@/components/recruitment/jd-form-dialog";
import { SharedDashboardPageHeader } from "@/components/shares";
import { toneAt } from "@/lib/ui/tones";

type RawSkill = string | { skill: string; weight?: number };

interface JD {
  id: string;
  title: string;
  role_key: string | null;
  department: string | null;
  seniority: string | null;
  required_skills: { skill: string; weight?: number }[];
  auto_reject_threshold: number | null;
  is_active: boolean;
  created_at: string;
}

interface Props { userRole: string }

const CAN_WRITE = (role: string) => role === "interviewer" || role === "admin" || role === "super_admin";

/* Seed cũ lưu required_skills dạng chuỗi, form lưu dạng {skill}: chuẩn hoá khi đọc. */
function normalize(jd: Omit<JD, "required_skills"> & { required_skills: RawSkill[] | null }): JD {
  return {
    ...jd,
    required_skills: (jd.required_skills ?? []).map((s) => (typeof s === "string" ? { skill: s } : s)),
  };
}

function ThresholdBar({ value }: { value: number | null }) {
  if (value == null) return <span className="text-xs text-muted-foreground">Không đặt</span>;
  return (
    <div className="w-full">
      <div className="relative h-2 rounded-full bg-success/20 overflow-hidden">
        <span className="absolute inset-y-0 left-0 bg-danger/35" style={{ width: `${value}%` }} />
        <span className="absolute -top-0.5 -bottom-0.5 w-0.5 bg-foreground" style={{ left: `${value}%` }} />
      </div>
      <p className="mt-1 text-[11px] text-muted-foreground tabular-nums">
        Điểm AI &lt; <span className="font-bold text-foreground">{value}</span> → gợi ý loại
      </p>
    </div>
  );
}

export default function JdClient({ userRole }: Props) {
  const [jds, setJds] = useState<JD[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchJds = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/recruitment/job-descriptions");
    const data = await res.json();
    setJds((data.jobDescriptions ?? []).map(normalize));
    setLoading(false);
  }, []);

  useEffect(() => { fetchJds(); }, [fetchJds]);

  async function handleDelete(id: string) {
    if (!confirm("Xóa JD này? Nếu đang được dùng sẽ chuyển sang inactive.")) return;
    setDeletingId(id);
    await fetch(`/api/recruitment/job-descriptions/${id}`, { method: "DELETE" });
    setDeletingId(null);
    fetchJds();
  }

  const canWrite = CAN_WRITE(userRole);

  /* Cột ma trận: kỹ năng xuất hiện ở nhiều JD nhất đứng trước. */
  const skills = useMemo(() => {
    const freq = new Map<string, number>();
    for (const jd of jds) for (const s of jd.required_skills) freq.set(s.skill, (freq.get(s.skill) ?? 0) + 1);
    return [...freq].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [jds]);
  const activeCount = jds.filter((j) => j.is_active).length;
  const depts = [...new Set(jds.map((j) => j.department).filter(Boolean))] as string[];
  const deptTone = (d: string) => toneAt(depts.indexOf(d));
  const cols = `minmax(260px,1.4fr) repeat(${skills.length}, 40px) 200px ${canWrite ? "72px" : ""}`;

  return (
    <div className="pb-12">
      <SharedDashboardPageHeader
        title="Job Descriptions"
        icon={FileSearch}
        badge={{ label: `${activeCount}/${jds.length} đang dùng · ${skills.length} kỹ năng` }}
        description="Mỗi JD cần kỹ năng nào, JD nào dùng chung kỹ năng, và ngưỡng loại tự động"
        actions={canWrite ? (
          <JdFormDialog
            mode="create"
            onSuccess={fetchJds}
            trigger={
              <button className="flex items-center gap-2 h-11 px-5 rounded-xl text-sm font-bold bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20 transition-colors cursor-pointer">
                <Plus className="w-4 h-4" /> Tạo JD
              </button>
            }
          />
        ) : undefined}
      />

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-border/30 border-t-primary rounded-full animate-spin" />
        </div>
      ) : jds.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center text-muted-foreground text-sm">
          Chưa có Job Description nào.
        </div>
      ) : (
        <div className="rounded-2xl border border-border bg-card overflow-x-auto shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)]">
          <div className="min-w-max">
            {/* Tiêu đề cột: tên kỹ năng xoay chéo */}
            <div className="grid items-end gap-x-0 px-5 pt-5 pb-2 border-b border-border" style={{ gridTemplateColumns: cols }}>
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground pb-1">Vị trí</span>
              {skills.map(([name, n]) => (
                <div key={name} className="relative h-28" title={`${name} — ${n} JD`}>
                  <span className="absolute bottom-1 left-1/2 origin-bottom-left -rotate-[55deg] whitespace-nowrap text-xs font-semibold text-foreground">
                    {name} <span className="text-muted-foreground tabular-nums">{n}</span>
                  </span>
                </div>
              ))}
              <span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground pb-1 pl-4">Ngưỡng loại</span>
              {canWrite && <span />}
            </div>

            {jds.map((jd, i) => {
              const tone = toneAt(i);
              const has = new Set(jd.required_skills.map((s) => s.skill));
              return (
                <div key={jd.id}
                     className={`group grid items-center px-5 py-3.5 border-b border-border last:border-b-0 hover:bg-muted/40 transition-colors ${jd.is_active ? "" : "opacity-55"}`}
                     style={{ gridTemplateColumns: cols }}>
                  <div className="min-w-0 pr-4">
                    <p className="flex items-center gap-2 font-bold text-foreground truncate">
                      {jd.title}
                      {!jd.is_active && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">
                          <CircleSlash className="w-3 h-3" />Ngừng dùng
                        </span>
                      )}
                    </p>
                    <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground truncate">
                      {jd.department && (
                        <span className="rounded-full px-2 py-0.5 text-[10px] font-bold" style={{ color: deptTone(jd.department).ink, backgroundColor: deptTone(jd.department).bg }}>{jd.department}</span>
                      )}
                      {[jd.seniority && jd.seniority[0].toUpperCase() + jd.seniority.slice(1), `${jd.required_skills.length} kỹ năng`].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                  {skills.map(([name]) => (
                    <div key={name} className="grid place-items-center">
                      {has.has(name)
                        ? <span className="w-4 h-4 rounded-full" style={{ backgroundColor: tone.mark }} aria-label={`Cần ${name}`} />
                        : <span className="w-1.5 h-1.5 rounded-full bg-border" />}
                    </div>
                  ))}
                  <div className="pl-4"><ThresholdBar value={jd.auto_reject_threshold} /></div>
                  {canWrite && (
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <JdFormDialog
                        mode="edit"
                        jd={jd}
                        onSuccess={fetchJds}
                        trigger={
                          <button aria-label="Sửa JD" className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors cursor-pointer">
                            <Pencil className="w-4 h-4" />
                          </button>
                        }
                      />
                      <button
                        aria-label="Xóa JD"
                        onClick={() => handleDelete(jd.id)}
                        disabled={deletingId === jd.id}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
