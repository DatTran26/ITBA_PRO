"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { Button } from "@/components/ui/button";
import { Plus, FolderKanban, Users, ShieldAlert, CheckCircle } from "lucide-react";
import KpiCardGrid from "@/components/crm/kpi-card-grid";
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
    { label: "Total Groups", value: kpis.totalGroups, icon: FolderKanban },
    { label: "Total Members", value: kpis.totalMembers, icon: Users },
    { label: "Active Groups", value: kpis.activeGroups, icon: CheckCircle },
    { label: "At Risk", value: kpis.atRiskGroups, icon: ShieldAlert },
  ];

  const clearAll = () => { setSearch(""); setTypeFilter(""); };
  const handleRowClick = (g: GroupListItem) => router.push(`/dashboard/groups/${g.id}`);
  const handleEdit = (g: GroupListItem) => setEditTarget(g);

  return (
    <div className="bg-transparent text-[#ECF0F7] pb-12">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Groups" }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div className="space-y-1">
            <h1 className="text-4xl font-extralight tracking-tight text-[#ECF0F7] font-display">Team Workspaces</h1>
            <p className="text-sm text-[#5A6882] font-light">Structure your organization into departments, batches, and high-impact campaigns</p>
          </div>
          <Button
            onClick={() => setDialogOpen(true)}
            className="bg-[#7C8FFF] hover:bg-[#5B6CF0] text-white h-12 px-8 rounded-xl shadow-lg shadow-[#7C8FFF]/20 transition-all font-semibold gap-2 border-0"
          >
            <Plus className="w-5 h-5" /> Create New Group
          </Button>
        </div>

        <KpiCardGrid items={kpiCards} />

        <div className="flex items-center justify-between gap-3 mt-6 mb-4">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
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
