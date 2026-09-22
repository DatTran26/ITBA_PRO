"use client";

import { Card } from "@/components/ui/card";
import { AlertTriangle, Briefcase, ListChecks, Users } from "lucide-react";
import TagChips from "@/components/crm/tag-chips";
import type { PositionDetail, TagItem } from "@/app/dashboard/management-types";

interface Props {
  position: PositionDetail;
  assignedCount: number;
  reqCount: number;
  tags: TagItem[];
}

export default function PositionOverviewTab({ position, assignedCount, reqCount, tags }: Props) {
  const warnings: string[] = [];
  if (reqCount === 0) warnings.push("No skill requirements defined");
  if (assignedCount === 0) warnings.push("No persons assigned to this position");

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {warnings.length > 0 && (
        <Card className="bg-muted border-border/20 p-4 lg:col-span-2">
          <h3 className="text-sm font-medium text-danger flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4" /> Attention Needed
          </h3>
          <ul className="space-y-1">
            {warnings.map((w) => (
              <li key={w} className="text-sm text-danger">· {w}</li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="bg-muted border-border/10 p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <Briefcase className="w-4 h-4" /> Position Details
        </h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Department</dt>
            <dd className="text-foreground">{position.department || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Target Level</dt>
            <dd className="text-ai">{position.target_level || "—"}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Status</dt>
            <dd className="text-foreground capitalize">{position.status}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Created</dt>
            <dd className="text-foreground">{new Date(position.created_at).toLocaleDateString()}</dd>
          </div>
        </dl>
        {position.description && (
          <p className="text-sm text-muted-foreground mt-3 pt-3 border-t border-border/10">{position.description}</p>
        )}
      </Card>

      <Card className="bg-muted border-border/10 p-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
          <ListChecks className="w-4 h-4" /> Summary
        </h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Skill Requirements</dt>
            <dd className="text-foreground">{reqCount}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Assigned Persons</dt>
            <dd className="text-foreground">{assignedCount}</dd>
          </div>
        </dl>
        {tags.length > 0 && (
          <div className="mt-3 pt-3 border-t border-border/10">
            <p className="text-xs text-muted-foreground mb-2">Tags</p>
            <TagChips tags={tags} />
          </div>
        )}
      </Card>
    </div>
  );
}
