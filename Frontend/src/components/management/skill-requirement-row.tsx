"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Trash2, Star } from "lucide-react";
import type { SkillRequirement } from "@/app/dashboard/management-types";

interface Props {
  req: SkillRequirement;
  onLevelChange: (id: string, level: number) => void;
  onMandatoryToggle: (id: string, mandatory: boolean) => void;
  onDelete: (id: string) => void;
  isSaving?: boolean;
}

const LEVELS = [1, 2, 3, 4, 5];
const LEVEL_LABELS: Record<number, string> = { 1: "Beginner", 2: "Basic", 3: "Intermediate", 4: "Advanced", 5: "Expert" };

export default function SkillRequirementRow({ req, onLevelChange, onMandatoryToggle, onDelete, isSaving }: Props) {
  return (
    <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#0C1220] border border-[#8B99B0]/10 hover:border-[#8B99B0]/20 transition-colors">
      {/* Skill info */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#ECF0F7] truncate">{req.skills.name}</p>
        {req.skills.category && (
          <p className="text-xs text-[#5A6882] truncate">{req.skills.category}</p>
        )}
      </div>

      {/* Required level */}
      <Select
        value={String(req.required_level)}
        onValueChange={(v) => onLevelChange(req.id, Number(v))}
        disabled={isSaving}
      >
        <SelectTrigger className="w-36 h-8 bg-[#1E2840] border-[#8B99B0]/15 text-[#ECF0F7] text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-[#1E2840] border-[#8B99B0]/15">
          {LEVELS.map((l) => (
            <SelectItem key={l} value={String(l)} className="text-xs">
              {l} — {LEVEL_LABELS[l]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Mandatory toggle */}
      <button
        type="button"
        onClick={() => onMandatoryToggle(req.id, !req.is_mandatory)}
        disabled={isSaving}
        title={req.is_mandatory ? "Mandatory" : "Optional"}
        className={`p-1.5 rounded-md transition-colors ${req.is_mandatory ? "text-[#FFB86C] bg-[#FFB86C]/10" : "text-[#5A6882] hover:text-[#8B99B0]"}`}
      >
        <Star className="w-4 h-4" fill={req.is_mandatory ? "currentColor" : "none"} />
      </button>

      {/* Delete */}
      <button
        type="button"
        onClick={() => onDelete(req.id)}
        disabled={isSaving}
        className="p-1.5 rounded-md text-[#5A6882] hover:text-red-400 hover:bg-red-400/10 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
