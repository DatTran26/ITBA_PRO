"use client";

import { useState } from "react";
import DataTable from "@/components/crm/data-table";
import DataTablePagination from "@/components/crm/data-table-pagination";
import StatusBadge from "@/components/crm/status-badge";
import { POSITION_STATUSES } from "@/lib/crm/constants";
import type { PositionListItem } from "@/app/dashboard/management-types";
import type { ColumnDef } from "@/lib/crm/types";

interface Props {
  data: PositionListItem[];
  onRowClick: (row: PositionListItem) => void;
}

function getReqCount(pos: PositionListItem): number {
  const r = pos.position_skill_requirements;
  if (Array.isArray(r)) return r[0]?.count ?? 0;
  return (r as { count: number })?.count ?? 0;
}

const columns: ColumnDef<PositionListItem>[] = [
  { key: "title", label: "Title", sortable: true },
  { key: "department", label: "Department", sortable: true, className: "hidden md:table-cell", render: (v) => (
    <span className="text-muted-foreground">{v ? String(v) : "—"}</span>
  )},
  { key: "target_level", label: "Level", sortable: true, render: (v) => (
    v ? <span className="text-ai text-xs">{String(v)}</span> : <span className="text-muted-foreground text-xs">—</span>
  )},
  { key: "position_skill_requirements", label: "Skill Reqs", render: (_, row) => (
    <span className="text-xs">{getReqCount(row)}</span>
  )},
  { key: "assigned_persons_count" as keyof PositionListItem, label: "Assigned", sortable: true, render: (_v, row) => (
    <span className="text-xs">{row.assigned_persons_count ?? 0}</span>
  )},
  { key: "status", label: "Status", sortable: true, render: (v) => (
    <StatusBadge status={String(v)} config={POSITION_STATUSES} />
  )},
];

export default function PositionsTableView({ data, onRowClick }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const start = (page - 1) * pageSize;
  const paged = data.slice(start, start + pageSize);

  return (
    <div>
      <DataTable columns={columns} data={paged} onRowClick={onRowClick} />
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
