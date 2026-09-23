"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { categoryStyle } from "./skills-list-client";
import type { SkillListItem } from "@/app/dashboard/management-types";

interface Props {
  data: SkillListItem[];
  categoryOrder: string[];
  onCardClick: (s: SkillListItem) => void;
}

export default function SkillsCategoryView({ data, onCardClick, categoryOrder }: Props) {
  const groups = data.reduce<Record<string, SkillListItem[]>>((acc, s) => {
    const key = s.category ?? "Uncategorized";
    if (!acc[key]) acc[key] = [];
    acc[key].push(s);
    return acc;
  }, {});

  const sortedKeys = Object.keys(groups).sort((a, b) =>
    a === "Uncategorized" ? 1 : b === "Uncategorized" ? -1 : a.localeCompare(b)
  );

  if (!data.length) {
    return (
      <div className="flex flex-col items-center py-16 text-center">
        <p className="text-sm text-muted-foreground">No skills found</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedKeys.map((cat) => (
        <CategorySection
          key={cat}
          category={cat}
          skills={groups[cat]}
          onCardClick={onCardClick}
          categoryOrder={categoryOrder}
        />
      ))}
    </div>
  );
}

function CategorySection({
  category,
  skills,
  onCardClick,
  categoryOrder,
}: {
  category: string;
  categoryOrder: string[];
  skills: SkillListItem[];
  onCardClick: (s: SkillListItem) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-border/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-muted hover:bg-background transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <Badge variant="outline" className="text-xs font-bold" style={categoryStyle(category === "Uncategorized" ? null : category, categoryOrder)}>
            {category}
          </Badge>
          <span className="text-xs text-muted-foreground">{skills.length} skill{skills.length !== 1 ? "s" : ""}</span>
        </div>
      </button>

      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3 bg-background">
          {skills.map((s) => (
            <button
              key={s.id}
              onClick={() => onCardClick(s)}
              className="text-left px-3 py-2.5 rounded-lg bg-muted border border-border/10 hover:border-border/40 hover:bg-background transition-colors group"
            >
              <p className="text-sm font-medium text-foreground group-hover:text-foreground truncate">{s.name}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-muted-foreground">{s.position_count} pos</span>
                <span className="text-xs text-muted-foreground">{s.person_count} persons</span>
                {s.shortage_score > 0 && (
                  <Badge variant="outline" className="text-xs border-red-500/30 text-red-400 bg-red-500/10 py-0 px-1.5">
                    −{s.shortage_score}
                  </Badge>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
