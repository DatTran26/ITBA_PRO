"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { SharedDashboardButton, SharedDashboardPageHeader } from "@/components/shares";
import { Plus, Briefcase } from "lucide-react";
import FilterBar from "@/components/crm/filter-bar";
import ViewSwitcher from "@/components/crm/view-switcher";
import PositionsTableView from "./positions-table-view";
import PositionsLanes from "./positions-lanes";
import PositionFormDialog from "@/components/management/position-form-dialog";
import { POSITION_STATUSES } from "@/lib/crm/constants";
import type { PositionListItem } from "@/app/dashboard/management-types";
import type { FilterOption } from "@/lib/crm/types";

interface Props { positions: PositionListItem[] }

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

  const statusOptions: FilterOption[] = Object.entries(POSITION_STATUSES).map(([k, v]) => ({ value: k, label: v.label }));
  const departments = [...new Set(positions.map((p) => p.department).filter(Boolean))] as string[];
  const deptOptions: FilterOption[] = departments.map((d) => ({ value: d, label: d }));

  const clearAll = () => { setSearch(""); setStatusFilter(""); setDeptFilter(""); };
  const handleRowClick = (p: PositionListItem) => router.push(`/dashboard/positions/${p.id}`);

  return (
    <div className="bg-transparent text-foreground pb-12">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Positions" }]} />
        <SharedDashboardPageHeader
          title="Positions"
          icon={Briefcase}
          badge={{ label: `${positions.length} vị trí · ${new Set(positions.map((p) => p.department).filter(Boolean)).size} phòng ban` }}
          description="Vị trí theo từng phòng ban, cấp độ mục tiêu và chuẩn kỹ năng"
          actions={(
            <SharedDashboardButton variant="primary" onClick={() => setDialogOpen(true)} leadingIcon={<Plus className="h-4 w-4" />}>
              New Position
            </SharedDashboardButton>
          )}
        />

        <div className="flex items-center justify-between gap-3 mb-6">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Tìm vị trí, phòng ban..."
            filters={[
              { key: "status", label: "Status", options: statusOptions, value: statusFilter, onChange: setStatusFilter },
              { key: "dept", label: "Department", options: deptOptions, value: deptFilter, onChange: setDeptFilter },
            ]}
            onClearAll={clearAll}
          />
          <ViewSwitcher value={view} onChange={(v) => setView(v as ViewMode)} views={["card", "table"]} />
        </div>

        {view === "card" && <PositionsLanes data={filtered} onOpen={handleRowClick} />}
        {view === "table" && <PositionsTableView data={filtered} onRowClick={handleRowClick} />}
      </PageContainer>

      <PositionFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={() => router.refresh()} />
    </div>
  );
}
