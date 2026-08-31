"use client";

import { Pencil, FilePlus2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { categoryColor } from "../skills-list-client";
import type { SkillDetail } from "@/app/dashboard/management-types";

interface Props {
  skill: SkillDetail;
  onEdit: () => void;
  onCreateTest?: () => void;
}

export default function SkillHeader({ skill, onEdit, onCreateTest }: Props) {
  const positionCount = skill.position_requirements.length;
  const personCount = skill.person_skills.length;
  const shortageScore = Math.max(0, positionCount - personCount);

  return (
    <div className="bg-[#1B253B] border border-[#8B99B0]/10 rounded-xl p-5 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-[#ECF0F7]">{skill.name}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {skill.category ? (
              <Badge variant="outline" className={`text-xs ${categoryColor(skill.category)}`}>
                {skill.category}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs border-[#8B99B0]/20 text-[#5A6882]">
                Uncategorized
              </Badge>
            )}
            {shortageScore > 0 && (
              <Badge variant="outline" className="text-xs border-red-500/30 text-red-400 bg-red-500/10">
                Gap: −{shortageScore}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {onCreateTest && (
            <Button
              size="sm"
              onClick={onCreateTest}
              className="bg-[#10B981] hover:bg-[#0D9E6E] text-white border-0 gap-1.5"
            >
              <FilePlus2 className="w-3.5 h-3.5" /> Tạo bộ test
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="border-[#8B99B0]/20 text-[#8B99B0] hover:text-[#ECF0F7] gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-[#8B99B0]/10 text-sm text-[#8B99B0]">
        <span>
          <span className="font-semibold text-[#ECF0F7]">{positionCount}</span>{" "}
          position{positionCount !== 1 ? "s" : ""} require this skill
        </span>
        <span>
          <span className="font-semibold text-[#ECF0F7]">{personCount}</span>{" "}
          person{personCount !== 1 ? "s" : ""} have this skill
        </span>
        <span className="text-[#5A6882]">
          Created {new Date(skill.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
