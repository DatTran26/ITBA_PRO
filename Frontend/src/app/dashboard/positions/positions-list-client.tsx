"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { SharedDashboardButton, SharedDashboardPageHeader } from "@/components/shares";
import { Plus, Briefcase, AlertTriangle, Users, FileX, Archive } from "lucide-react";
import KpiCardGrid from "@/components/crm/kpi-card-grid";
import FilterBar from "@/components/crm/filter-bar";
import ViewSwitcher from "@/components/crm/view-switcher";
import PositionsTableView from "./positions-table-view";
import PositionsCardView from "./positions-card-view";
import PositionFormDialog from "@/components/management/position-form-dialog";
import { POSITION_STATUSES } from "@/lib/crm/constants";
import type { PositionListItem } from "@/app/dashboard/management-types";
import type { KpiCardData, FilterOption } from "@/lib/crm/types";

interface Props { positions: PositionListItem[] }

function getReqCount(pos: PositionListItem): number {
  const r = pos.position_skill_requirements;
  if (Array.isArray(r)) return r[0]?.count ?? 0;
  return (r as { count: number })?.count ?? 0;
}

type ViewMode = "card" | "table";

export default function PositionsListClient({ positions }: Props) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("card");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const filtered = useMemo(() => {
    return positions.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (deptFilter && p.department !== deptFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || (p.department ?? "").toLowerCase().includes(q);
    });
  }, [positions, search, statusFilter, deptFilter]);

  const kpis: KpiCardData[] = useMemo(() => [
    { label: "Total Positions", value: positions.length, icon: Briefcase },
    { label: "Active", value: positions.filter((p) => p.status === "active").length, icon: Briefcase },
    { label: "No Skill Reqs", value: positions.filter((p) => getReqCount(p) === 0).length, icon: AlertTriangle },
    { label: "Unassigned", value: positions.filter((p) => !p.assigned_persons_count).length, icon: Users },
    { label: "Archived", value: positions.filter((p) => p.status === "archived" || p.status === "deprecated").length, icon: Archive },
  ], [positions]);

  const statusOptions: FilterOption[] = Object.entries(POSITION_STATUSES).map(([k, v]) => ({ value: k, label: v.label }));
  const departments = [...new Set(positions.map((p) => p.department).filter(Boolean))] as string[];
  const deptOptions: FilterOption[] = departments.map((d) => ({ value: d, label: d }));

  const clearAll = () => { setSearch(""); setStatusFilter(""); setDeptFilter(""); };
  const handleRowClick = (p: PositionListItem) => router.push(`/dashboard/positions/${p.id}`);

  return (
    <div className="bg-transparent text-[#ECF0F7] pb-12">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Positions" }]} />
        <SharedDashboardPageHeader
          className="mb-10"
          title="Role Intelligence"
          description="Structure your organization with precision-defined roles and skill benchmarks"
          actions={(
            <SharedDashboardButton
              onClick={() => setDialogOpen(true)}
              className="bg-[#7C8FFF] hover:bg-[#5B6CF0] text-white h-12 px-8 rounded-xl shadow-lg shadow-[#7C8FFF]/20 transition-all font-semibold gap-2 border-0"
              leadingIcon={<Plus className="h-5 w-5" />}
            >
              New Position
            </SharedDashboardButton>
          )}
        />

        <KpiCardGrid items={kpis} />

        <div className="flex items-center justify-between gap-3 mt-6 mb-4">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            filters={[
              { key: "status", label: "Status", options: statusOptions, value: statusFilter, onChange: setStatusFilter },
              { key: "dept", label: "Department", options: deptOptions, value: deptFilter, onChange: setDeptFilter },
            ]}
            onClearAll={clearAll}
          />
          <ViewSwitcher value={view} onChange={(v) => setView(v as ViewMode)} views={["card", "table"]} />
        </div>

        {view === "card" && <PositionsCardView data={filtered} onCardClick={handleRowClick} />}
        {view === "table" && <PositionsTableView data={filtered} onRowClick={handleRowClick} />}
      </PageContainer>

      <PositionFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={() => router.refresh()} />
    </div>
  );
}
