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
        <Card className="bg-danger/5 border-border/20 p-4 md:col-span-2">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-danger" />
            <span className="text-sm font-medium text-danger">Attention needed</span>
          </div>
          <ul className="space-y-1">
            {warnings.map((w) => (
              <li key={w} className="text-xs text-danger/80">• {w}</li>
            ))}
          </ul>
        </Card>
      )}

      {/* Position & department */}
      <Card className="bg-muted border-border/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <Building2 className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Position</h3>
        </div>
        {person.positions ? (
          <div>
            <p className="text-sm text-foreground">{person.positions.title}</p>
            {person.positions.department && <p className="text-xs text-muted-foreground mt-0.5">{person.positions.department}</p>}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Not assigned</p>
        )}
        {person.current_level && (
          <div className="mt-3 pt-3 border-t border-border/10">
            <span className="text-xs text-muted-foreground">Level: </span>
            <span className="text-xs text-foreground">{person.current_level}</span>
          </div>
        )}
      </Card>

      {/* Groups */}
      <Card className="bg-muted border-border/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <FolderKanban className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Groups ({memberships.length})</h3>
        </div>
        {memberships.length === 0 ? (
          <p className="text-sm text-muted-foreground">No groups</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {memberships.map((m) => m.groups && (
              <Link key={m.id} href={`/dashboard/groups/${m.groups.id}`} className="px-2.5 py-1 rounded-lg bg-accent text-xs text-muted-foreground hover:text-foreground transition-colors">
                {m.groups.name}
              </Link>
            ))}
          </div>
        )}
      </Card>

      {/* Skills summary */}
      <Card className="bg-muted border-border/10 p-4 md:col-span-2">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Skills ({skills.length})</h3>
        </div>
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">No skills recorded</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {skills.map((s) => (
              <span key={s.id} className="px-2.5 py-1 rounded-lg bg-accent text-xs text-muted-foreground">
                {s.skills.name} <span className="text-primary">Lv.{s.current_level}</span>
              </span>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
