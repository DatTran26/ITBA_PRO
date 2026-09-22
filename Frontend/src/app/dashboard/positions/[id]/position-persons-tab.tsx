"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Users } from "lucide-react";
import StatusBadge from "@/components/crm/status-badge";
import { PERSON_STATUSES } from "@/lib/crm/constants";
import type { SkillRequirement } from "@/app/dashboard/management-types";

interface AssignedPerson {
  id: string;
  full_name: string;
  email: string | null;
  type: string;
  current_level: string | null;
  status: string;
}

interface Props {
  persons: AssignedPerson[];
  requirements: SkillRequirement[];
}

export default function PositionPersonsTab({ persons, requirements }: Props) {
  if (!persons.length) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="w-10 h-10 rounded-xl bg-accent border border-border/10 flex items-center justify-center mb-3">
          <Users className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No persons assigned to this position</p>
      </div>
    );
  }

  return (
    <Card className="bg-muted border-border/10 p-4">
      <h3 className="text-sm font-medium text-foreground mb-3">
        Assigned Persons ({persons.length}) · {requirements.length} skill req{requirements.length !== 1 ? "s" : ""}
      </h3>
      <div className="space-y-1.5">
        {persons.map((p) => (
          <Link
            key={p.id}
            href={`/dashboard/persons/${p.id}`}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background hover:bg-accent transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-ai/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                {p.full_name.charAt(0).toUpperCase()}
              </div>
              <div>
                <span className="text-sm text-foreground group-hover:text-white">{p.full_name}</span>
                {p.email && <p className="text-xs text-muted-foreground">{p.email}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {p.current_level && <span className="text-xs text-ai">{p.current_level}</span>}
              <StatusBadge status={p.status} config={PERSON_STATUSES} />
            </div>
          </Link>
        ))}
      </div>
    </Card>
  );
}
