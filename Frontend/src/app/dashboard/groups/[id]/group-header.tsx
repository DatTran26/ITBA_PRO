"use client";

import Link from "next/link";
import { ArrowLeft, Pencil, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import StatusBadge from "@/components/crm/status-badge";
import ScoreRing from "@/components/crm/score-ring";
import { GROUP_STATUSES } from "@/lib/crm/constants";
import type { GroupListItem } from "@/app/dashboard/management-types";

const TYPE_COLORS: Record<string, string> = {
  department: "border-border/30 text-success",
  batch:      "border-border/30 text-primary",
  campaign:   "border-border/30 text-warning",
  other:      "border-border/30 text-muted-foreground",
};


interface Props {
  group: GroupListItem;
  memberCount: number;
  onEdit: () => void;
  onAddMember: () => void;
}

export default function GroupHeader({ group, memberCount, onEdit, onAddMember }: Props) {
  const score = group.health_score ?? 0;

  return (
    <div className="mb-6">
      <Link
        href="/dashboard/groups"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Groups
      </Link>

      <Card className="bg-muted border-border/10 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <ScoreRing value={score} size={56} label="Health" />
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{group.name}</h1>
              <div className="flex items-center flex-wrap gap-2 mt-1.5">
                <Badge
                  variant="outline"
                  className={`text-xs capitalize ${TYPE_COLORS[group.type] ?? TYPE_COLORS.other}`}
                >
                  {group.type}
                </Badge>
                <StatusBadge status={group.status} config={GROUP_STATUSES} />
                <span className="text-xs text-muted-foreground">
                  {memberCount} member{memberCount !== 1 ? "s" : ""}
                </span>
              </div>
              {group.description && (
                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{group.description}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={onAddMember}
              size="sm"
              className="bg-primary hover:bg-primary text-white gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> Add Member
            </Button>
            <Button
              onClick={onEdit}
              variant="outline"
              size="sm"
              className="border-border/20 text-muted-foreground hover:text-foreground gap-1.5"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
