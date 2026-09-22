"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { FolderKanban } from "lucide-react";

interface MembershipRow {
  id: string;
  groups: { id: string; name: string; type: string } | null;
}

interface Props {
  memberships: MembershipRow[];
}

export default function PersonRelationshipsTab({ memberships }: Props) {
  if (!memberships.length) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="w-10 h-10 rounded-xl bg-accent border border-border/10 flex items-center justify-center mb-3">
          <FolderKanban className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">Not a member of any group</p>
      </div>
    );
  }

  return (
    <Card className="bg-muted border-border/10 p-4">
      <h3 className="text-sm font-medium text-foreground mb-3">Group Memberships ({memberships.length})</h3>
      <div className="space-y-1.5">
        {memberships.map((m) => m.groups && (
          <Link
            key={m.id}
            href={`/dashboard/groups/${m.groups.id}`}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background hover:bg-accent transition-colors group"
          >
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground group-hover:text-foreground">{m.groups.name}</span>
            </div>
            <span className="text-xs text-muted-foreground capitalize">{m.groups.type}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
