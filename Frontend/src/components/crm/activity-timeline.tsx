"use client";

import type { ActivityLogItem } from "@/app/dashboard/management-types";

interface ActivityTimelineProps {
  items: ActivityLogItem[];
  loading?: boolean;
}

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

export default function ActivityTimeline({ items, loading }: ActivityTimelineProps) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-2 h-2 mt-1.5 rounded-full bg-accent shrink-0" />
            <div className="flex-1 space-y-1.5">
              <div className="h-3 bg-accent rounded w-3/4" />
              <div className="h-2.5 bg-accent rounded w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-10 h-10 rounded-xl bg-accent border border-border/10 flex items-center justify-center mb-3">
          <span className="text-lg">📋</span>
        </div>
        <p className="text-sm text-muted-foreground">No activity yet</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[3px] top-2 bottom-2 w-px bg-accent" />
      <div className="space-y-4">
        {items.map((item) => {
          const actor = item.users?.name ?? item.users?.email ?? "System";
          return (
            <div key={item.id} className="flex gap-3 relative">
              <div className="w-1.5 h-1.5 mt-1.5 rounded-full bg-primary shrink-0 z-10" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-foreground leading-snug">
                  <span className="font-medium text-ai">{actor}</span>{" "}
                  {item.action}
                </p>
                <span className="text-xs text-muted-foreground">{relativeTime(item.created_at)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
