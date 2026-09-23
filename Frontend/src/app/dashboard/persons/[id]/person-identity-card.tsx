"use client";

import Link from "next/link";
import { Pencil, Tag, Mail, Phone, Building2, Layers, CalendarDays, GraduationCap, ClipboardCheck, Target, FolderKanban, type LucideIcon } from "lucide-react";
import TagChips from "@/components/crm/tag-chips";
import { ToneIcon } from "@/components/shares";
import { PERSON_STATUSES } from "@/lib/crm/constants";
import { toneByName, toneFor, toneAt, type ToneName } from "@/lib/ui/tones";
import type { PersonDetail, TagItem } from "@/app/dashboard/management-types";

interface MembershipRow {
  id: string;
  groups: { id: string; name: string; type: string } | null;
}

interface Props {
  person: PersonDetail;
  tags: TagItem[];
  memberships: MembershipRow[];
  stats: { skills: number; avgLevel: string; tests: number; avgPct: number | null };
  onEdit: () => void;
  onAddTag: () => void;
}

function initials(name: string) {
  const w = name.trim().split(/\s+/);
  return ((w[0]?.[0] ?? "") + (w.length > 1 ? w[w.length - 1][0] : "")).toUpperCase();
}

/** Cột danh tính sticky: ai, đang ở đâu, liên hệ thế nào, số liệu nhanh, thuộc nhóm nào. */
export default function PersonIdentityCard({ person, tags, memberships, stats, onEdit, onAddTag }: Props) {
  const t = toneFor(person.full_name);
  const status = PERSON_STATUSES[person.status];
  const info: [LucideIcon, string, ToneName][] = ([
    person.email && [Mail, person.email, "blue"],
    person.phone && [Phone, person.phone, "teal"],
    person.department && [Building2, person.department, "orange"],
    person.current_level && [Layers, `Level ${person.current_level}`, "violet"],
    person.joined_date && [CalendarDays, `Vào ${new Date(person.joined_date).toLocaleDateString("vi-VN")}`, "pink"],
  ].filter(Boolean) as [LucideIcon, string, ToneName][]);
  const tiles: [LucideIcon, string, string, ToneName][] = [
    [GraduationCap, String(stats.skills), `Kỹ năng · TB ${stats.avgLevel}`, "violet"],
    [ClipboardCheck, String(stats.tests), "Bài đánh giá", "blue"],
    [Target, stats.avgPct === null ? "–" : `${stats.avgPct}%`, "Điểm TB", "teal"],
    [FolderKanban, String(memberships.length), "Nhóm", "orange"],
  ];

  return (
    <aside className="sticky top-24 rounded-2xl border border-border bg-card overflow-hidden shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)]">
      <div className="h-20" style={{ background: `linear-gradient(135deg, ${t.mark}, color-mix(in srgb, ${t.mark} 40%, var(--card)))` }} />
      <div className="px-6 pb-6 -mt-10">
        <div className="flex items-end justify-between">
          <span className="w-20 h-20 rounded-2xl grid place-items-center text-2xl font-black ring-4 ring-card"
                style={{ color: t.ink, backgroundColor: t.bg }}>
            {initials(person.full_name)}
          </span>
          <button type="button" onClick={onEdit}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-bold text-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer">
            <Pencil className="w-3.5 h-3.5" /> Sửa
          </button>
        </div>

        <h1 className="mt-4 text-2xl font-black leading-tight text-foreground">{person.full_name}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {person.type === "candidate" ? "Ứng viên" : "Nhân viên"}
          {person.positions && <> · <span className="font-semibold text-foreground">{person.positions.title}</span></>}
        </p>
        {status && (
          <span className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
                style={{ color: status.color, backgroundColor: `color-mix(in srgb, ${status.color} 12%, var(--card))` }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: status.color }} />{status.label}
          </span>
        )}

        <div className="mt-5 grid grid-cols-2 gap-2">
          {tiles.map(([Icon, v, label, tone]) => (
            <div key={label} className="rounded-xl p-3" style={{ backgroundColor: toneByName(tone).bg }}>
              <Icon className="w-4 h-4" style={{ color: toneByName(tone).ink }} />
              <p className="mt-1.5 text-xl font-black leading-none tabular-nums text-foreground">{v}</p>
              <p className="mt-1 text-[11px] font-semibold truncate" style={{ color: toneByName(tone).ink }}>{label}</p>
            </div>
          ))}
        </div>

        {info.length > 0 && (
          <ul className="mt-5 space-y-2.5">
            {info.map(([Icon, label, tone]) => (
              <li key={label} className="flex items-center gap-3 text-sm text-foreground min-w-0">
                <ToneIcon icon={Icon} tone={toneByName(tone)} size="sm" />
                <span className="truncate">{label}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-5 pt-5 border-t border-border">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Nhóm</p>
          {memberships.length === 0 ? (
            <p className="text-sm text-muted-foreground">Chưa thuộc nhóm nào</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {memberships.map((m, i) => m.groups && (
                <Link key={m.id} href={`/dashboard/groups/${m.groups.id}`}
                      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold hover:opacity-80 transition-opacity"
                      style={{ color: toneAt(i).ink, backgroundColor: toneAt(i).bg }}>
                  <FolderKanban className="w-3.5 h-3.5" />{m.groups.name}
                </Link>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Tag</p>
          {tags.length > 0 ? <TagChips tags={tags} onAdd={onAddTag} /> : (
            <button type="button" onClick={onAddTag} className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors cursor-pointer">
              <Tag className="w-3 h-3" /> Thêm tag
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
