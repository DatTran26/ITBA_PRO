"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AlertTriangle, Building2, FolderKanban, GraduationCap } from "lucide-react";
import type { PersonDetail, PersonSkillItem } from "@/app/dashboard/management-types";

interface MembershipRow {
  id: string;
  groups: { id: string; name: string; type: string } | null;
}

interface Props {
  person: PersonDetail;
  skills: PersonSkillItem[];
  memberships: MembershipRow[];
}

export default function PersonOverviewTab({ person, skills, memberships }: Props) {
  const warnings: string[] = [];
  if (!person.position_id) warnings.push("No position assigned");
  if (skills.length === 0) warnings.push("No skills recorded");
  if (memberships.length === 0) warnings.push("Not in any group");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Warnings */}
      {warnings.length > 0 && (
        <Card className="bg-[#EF4444]/5 border-[#EF4444]/20 p-4 md:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-[#EF4444]" />
            <span className="text-sm font-medium text-[#EF4444]">Attention needed</span>
          </div>
          <ul className="space-y-1">
            {warnings.map((w) => (
              <li key={w} className="text-xs text-[#EF4444]/80">• {w}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Position & department */}
      <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-[#7C8FFF]" />
          <h3 className="text-sm font-medium text-[#ECF0F7]">Position</h3>
        </div>
        {person.positions ? (
          <div>
            <p className="text-sm text-[#ECF0F7]">{person.positions.title}</p>
            {person.positions.department && <p className="text-xs text-[#5A6882] mt-0.5">{person.positions.department}</p>}
          </div>
        ) : (
          <p className="text-sm text-[#5A6882]">Not assigned</p>
        )}
        {person.current_level && (
          <div className="mt-3 pt-3 border-t border-[#8B99B0]/10">
            <span className="text-xs text-[#5A6882]">Level: </span>
            <span className="text-xs text-[#ECF0F7]">{person.current_level}</span>
          </div>
        )}
      </Card>

      {/* Groups */}
      <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <FolderKanban className="w-4 h-4 text-[#7C8FFF]" />
          <h3 className="text-sm font-medium text-[#ECF0F7]">Groups ({memberships.length})</h3>
        </div>
        {memberships.length === 0 ? (
          <p className="text-sm text-[#5A6882]">No groups</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {memberships.map((m) => m.groups && (
              <Link key={m.id} href={`/dashboard/groups/${m.groups.id}`} className="px-2.5 py-1 rounded-lg bg-[#222C4A] text-xs text-[#8B99B0] hover:text-[#ECF0F7] transition-colors">
                {m.groups.name}
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Skills summary */}
      <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-4 md:col-span-2">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="w-4 h-4 text-[#7C8FFF]" />
          <h3 className="text-sm font-medium text-[#ECF0F7]">Skills ({skills.length})</h3>
        </div>
        {skills.length === 0 ? (
          <p className="text-sm text-[#5A6882]">No skills recorded</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s.id} className="px-2.5 py-1 rounded-lg bg-[#222C4A] text-xs text-[#8B99B0]">
                {s.skills.name} <span className="text-[#7C8FFF]">Lv.{s.current_level}</span>
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
