"use client";

import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { FilterDef } from "@/lib/crm/types";

interface ActiveFilter extends FilterDef {
  value: string;
  onChange: (v: string) => void;
}

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  filters: ActiveFilter[];
  onClearAll?: () => void;
  searchPlaceholder?: string;
}

export default function FilterBar({
  search,
  onSearchChange,
  filters,
  onClearAll,
  searchPlaceholder = "Search by name, email...",
}: FilterBarProps) {
  const hasActive = search.length > 0 || filters.some((f) => f.value !== "");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[220px] max-w-sm group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="pl-10 h-11 bg-muted/40 border-border rounded-xl text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:border-border/40 transition-all shadow-inner backdrop-blur-sm"
        />
      </div>

      {filters.map((filter) => (
        <Select
          key={filter.key}
          // Always pass a defined value — empty filter maps to the "__all__" sentinel
          // so Select stays controlled for its entire lifetime.
          value={filter.value || "__all__"}
          onValueChange={(v) => filter.onChange(v === "__all__" ? "" : (v ?? ""))}
        >
          <SelectTrigger className="h-11 min-w-[150px] bg-muted/40 border-border rounded-xl text-foreground/90 hover:bg-muted/60 transition-all shadow-inner backdrop-blur-sm">
            {/* Base UI in thẳng value ra trigger — map sentinel/value về label */}
            <SelectValue>
              {(v: string) => v === "__all__"
                ? `All ${filter.label}`
                : filter.options.find((o) => o.value === v)?.label ?? v}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-muted border-border rounded-xl overflow-hidden backdrop-blur-xl shadow-2xl">
            <SelectItem value="__all__" className="text-muted-foreground focus:bg-muted hover:bg-muted transition-colors">
              All {filter.label}
            </SelectItem>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-foreground focus:bg-primary/10 focus:text-primary transition-colors cursor-pointer">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ))}

      {hasActive && onClearAll && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onClearAll}
          className="h-11 px-4 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all gap-2 border border-transparent hover:border-border"
        >
          <X className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Reset Filters</span>
        </Button>
      )}
    </div>
  );
}
