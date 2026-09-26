"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { SharedDashboardButton, SharedDashboardPageHeader } from "@/components/shares";
import { Plus, FolderKanban } from "lucide-react";
import FilterBar from "@/components/crm/filter-bar";
import ViewSwitcher from "@/components/crm/view-switcher";
import GroupsBoard, { SeverityStrip, memberCount } from "./groups-board";
import GroupsTableView from "./groups-table-view";
import GroupFormDialog from "@/components/management/group-form-dialog";
import type { GroupListItem, GroupKpis, GroupStatus } from "@/app/dashboard/management-types";
import type { FilterOption } from "@/lib/crm/types";

interface Props {
  groups: GroupListItem[];
  kpis: GroupKpis;
}

type ViewMode = "card" | "table";

const TYPE_OPTIONS: FilterOption[] = [
  { value: "department", label: "Department" },
  { value: "batch", label: "Batch" },
  { value: "campaign", label: "Campaign" },
  { value: "other", label: "Other" },
];

export default function GroupsListClient({ groups }: Props) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("card");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<GroupStatus | "">("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GroupListItem | null>(null);

  const filtered = useMemo(() => {
    return groups.filter((g) => {
      if (statusFilter && g.status !== statusFilter) return false;
      if (typeFilter && g.type !== typeFilter) return false;
      if (!search) return true;
      return g.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [groups, search, typeFilter, statusFilter]);

  const clearAll = () => { setSearch(""); setTypeFilter(""); setStatusFilter(""); };
  const handleRowClick = (g: GroupListItem) => router.push(`/dashboard/groups/${g.id}`);
  const handleEdit = (g: GroupListItem) => setEditTarget(g);

  return (
    <div className="bg-transparent text-foreground pb-12">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Groups" }]} />
        <SharedDashboardPageHeader
          title="Groups"
          icon={FolderKanban}
          badge={{ label: `${groups.length} nhóm · ${groups.reduce((n, g) => n + memberCount(g), 0)} thành viên` }}
          description="Chia tổ chức thành phòng ban, đợt tuyển và các chiến dịch trọng điểm"
          actions={(
            <SharedDashboardButton variant="primary" onClick={() => setDialogOpen(true)} leadingIcon={<Plus className="h-4 w-4" />}>
              Create New Group
            </SharedDashboardButton>
          )}
        />

        {groups.length > 0 && <SeverityStrip groups={groups} value={statusFilter} onChange={setStatusFilter} />}

        <div className="flex items-center justify-between gap-3 mb-6">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Tìm theo tên nhóm..."
            filters={[
              { key: "type", label: "Type", options: TYPE_OPTIONS, value: typeFilter, onChange: setTypeFilter },
            ]}
            onClearAll={clearAll}
          />
          <ViewSwitcher value={view} onChange={(v) => setView(v as ViewMode)} views={["card", "table"]} />
        </div>

        {view === "card" && <GroupsBoard groups={filtered} onOpen={handleRowClick} onEdit={handleEdit} />}
        {view === "table" && <GroupsTableView groups={filtered} onRowClick={handleRowClick} onEdit={handleEdit} />}
      </PageContainer>

      <GroupFormDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); }}
        onSuccess={() => router.refresh()}
      />
      <GroupFormDialog
        open={!!editTarget}
        onOpenChange={(open) => { if (!open) setEditTarget(null); }}
        onSuccess={() => { setEditTarget(null); router.refresh(); }}
        editData={editTarget ?? undefined}
      />
    </div>
  );
}
