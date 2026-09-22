"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import DataTable from "@/components/crm/data-table";
import DataTablePagination from "@/components/crm/data-table-pagination";
import { categoryColor } from "./skills-list-client";
import type { SkillListItem } from "@/app/dashboard/management-types";
import type { ColumnDef } from "@/lib/crm/types";

interface Props {
  data: SkillListItem[];
  onRowClick: (s: SkillListItem) => void;
  onEdit: (s: SkillListItem) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

export default function SkillsTableView({ data, onRowClick, onEdit, onDelete, deletingId }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const start = (page - 1) * pageSize;
  const paged = data.slice(start, start + pageSize);

  const columns: ColumnDef<SkillListItem>[] = [
    {
      key: "name",
      label: "Skill Name",
      sortable: true,
    },
    {
      key: "category",
      label: "Category",
      sortable: true,
      render: (v) =>
        v ? (
          <Badge variant="outline" className={`text-xs ${categoryColor(String(v))}`}>
            {String(v)}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        ),
    },
    {
      key: "demand_score",
      label: "Positions",
      sortable: true,
      render: (v) => <span className="text-xs text-muted-foreground">{String(v)}</span>,
    },
    {
      key: "person_count",
      label: "Persons",
      sortable: true,
      render: (v) => <span className="text-xs text-muted-foreground">{String(v)}</span>,
    },
    {
      key: "shortage_score",
      label: "Shortage",
      sortable: true,
      render: (v) => {
        const score = Number(v);
        return (
          <Badge
            variant="outline"
            className={`text-xs ${score > 0 ? "border-red-500/30 text-red-400 bg-red-500/10" : "border-green-500/30 text-green-400 bg-green-500/10"}`}
          >
            {score > 0 ? `−${score}` : "OK"}
          </Badge>
        );
      },
    },
    {
      key: "id",
      label: "Actions",
      render: (_, row) => (
        <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onEdit(row)}
            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => onDelete(row.id)}
            disabled={deletingId === row.id}
            className="p-1.5 rounded text-muted-foreground hover:text-red-400 hover:bg-red-400/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <DataTable
        columns={columns}
        data={paged}
        onRowClick={onRowClick}
        emptyMessage="No skills found"
      />
      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={data.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
