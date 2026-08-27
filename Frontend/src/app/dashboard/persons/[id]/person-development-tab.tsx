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
        <div className="w-10 h-10 rounded-xl bg-[#222C4A] border border-[#8B99B0]/10 flex items-center justify-center mb-3">
          <ListTodo className="w-5 h-5 text-[#5A6882]" />
        </div>
        <p className="text-sm text-[#5A6882]">No development tasks yet</p>
      </div>
    );
  }

  return (
    <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-4">
      <h3 className="text-sm font-medium text-[#ECF0F7] mb-3">Tasks ({tasks.length})</h3>
      <div className="space-y-1.5">
        {tasks.map((t) => {
          const cfg = TASK_STATUSES[t.status];
          return (
            <div key={t.id} className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0A0F1A]">
              <div>
                <p className="text-sm text-[#ECF0F7]">{t.title}</p>
                {t.due_date && <p className="text-xs text-[#5A6882]">Due {new Date(t.due_date).toLocaleDateString()}</p>}
              </div>
              <Badge variant="outline" className="text-xs border-[#8B99B0]/10" style={{ color: cfg.color }}>
                {cfg.label}
              </Badge>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
