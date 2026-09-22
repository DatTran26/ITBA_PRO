"use client";

import { Card } from "@/components/ui/card";
import { Zap, BarChart2 } from "lucide-react";
import type { SkillDetail } from "@/app/dashboard/management-types";

interface Props {
  skill: SkillDetail;
}

export default function SkillOverviewTab({ skill }: Props) {
  const positionCount = skill.position_requirements.length;
  const personCount = skill.person_skills.length;
  const shortageScore = Math.max(0, positionCount - personCount);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <Card className="bg-muted border-border/10 p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" /> Skill Details
        </h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Category</dt>
            <dd className="text-foreground">{skill.category || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Created</dt>
            <dd className="text-foreground">{new Date(skill.created_at).toLocaleDateString()}</dd>
          </div>
        </dl>
        <div className="mt-3 pt-3 border-t border-border/10">
          <dt className="text-xs text-muted-foreground mb-1">Description</dt>
          <dd className="text-sm text-muted-foreground">
            {skill.description || <span className="text-muted-foreground italic">No description provided</span>}
          </dd>
        </div>
      </Card>

      <Card className="bg-muted border-border/10 p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <BarChart2 className="w-4 h-4" /> Usage Summary
        </h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Positions Requiring It</dt>
            <dd className="text-foreground font-semibold">{positionCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Persons With This Skill</dt>
            <dd className="text-foreground font-semibold">{personCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Shortage Score</dt>
            <dd className={shortageScore > 0 ? "text-red-400 font-semibold" : "text-green-400 font-semibold"}>
              {shortageScore > 0 ? `−${shortageScore}` : "No gap"}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
