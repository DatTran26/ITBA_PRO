"use client";

import { Pencil, StickyNote, Tag } from "lucide-react";
import { SharedDashboardButton } from "@/components/shares";
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
  return (
    <div className="bg-muted border border-border/10 rounded-xl p-5 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-ai/20 flex items-center justify-center text-primary font-bold text-xl shrink-0">
            {person.full_name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">{person.full_name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={person.status} config={PERSON_STATUSES} />
              <span className="text-xs text-muted-foreground capitalize">{person.type}</span>
              {person.positions && (
                <span className="text-xs text-muted-foreground">• {person.positions.title}</span>
              )}
            </div>
            {tags.length > 0 && (
              <div className="mt-2">
                <TagChips tags={tags} onAdd={onAddTag} />
              </div>
            )}
            {tags.length === 0 && (
              <SharedDashboardButton onClick={onAddTag} className="mt-2 text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                <Tag className="w-3 h-3" /> Add tags
              </SharedDashboardButton>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {matchScore !== undefined && (
            <div className="text-center">
              <ScoreRing value={matchScore} size={48} />
              <p className="text-[10px] text-muted-foreground mt-0.5">Match</p>
            </div>
          )}
          <div className="flex gap-1.5">
            <SharedDashboardButton variant="outline" size="sm" onClick={onEdit} className="border-border/20 text-muted-foreground hover:text-foreground gap-1.5">
              <Pencil className="w-3.5 h-3.5" /> Edit
            </SharedDashboardButton>
          </div>
        </div>
      </div>

      {/* Quick info row */}
      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/10 text-sm text-muted-foreground">
        {person.email && <span>{person.email}</span>}
        {person.phone && <span>{person.phone}</span>}
        {person.department && <span>{person.department}</span>}
        {person.current_level && <span>Level: <span className="text-foreground">{person.current_level}</span></span>}
        {person.joined_date && <span>Joined {new Date(person.joined_date).toLocaleDateString()}</span>}
      </div>
    </div>
  );
}
