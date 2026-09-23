"use client";

import { FolderKanban, Pencil, ShieldAlert, UserMinus, Eye, CheckCircle2, PauseCircle, type LucideIcon } from "lucide-react";
import EntityEmptyState from "@/components/management/entity-empty-state";
import { toneFor } from "@/lib/ui/tones";
import type { GroupListItem, GroupStatus } from "@/app/dashboard/management-types";

/** Thứ tự nghiêm trọng: nặng nhất trước. Màu trạng thái luôn đi kèm icon + nhãn. */
export const SEVERITY: { status: GroupStatus; label: string; reason: string; color: string; icon: LucideIcon }[] = [
  { status: "skill_risk", label: "Rủi ro kỹ năng", reason: "Thiếu kỹ năng then chốt cho vị trí của nhóm", color: "var(--danger)", icon: ShieldAlert },
  { status: "understaffed", label: "Thiếu người", reason: "Số người chưa đủ so với vị trí cần", color: "var(--warning)", icon: UserMinus },
  { status: "needs_attention", label: "Cần theo dõi", reason: "Có dấu hiệu cần kiểm tra lại", color: "var(--warning)", icon: Eye },
  { status: "healthy", label: "Ổn định", reason: "Đủ người và kỹ năng", color: "var(--success)", icon: CheckCircle2 },
  { status: "inactive", label: "Ngừng hoạt động", reason: "Nhóm không còn hoạt động", color: "var(--muted-foreground)", icon: PauseCircle },
];
const RANK = Object.fromEntries(SEVERITY.map((s, i) => [s.status, i])) as Record<GroupStatus, number>;
const AT_RISK: GroupStatus[] = ["skill_risk", "understaffed", "needs_attention"];

const TYPE_LABEL: Record<GroupListItem["type"], string> = {
  department: "Phòng ban", batch: "Đợt tuyển", campaign: "Chiến dịch", other: "Khác",
};

export function memberCount(g: GroupListItem) {
  const m = g.group_members;
  return Array.isArray(m) ? (m[0]?.count ?? 0) : (m?.count ?? 0);
}

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] ?? "") + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

function AvatarStack({ names, total, max = 5 }: { names: string[]; total: number; max?: number }) {
  const shown = names.slice(0, max);
  return (
    <div className="flex items-center">
      <div className="flex -space-x-2">
        {shown.map((n, i) => {
          const t = toneFor(n);
          return (
            <span key={i} title={n}
                  className="w-8 h-8 rounded-full ring-2 ring-card grid place-items-center text-[10px] font-bold"
                  style={{ color: t.ink, backgroundColor: t.bg }}>
              {initials(n)}
            </span>
          );
        })}
        {total > shown.length && (
          <span className="w-8 h-8 rounded-full ring-2 ring-card grid place-items-center text-[10px] font-bold bg-muted text-muted-foreground">
            +{total - shown.length}
          </span>
        )}
      </div>
      <span className="ml-3 text-xs font-semibold text-muted-foreground tabular-nums">{total} thành viên</span>
    </div>
  );
}

function EditButton({ onClick }: { onClick: () => void }) {
  return (
    <button type="button" aria-label="Sửa nhóm"
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            className="p-2 rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground transition cursor-pointer">
      <Pencil className="w-4 h-4" />
    </button>
  );
}

interface Props {
  groups: GroupListItem[];
  onOpen: (g: GroupListItem) => void;
  onEdit: (g: GroupListItem) => void;
}

