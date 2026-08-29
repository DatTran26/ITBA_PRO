"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { ChevronDown, ChevronRight } from "lucide-react";
import { categoryColor } from "./skills-list-client";
import type { SkillListItem } from "@/app/dashboard/management-types";

interface Props {
  data: SkillListItem[];
  onCardClick: (s: SkillListItem) => void;
}

export default function SkillsCategoryView({ data, onCardClick }: Props) {
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
        <p className="text-sm text-[#5A6882]">No skills found</p>
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
        />
      ))}
    </div>
  );
}

function CategorySection({
  category,
  skills,
  onCardClick,
}: {
  category: string;
  skills: SkillListItem[];
  onCardClick: (s: SkillListItem) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div className="border border-[#8B99B0]/10 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-[#1B253B] hover:bg-[#0F1829] transition-colors"
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="w-4 h-4 text-[#5A6882]" />
          ) : (
            <ChevronRight className="w-4 h-4 text-[#5A6882]" />
          )}
          <Badge variant="outline" className={`text-xs ${categoryColor(category === "Uncategorized" ? null : category)}`}>
            {category}
          </Badge>
          <span className="text-xs text-[#5A6882]">{skills.length} skill{skills.length !== 1 ? "s" : ""}</span>
        </div>
      </button>

      {open && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3 bg-[#121A2E]">
          {skills.map((s) => (
            <button
              key={s.id}
              onClick={() => onCardClick(s)}
              className="text-left px-3 py-2.5 rounded-lg bg-[#1B253B] border border-[#8B99B0]/10 hover:border-[#7C8FFF]/40 hover:bg-[#0F1829] transition-colors group"
            >
              <p className="text-sm font-medium text-[#ECF0F7] group-hover:text-white truncate">{s.name}</p>
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-xs text-[#5A6882]">{s.position_count} pos</span>
                <span className="text-xs text-[#5A6882]">{s.person_count} persons</span>
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
