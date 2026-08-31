"use client";

import { StatusChip } from "@/components/ui/status-chip";

interface StatusBadgeProps {
  status: string;
  config: Record<string, { label: string; color: string }>;
  className?: string;
}

// Thin domain adapter over ui/StatusChip: tone is derived from `status` via
// lib/ui/status-tone; `config` supplies the human label. Renders the canonical
// chip so all CRM status badges stay consistent. DEPRECATED — new code should
// use ui/StatusChip directly.
export default function StatusBadge({ status, config, className }: StatusBadgeProps) {
  return (
    <StatusChip status={status} label={config[status]?.label ?? status} className={className} />
  );
}
