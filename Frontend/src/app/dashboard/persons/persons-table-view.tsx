"use client";

import { useState } from "react";
import DataTable from "@/components/crm/data-table";
import DataTablePagination from "@/components/crm/data-table-pagination";
import StatusBadge from "@/components/crm/status-badge";
import TagChips from "@/components/crm/tag-chips";
import { PERSON_STATUSES } from "@/lib/crm/constants";
import type { PersonListItem } from "@/app/dashboard/management-types";
import type { ColumnDef } from "@/lib/crm/types";

interface Props {
  data: PersonListItem[];
  onRowClick: (row: PersonListItem) => void;
  selectedIds: Set<string>;
  onSelectChange: (ids: Set<string>) => void;
}

const columns: ColumnDef<PersonListItem>[] = [
  { key: "full_name", label: "Name", sortable: true },
  { key: "email", label: "Email", sortable: true, className: "hidden md:table-cell" },
  { key: "type", label: "Type", sortable: true, render: (v) => (
    <span className="capitalize text-xs">{String(v)}</span>
  )},
  { key: "position_title", label: "Position", sortable: true, className: "hidden lg:table-cell", render: (v) => (
    <span className="text-muted-foreground">{v ? String(v) : "—"}</span>
  )},
  { key: "status", label: "Status", sortable: true, render: (v) => (
    <StatusBadge status={String(v)} config={PERSON_STATUSES} />
  )},
  { key: "tags", label: "Tags", className: "hidden xl:table-cell", render: (_, row) => (
    row.tags?.length ? <TagChips tags={row.tags} /> : <span className="text-muted-foreground text-xs">—</span>
  )},
];

export default function PersonsTableView({ data, onRowClick, selectedIds, onSelectChange }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const start = (page - 1) * pageSize;
  const paged = data.slice(start, start + pageSize);

  return (
    <div>
      <DataTable
        columns={columns}
        data={paged}
        onRowClick={onRowClick}
        selectedIds={selectedIds}
        onSelectChange={onSelectChange}
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
