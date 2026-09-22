"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { SharedDashboardButton, SharedDashboardPageHeader } from "@/components/shares";
import { Plus, FolderKanban, Users, ShieldAlert, CheckCircle } from "lucide-react";
import KpiCardGrid from "@/components/crm/kpi-card-grid";
import OverviewBand from "@/components/shares/overview-band";
import { DonutStat, HBarList, colorAt } from "@/components/charts";
import { GROUP_STATUSES } from "@/lib/crm/constants";
import FilterBar from "@/components/crm/filter-bar";
import ViewSwitcher from "@/components/crm/view-switcher";
import GroupsCardView from "./groups-card-view";
import GroupsTableView from "./groups-table-view";
import GroupFormDialog from "@/components/management/group-form-dialog";
import type { GroupListItem, GroupKpis } from "@/app/dashboard/management-types";
import type { KpiCardData, FilterOption } from "@/lib/crm/types";

interface Props {
  groups: GroupListItem[];
  kpis: GroupKpis;
}

type ViewMode = "card" | "table";

function memberCount(g: GroupListItem) {
  const m = g.group_members;
  return Array.isArray(m) ? (m[0]?.count ?? 0) : (m?.count ?? 0);
}

const TYPE_OPTIONS: FilterOption[] = [
  { value: "department", label: "Department" },
  { value: "batch", label: "Batch" },
  { value: "campaign", label: "Campaign" },
  { value: "other", label: "Other" },
];

export default function GroupsListClient({ groups, kpis }: Props) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("card");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<GroupListItem | null>(null);

  const filtered = useMemo(() => {
    return groups.filter((g) => {
      if (typeFilter && g.type !== typeFilter) return false;
      if (!search) return true;
      return g.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [groups, search, typeFilter]);

  const kpiCards: KpiCardData[] = [
    { label: "Total Groups", value: kpis.totalGroups, icon: FolderKanban, badge: "Toàn bộ" },
    { label: "Total Members", value: kpis.totalMembers, icon: Users, badge: "Thành viên" },
    { label: "Active Groups", value: kpis.activeGroups, icon: CheckCircle, badge: "Đang hoạt động" },
    { label: "At Risk", value: kpis.atRiskGroups, icon: ShieldAlert, badge: "Cần xử lý" },
  ];

  /* Dải tổng quan: suy ra từ `groups` đã fetch, không thêm truy vấn. */
  const byStatus = useMemo(() => Object.entries(GROUP_STATUSES).map(([key, meta], i) => ({
    label: meta.label, value: groups.filter((g) => g.status === key).length, color: colorAt(i),
  })).filter((s) => s.value > 0), [groups]);

  const byType = useMemo(() => TYPE_OPTIONS.map((t, i) => ({
    label: t.label, value: groups.filter((g) => g.type === t.value).length, color: colorAt(i),
  })).filter((s) => s.value > 0), [groups]);

  const byMembers = useMemo(() => groups.map((g) => ({ label: g.name, value: memberCount(g) })), [groups]);

  const clearAll = () => { setSearch(""); setTypeFilter(""); };
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
          badge={{ label: `${groups.length} nhóm` }}
          description="Chia tổ chức thành phòng ban, đợt tuyển và các chiến dịch trọng điểm"
          actions={(
            <SharedDashboardButton variant="primary" onClick={() => setDialogOpen(true)} leadingIcon={<Plus className="h-4 w-4" />}>
              Create New Group
            </SharedDashboardButton>
          )}
        />

        <KpiCardGrid items={kpiCards} />

        {groups.length > 0 && (
          <OverviewBand className="mt-6">
            <DonutStat title="Sức khoẻ nhóm" subtitle="Phân bố theo trạng thái" tag={{ label: "Trạng thái" }} slices={byStatus} centerLabel="Nhóm" />
            <DonutStat title="Loại nhóm" subtitle="Phòng ban, đợt tuyển, chiến dịch" tag={{ label: "Cơ cấu", tone: "teal" }} slices={byType} centerLabel="Nhóm" />
            <HBarList title="Quy mô nhóm" subtitle="Số thành viên mỗi nhóm" tag={{ label: "Top nhóm", tone: "violet" }} items={byMembers} />
          </OverviewBand>
        )}

        <div className="flex items-center justify-between gap-3 mt-6 mb-4">
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

        {view === "card" && <GroupsCardView groups={filtered} onCardClick={handleRowClick} onEdit={handleEdit} />}
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
