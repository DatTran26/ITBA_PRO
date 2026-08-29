import type { LucideIcon } from "lucide-react";
import type React from "react";
import type { EntityType } from "@/app/dashboard/management-types";

export interface KpiCardData {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
}

export interface ColumnDef<T> {
  key: keyof T & string;
  label: string;
  sortable?: boolean;
  render?: (value: unknown, row: T) => React.ReactNode;
  className?: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterDef {
  key: string;
  label: string;
  options: FilterOption[];
}

export interface EntityRef {
  entity_type: EntityType;
  entity_id: string;
}
