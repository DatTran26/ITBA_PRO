"use client";

import { useState, useCallback, type ReactNode } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { ColumnDef } from "@/lib/crm/types";

interface DataTableProps<T extends { id: string }> {
  columns: ColumnDef<T>[];
  data: T[];
  onRowClick?: (row: T) => void;
  selectedIds?: Set<string>;
  onSelectChange?: (ids: Set<string>) => void;
  emptyMessage?: string;
  loading?: boolean;
  rowClassName?: (row: T) => string;
}

type SortDir = "asc" | "desc";

export default function DataTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  selectedIds,
  onSelectChange,
  emptyMessage = "No data found",
  loading,
  rowClassName,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const selectable = !!onSelectChange;

  const handleSort = useCallback(
    (key: string) => {
      if (sortKey === key) {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
      } else {
        setSortKey(key);
        setSortDir("asc");
      }
    },
    [sortKey]
  );

  const toggleAll = useCallback(() => {
    if (!onSelectChange) return;
    const allSelected = data.length > 0 && selectedIds?.size === data.length;
    onSelectChange(allSelected ? new Set() : new Set(data.map((r) => r.id)));
  }, [data, selectedIds, onSelectChange]);

  const toggleRow = useCallback(
    (id: string) => {
      if (!onSelectChange || !selectedIds) return;
      const next = new Set(selectedIds);
      next.has(id) ? next.delete(id) : next.add(id);
      onSelectChange(next);
    },
    [selectedIds, onSelectChange]
  );

  /* Sort data */
  const sorted = sortKey
    ? [...data].sort((a, b) => {
        const av = a[sortKey as keyof T];
        const bv = b[sortKey as keyof T];
        if (av == null && bv == null) return 0;
        if (av == null) return 1;
        if (bv == null) return -1;
        const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
        return sortDir === "asc" ? cmp : -cmp;
      })
    : data;

  if (loading) {
    return (
      <div className="border border-border/10 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-muted border-b border-border/10">
              {columns.map((col) => (
                <th key={col.key} className="px-3 py-2.5 text-left text-xs font-medium text-muted-foreground">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-border/5">
                {columns.map((col) => (
                  <td key={col.key} className="px-3 py-3">
                    <div className="h-4 bg-accent rounded animate-pulse w-3/4" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (!data.length) {
    return (
      <div className="border border-border/10 rounded-lg flex flex-col items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  const allChecked = data.length > 0 && selectedIds?.size === data.length;

  return (
    <div className="border border-border/10 rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              {selectable && (
                <th className="px-3 py-2.5 w-10">
                  <Checkbox checked={allChecked} onCheckedChange={toggleAll} aria-label="Select all" />
                </th>
              )}
              {columns.map((col) => (
                <th key={col.key} className={`px-4 py-4 text-left text-[11px] uppercase tracking-widest font-bold text-muted-foreground ${col.className || ""}`}>
                  {col.sortable ? (
                    <button
                      onClick={() => handleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                    >
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === "asc" ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => {
              const isSelected = selectedIds?.has(row.id);
              return (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  className={`group border-b border-border transition-all duration-200 ${
                    onRowClick ? "cursor-pointer" : ""
                  } ${isSelected ? "bg-primary/10 border-l-2 border-l-border" : ""} ${rowClassName ? rowClassName(row) : ""}`}
                >
                  {selectable && (
                    <td className="px-3 py-2.5 w-10" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleRow(row.id)}
                        aria-label={`Select row ${row.id}`}
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-4 text-sm font-light text-foreground ${col.className || ""}`}>
                      {col.render
                        ? (col.render(row[col.key], row) as ReactNode)
                        : (String(row[col.key] ?? "") as ReactNode)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
