"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { SharedDashboardButton } from "@/components/shares";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, ListChecks } from "lucide-react";
import { toast } from "sonner";
import SkillRequirementRow from "@/components/management/skill-requirement-row";
import type { PositionDetail, SkillRequirement } from "@/app/dashboard/management-types";

interface AvailableSkill { id: string; name: string; category: string | null }

interface Props {
  position: PositionDetail;
  requirements: SkillRequirement[];
  availableSkills: AvailableSkill[];
}

export default function PositionSkillsTab({ position, requirements: initial, availableSkills }: Props) {
  const router = useRouter();
  const [requirements, setRequirements] = useState<SkillRequirement[]>(initial);
  const [addingSkillId, setAddingSkillId] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const usedSkillIds = new Set(requirements.map((r) => r.skill_id));
  const unusedSkills = availableSkills.filter((s) => !usedSkillIds.has(s.id));

  async function handleAdd() {
    if (!addingSkillId) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/positions/${position.id}/requirements`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ skill_id: addingSkillId, required_level: 3, is_mandatory: true, checklist_order: requirements.length + 1 }),
      });
      if (!res.ok) throw new Error();
      toast.success("Skill requirement added");
      setAddingSkillId("");
      router.refresh();
    } catch {
      toast.error("Failed to add requirement");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleLevelChange(id: string, level: number) {
    setRequirements((prev) => prev.map((r) => r.id === id ? { ...r, required_level: level } : r));
    try {
      const res = await fetch(`/api/positions/${position.id}/requirements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ required_level: level }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to update level");
      router.refresh();
    }
  }

  async function handleMandatoryToggle(id: string, mandatory: boolean) {
    setRequirements((prev) => prev.map((r) => r.id === id ? { ...r, is_mandatory: mandatory } : r));
    try {
      const res = await fetch(`/api/positions/${position.id}/requirements/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_mandatory: mandatory }),
      });
      if (!res.ok) throw new Error();
    } catch {
      toast.error("Failed to update requirement");
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this skill requirement?")) return;
    setRequirements((prev) => prev.filter((r) => r.id !== id));
    try {
      const res = await fetch(`/api/positions/${position.id}/requirements/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Requirement removed");
    } catch {
      toast.error("Failed to remove requirement");
      router.refresh();
    }
  }

  return (
    <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-[#8B99B0] uppercase tracking-wide flex items-center gap-2">
          <ListChecks className="w-4 h-4" /> Skill Requirements ({requirements.length})
        </h2>
      </div>

      {requirements.length === 0 ? (
        <p className="text-sm text-[#5A6882] text-center py-6">No skill requirements yet. Add one below.</p>
      ) : (
        <div className="space-y-2 mb-4">
          {requirements.map((req) => (
            <SkillRequirementRow
              key={req.id}
              req={req}
              onLevelChange={handleLevelChange}
              onMandatoryToggle={handleMandatoryToggle}
              onDelete={handleDelete}
              isSaving={isSaving}
            />
          ))}
        </div>
      )}

      {unusedSkills.length > 0 && (
        <div className="flex gap-2 pt-3 border-t border-[#8B99B0]/10">
          <Select value={addingSkillId} onValueChange={(v) => setAddingSkillId(v ?? "")}>
            <SelectTrigger className="flex-1 bg-[#222C4A] border-[#8B99B0]/15 text-[#ECF0F7] text-sm">
              <SelectValue placeholder="Select a skill to add..." />
            </SelectTrigger>
            <SelectContent className="bg-[#222C4A] border-[#8B99B0]/15 max-h-48">
              {unusedSkills.map((s) => (
                <SelectItem key={s.id} value={s.id} className="text-sm">
                  {s.name}{s.category ? ` (${s.category})` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SharedDashboardButton onClick={handleAdd} disabled={!addingSkillId || isSaving} className="bg-[#7C8FFF] hover:bg-[#5B6CF0] text-white gap-1.5 shrink-0">
            <Plus className="w-4 h-4" /> Add
          </SharedDashboardButton>
        </div>
      )}
    </Card>
  );
}
