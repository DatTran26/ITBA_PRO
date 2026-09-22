"use client";

import { Pencil, Tag, Mail, Phone, Building2, Layers, CalendarDays } from "lucide-react";
import { SharedDashboardButton } from "@/components/shares";
import DetailHeader, { type DetailInfoItem } from "@/components/shares/detail-header";
import StatusBadge from "@/components/crm/status-badge";
import TagChips from "@/components/crm/tag-chips";
import ScoreRing from "@/components/crm/score-ring";
import { PERSON_STATUSES } from "@/lib/crm/constants";
import type { PersonDetail, TagItem } from "@/app/dashboard/management-types";

interface Props {
  person: PersonDetail;
  tags: TagItem[];
  matchScore?: number;
  onEdit: () => void;
  onAddTag: () => void;
}

export default function PersonProfileHeader({ person, tags, matchScore, onEdit, onAddTag }: Props) {
  const info: DetailInfoItem[] = [
    person.email && { icon: Mail, label: person.email },
    person.phone && { icon: Phone, label: person.phone },
    person.department && { icon: Building2, label: person.department },
    person.current_level && { icon: Layers, label: `Level ${person.current_level}` },
    person.joined_date && { icon: CalendarDays, label: `Vào ${new Date(person.joined_date).toLocaleDateString("vi-VN")}` },
  ].filter(Boolean) as DetailInfoItem[];

  return (
    <DetailHeader
      title={person.full_name}
      status={<StatusBadge status={person.status} config={PERSON_STATUSES} />}
      subtitle={
        <span>
          {person.type === "candidate" ? "Ứng viên" : person.type === "employee" ? "Nhân viên" : person.type}
          {person.positions && <> · {person.positions.title}</>}
        </span>
      }
      tags={tags.length > 0 ? (
        <TagChips tags={tags} onAdd={onAddTag} />
      ) : (
        <button type="button" onClick={onAddTag} className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary transition-colors">
          <Tag className="w-3 h-3" /> Add tags
        </button>
      )}
      actions={<>
        {matchScore !== undefined && (
          <div className="text-center">
            <ScoreRing value={matchScore} size={48} />
            <p className="text-[10px] text-muted-foreground mt-0.5">Match</p>
          </div>
        )}
        <SharedDashboardButton variant="secondary" size="sm" onClick={onEdit} leadingIcon={<Pencil className="w-3.5 h-3.5" />}>
          Edit
        </SharedDashboardButton>
      </>}
      info={info}
    />
  );
}
