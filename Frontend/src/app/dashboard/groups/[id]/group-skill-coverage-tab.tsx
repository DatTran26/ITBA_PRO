"use client";

import { Card } from "@/components/ui/card";
import { Layers, Building2 } from "lucide-react";
import type { GroupMemberItem } from "@/app/dashboard/management-types";

interface Props {
  members: GroupMemberItem[];
}

export default function GroupSkillCoverageTab({ members }: Props) {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center py-14 text-center">
        <div className="w-12 h-12 rounded-xl bg-accent border border-border/10 flex items-center justify-center mb-3">
          <Layers className="w-6 h-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Skill coverage analysis requires member position data.</p>
        <p className="text-xs text-muted-foreground mt-1">Add members to this group to begin analysis.</p>
      </div>
    );
  }

  const uniqueDepts = [...new Set(members.map((m) => m.persons.department).filter(Boolean))] as string[];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Full skill heatmap and gap analysis will be available once position data is linked in a future update.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Card className="bg-muted border-border/10 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Total Members</p>
          <p className="text-2xl font-bold text-foreground">{members.length}</p>
        </Card>
        <Card className="bg-muted border-border/10 p-4">
          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Departments Represented</p>
          <p className="text-2xl font-bold text-foreground">{uniqueDepts.length}</p>
        </Card>
      </div>

      {uniqueDepts.length > 0 && (
        <Card className="bg-muted border-border/10 p-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Departments</h3>
          <div className="flex flex-wrap gap-2">
            {uniqueDepts.map((dept) => (
              <span
                key={dept}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent text-xs text-muted-foreground border border-border/10"
              >
                <Building2 className="w-3 h-3" />
                {dept}
              </span>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
