"use client";

import { useState } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import DataTable from "@/components/crm/data-table";
import DataTablePagination from "@/components/crm/data-table-pagination";
import StatusBadge from "@/components/crm/status-badge";
import ScoreRing from "@/components/crm/score-ring";
import { GROUP_STATUSES } from "@/lib/crm/constants";
import type { GroupListItem } from "@/app/dashboard/management-types";
import type { ColumnDef } from "@/lib/crm/types";

const TYPE_COLORS: Record<string, string> = {
  department: "border-[#50FA7B]/30 text-[#50FA7B]",
  batch:      "border-[#8BE9FD]/30 text-[#8BE9FD]",
  campaign:   "border-[#FFB86C]/30 text-[#FFB86C]",
  other:      "border-[#8B99B0]/30 text-[#8B99B0]",
};

function getMemberCount(g: GroupListItem): number {
  const m = g.group_members;
  if (Array.isArray(m)) return m[0]?.count ?? 0;
  return (m as { count: number })?.count ?? 0;
}

interface Props {
  groups: GroupListItem[];
  onRowClick: (g: GroupListItem) => void;
  onEdit: (g: GroupListItem) => void;
}

export default function GroupsTableView({ groups, onRowClick, onEdit }: Props) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const columns: ColumnDef<GroupListItem>[] = [
    {
      key: "name",
      label: "Name",
      sortable: true,
    },
    {
      key: "type",
      label: "Type",
      sortable: true,
      render: (v) => (
        <Badge variant="outline" className={`text-xs capitalize ${TYPE_COLORS[String(v)] ?? TYPE_COLORS.other}`}>
          {String(v)}
        </Badge>
      ),
    },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (v) => <StatusBadge status={String(v)} config={GROUP_STATUSES} />,
    },
    {
      key: "group_members",
      label: "Members",
      render: (_, row) => (
        <span className="text-xs text-[#8B99B0]">{getMemberCount(row)}</span>
      ),
    },
    {
      key: "health_score",
      label: "Health",
      render: (_, row) => <ScoreRing value={row.health_score ?? 0} size={32} />,
    },
    {
      key: "alert_count",
      label: "At Risk",
      render: (_, row) =>
        (row.alert_count ?? 0) > 0 ? (
          <span className="text-xs text-[#EF4444]">{row.alert_count}</span>
        ) : (
          <span className="text-xs text-[#5A6882]">—</span>
        ),
    },
    {
      key: "id",
      label: "",
      render: (_, row) => (
        <Button
          size="icon-sm"
          variant="ghost"
          onClick={(e) => { e.stopPropagation(); onEdit(row); }}
          className="text-[#5A6882] hover:text-[#ECF0F7] hover:bg-[#222C4A]"
          aria-label="Edit group"
        >
          <Pencil className="w-3.5 h-3.5" />
        </Button>
      ),
    },
  ];

  const start = (page - 1) * pageSize;
  const paged = groups.slice(start, start + pageSize);

  return (
    <div>
      <DataTable columns={columns} data={paged} onRowClick={onRowClick} />
      <DataTablePagination
        page={page}
        pageSize={pageSize}
        total={groups.length}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
}
