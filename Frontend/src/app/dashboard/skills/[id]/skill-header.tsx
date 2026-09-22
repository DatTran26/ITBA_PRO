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
    <div className="bg-muted border border-border/10 rounded-xl p-5 mb-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-foreground">{skill.name}</h1>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            {skill.category ? (
              <Badge variant="outline" className={`text-xs ${categoryColor(skill.category)}`}>
                {skill.category}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs border-border/20 text-muted-foreground">
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
              className="bg-success hover:bg-success text-white border-0 gap-1.5"
            >
              <FilePlus2 className="w-3.5 h-3.5" /> Tạo bộ test
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="border-border/20 text-muted-foreground hover:text-foreground gap-1.5"
          >
            <Pencil className="w-3.5 h-3.5" /> Edit
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t border-border/10 text-sm text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{positionCount}</span>{" "}
          position{positionCount !== 1 ? "s" : ""} require this skill
        </span>
        <span>
          <span className="font-semibold text-foreground">{personCount}</span>{" "}
          person{personCount !== 1 ? "s" : ""} have this skill
        </span>
        <span className="text-muted-foreground">
          Created {new Date(skill.created_at).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
