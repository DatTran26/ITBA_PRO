"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ListTodo } from "lucide-react";
import { TASK_STATUSES } from "@/lib/crm/constants";
import type { CrmTaskItem } from "@/app/dashboard/management-types";

interface Props {
  tasks: CrmTaskItem[];
}

export default function PersonDevelopmentTab({ tasks }: Props) {
  if (!tasks.length) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="w-10 h-10 rounded-xl bg-accent border border-border/10 flex items-center justify-center mb-3">
          <ListTodo className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No development tasks yet</p>
      </div>
    );
  }

  return (
    <Card className="bg-muted border-border/10 p-4">
      <h3 className="text-sm font-medium text-foreground mb-3">Tasks ({tasks.length})</h3>
      <div className="space-y-1.5">
        {tasks.map((t) => {
          const cfg = TASK_STATUSES[t.status];
          return (
            <div key={t.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background">
              <div>
                <p className="text-sm text-foreground">{t.title}</p>
                {t.due_date && <p className="text-xs text-muted-foreground">Due {new Date(t.due_date).toLocaleDateString()}</p>}
              </div>
              <Badge variant="outline" className="text-xs border-border/10" style={{ color: cfg.color }}>
                {cfg.label}
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