/** Bảng phân loại nhóm: nhóm có vấn đề thành thẻ lớn có lý do, nhóm ổn thành hàng gọn. */
export default function GroupsBoard({ groups, onOpen, onEdit }: Props) {
  if (!groups.length) {
    return <EntityEmptyState icon={FolderKanban} title="Không có nhóm nào" description="Thử bỏ bớt bộ lọc" />;
  }

  const sorted = [...groups].sort((a, b) => RANK[a.status] - RANK[b.status] || memberCount(b) - memberCount(a));
  const risky = sorted.filter((g) => AT_RISK.includes(g.status));
  const calm = sorted.filter((g) => !AT_RISK.includes(g.status));

  return (
    <div className="space-y-8">
      {risky.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Cần xử lý <span className="tabular-nums text-foreground">{risky.length}</span>
          </h2>
          <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
            {risky.map((g) => {
              const sev = SEVERITY[RANK[g.status]];
              const Icon = sev.icon;
              return (
                <article key={g.id} onClick={() => onOpen(g)}
                         className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 cursor-pointer transition-shadow shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)] hover:shadow-[0_8px_24px_color-mix(in_srgb,var(--primary)_14%,transparent)]">
                  <span className="absolute inset-y-0 left-0 w-1.5" style={{ backgroundColor: sev.color }} />
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-11 h-11 shrink-0 rounded-xl grid place-items-center"
                            style={{ color: sev.color, backgroundColor: `color-mix(in srgb, ${sev.color} 14%, transparent)` }}>
                        <Icon className="w-5 h-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold" style={{ color: sev.color }}>{sev.label}</p>
                        <h3 className="text-lg font-extrabold text-foreground truncate">{g.name}</h3>
                      </div>
                    </div>
                    <EditButton onClick={() => onEdit(g)} />
                  </div>
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-2 min-h-10">
                    {g.description || sev.reason}
                  </p>
                  <div className="mt-5 flex items-center justify-between gap-3">
                    <AvatarStack names={g.member_names ?? []} total={memberCount(g)} />
                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-bold text-muted-foreground">
                      {TYPE_LABEL[g.type]}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {calm.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted-foreground">
            Ổn định <span className="tabular-nums text-foreground">{calm.length}</span>
          </h2>
          <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
            {calm.map((g) => {
              const sev = SEVERITY[RANK[g.status]];
              const Icon = sev.icon;
              return (
                <div key={g.id} onClick={() => onOpen(g)}
                     className="group flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-muted/50 transition-colors">
                  <Icon className="w-4 h-4 shrink-0" style={{ color: sev.color }} aria-label={sev.label} />
                  <span className="w-64 shrink-0 font-bold text-foreground truncate">{g.name}</span>
                  <span className="w-28 shrink-0 text-xs font-semibold text-muted-foreground">{TYPE_LABEL[g.type]}</span>
                  <span className="flex-1 min-w-0 text-sm text-muted-foreground truncate">{g.description}</span>
                  <AvatarStack names={g.member_names ?? []} total={memberCount(g)} max={4} />
                  <EditButton onClick={() => onEdit(g)} />
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}

/** Dải trạng thái: đếm + lọc. Bấm lại mục đang chọn để bỏ lọc. */
export function SeverityStrip({ groups, value, onChange }: {
  groups: GroupListItem[];
  value: GroupStatus | "";
  onChange: (s: GroupStatus | "") => void;
}) {
  const total = groups.length || 1;
  return (
    <div className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)]">
      <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5 bg-muted">
        {SEVERITY.map((s) => {
          const n = groups.filter((g) => g.status === s.status).length;
          return n ? <span key={s.status} style={{ width: `${(n / total) * 100}%`, backgroundColor: s.color }} /> : null;
        })}
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {SEVERITY.map((s) => {
          const n = groups.filter((g) => g.status === s.status).length;
          const on = value === s.status;
          const Icon = s.icon;
          return (
            <button key={s.status} type="button" aria-pressed={on}
                    onClick={() => onChange(on ? "" : s.status)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer ${on ? "bg-accent ring-1 ring-primary/30" : "hover:bg-muted"} ${n === 0 ? "opacity-50" : ""}`}>
              <Icon className="w-4 h-4 shrink-0" style={{ color: s.color }} />
              <span className="min-w-0">
                <span className="block text-2xl font-black leading-none tabular-nums text-foreground">{n}</span>
                <span className="block mt-1 text-xs font-semibold text-muted-foreground truncate">{s.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

