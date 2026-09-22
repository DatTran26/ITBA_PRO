import type { LucideIcon } from "lucide-react";
import type React from "react";
import type { EntityType } from "@/app/dashboard/management-types";
import type { ToneName } from "@/lib/ui/tones";

export interface KpiCardData {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  /** Tông icon + badge; mặc định xoay theo vị trí ô (lib/ui/tones.ts). */
  tone?: ToneName;
  /** Pill nhỏ dưới con số (vd "Đang chạy"). Có `trendLabel` thì trend thắng. */
  badge?: string;
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
