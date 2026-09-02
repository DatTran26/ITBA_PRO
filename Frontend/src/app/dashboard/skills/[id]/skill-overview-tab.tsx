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
      <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-4">
        <h3 className="text-sm font-medium text-[#8B99B0] mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4" /> Skill Details
        </h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#5A6882]">Category</dt>
            <dd className="text-[#ECF0F7]">{skill.category || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#5A6882]">Created</dt>
            <dd className="text-[#ECF0F7]">{new Date(skill.created_at).toLocaleDateString()}</dd>
          </div>
        </dl>
        <div className="mt-3 pt-3 border-t border-[#8B99B0]/10">
          <dt className="text-xs text-[#5A6882] mb-1">Description</dt>
          <dd className="text-sm text-[#8B99B0]">
            {skill.description || <span className="text-[#5A6882] italic">No description provided</span>}
          </dd>
        </div>
      </Card>

      <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-4">
        <h3 className="text-sm font-medium text-[#8B99B0] mb-3 flex items-center gap-2">
          <BarChart2 className="w-4 h-4" /> Usage Summary
        </h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-[#5A6882]">Positions Requiring It</dt>
            <dd className="text-[#ECF0F7] font-semibold">{positionCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#5A6882]">Persons With This Skill</dt>
            <dd className="text-[#ECF0F7] font-semibold">{personCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-[#5A6882]">Shortage Score</dt>
            <dd className={shortageScore > 0 ? "text-red-400 font-semibold" : "text-green-400 font-semibold"}>
              {shortageScore > 0 ? `−${shortageScore}` : "No gap"}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  );
}
