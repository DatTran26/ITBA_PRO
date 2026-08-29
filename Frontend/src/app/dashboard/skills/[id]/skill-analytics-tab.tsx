"use client";

import { Card } from "@/components/ui/card";
import { TrendingUp, Users, Briefcase, AlertTriangle } from "lucide-react";
import ScoreRing from "@/components/crm/score-ring";

interface Props {
  positionCount: number;
  personCount: number;
}

export default function SkillAnalyticsTab({ positionCount, personCount }: Props) {
  const shortage = Math.max(0, positionCount - personCount);
  const coverageRate = positionCount > 0 ? Math.round((personCount / positionCount) * 100) : 0;

  if (positionCount === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="w-10 h-10 rounded-xl bg-[#222C4A] border border-[#8B99B0]/10 flex items-center justify-center mb-3">
          <TrendingUp className="w-5 h-5 text-[#5A6882]" />
        </div>
        <p className="text-sm text-[#5A6882]">Not yet required by any position</p>
        <p className="text-xs text-[#5A6882] mt-1">Analytics will appear once this skill is added to a position</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Coverage ring */}
      <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-5 flex flex-col items-center gap-3">
        <p className="text-sm font-medium text-[#8B99B0] self-start">Coverage Rate</p>
        <ScoreRing value={personCount} max={positionCount} size={100} label="persons / positions" />
        <p className="text-xs text-[#5A6882] text-center">
          {coverageRate}% of demanded positions are covered by persons with this skill
        </p>
      </Card>

      {/* Stats breakdown */}
      <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-4">
        <p className="text-sm font-medium text-[#8B99B0] mb-4">Demand vs Supply</p>
        <div className="space-y-3">
          <StatRow
            icon={Briefcase}
            label="Demand"
            sublabel="Positions requiring this skill"
            value={positionCount}
            color="text-[#7C8FFF]"
          />
          <StatRow
            icon={Users}
            label="Supply"
            sublabel="Persons with this skill"
            value={personCount}
            color="text-[#22C55E]"
          />
          <div className="border-t border-[#8B99B0]/10 pt-3">
            <StatRow
              icon={AlertTriangle}
              label="Gap"
              sublabel="Unfilled demand"
              value={shortage}
              color={shortage > 0 ? "text-red-400" : "text-[#22C55E]"}
              valueOverride={shortage > 0 ? `−${shortage}` : "None"}
            />
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatRow({
  icon: Icon,
  label,
  sublabel,
  value,
  color,
  valueOverride,
}: {
  icon: typeof Briefcase;
  label: string;
  sublabel: string;
  value: number;
  color: string;
  valueOverride?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#222C4A] flex items-center justify-center shrink-0">
          <Icon className={`w-4 h-4 ${color}`} />
        </div>
        <div>
          <p className="text-sm font-medium text-[#ECF0F7]">{label}</p>
          <p className="text-xs text-[#5A6882]">{sublabel}</p>
        </div>
      </div>
      <span className={`text-lg font-bold ${color}`}>{valueOverride ?? value}</span>
    </div>
  );
}
