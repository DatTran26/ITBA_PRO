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
}

export default function FilterBar({
  search,
  onSearchChange,
  filters,
  onClearAll,
}: FilterBarProps) {
  const hasActive = search.length > 0 || filters.some((f) => f.value !== "");

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative flex-1 min-w-[220px] max-w-sm group">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6882] group-focus-within:text-[#7C8FFF] transition-colors pointer-events-none" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by name, email..."
          className="pl-10 h-11 bg-[#1B253B]/40 border-white/5 rounded-xl text-[#ECF0F7] placeholder:text-[#5A6882]/60 focus-visible:ring-0 focus-visible:border-[#7C8FFF]/40 transition-all shadow-inner backdrop-blur-sm"
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
          <SelectTrigger className="h-11 min-w-[150px] bg-[#1B253B]/40 border-white/5 rounded-xl text-[#ECF0F7]/90 hover:bg-[#1B253B]/60 transition-all shadow-inner backdrop-blur-sm">
            <SelectValue placeholder={filter.label} />
          </SelectTrigger>
          <SelectContent className="bg-[#1B253B] border-white/10 rounded-xl overflow-hidden backdrop-blur-xl shadow-2xl">
            <SelectItem value="__all__" className="text-[#5A6882] focus:bg-white/5 hover:bg-white/5 transition-colors">
              All {filter.label}
            </SelectItem>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-[#ECF0F7] focus:bg-[#7C8FFF]/10 focus:text-[#7C8FFF] transition-colors cursor-pointer">
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
          className="h-11 px-4 text-[#5A6882] hover:text-[#ECF0F7] hover:bg-white/5 rounded-xl transition-all gap-2 border border-transparent hover:border-white/5"
        >
          <X className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Reset Filters</span>
        </Button>
      )}
    </div>
  );
}
