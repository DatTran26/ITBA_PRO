"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { SharedDashboardButton, SharedDashboardPageHeader } from "@/components/shares";
import { Plus, Users, AlertTriangle, UserCheck, UserX, Briefcase, FolderKanban, Trash2, Tag } from "lucide-react";
import KpiCardGrid from "@/components/crm/kpi-card-grid";
import FilterBar from "@/components/crm/filter-bar";
import ViewSwitcher from "@/components/crm/view-switcher";
import BulkActionBar from "@/components/crm/bulk-action-bar";
import PersonsTableView from "./persons-table-view";
import PersonsCardView from "./persons-card-view";
import PersonsKanbanView from "./persons-kanban-view";
import PersonFormDialog from "@/components/management/person-form-dialog";
import { PERSON_STATUSES } from "@/lib/crm/constants";
import type { PersonListItem } from "@/app/dashboard/management-types";
import type { KpiCardData, FilterOption } from "@/lib/crm/types";

interface Props { persons: PersonListItem[] }

type ViewMode = "table" | "card" | "kanban";

export default function PersonsListClient({ persons }: Props) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  /* Filter logic */
  const filtered = useMemo(() => {
    return persons.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (typeFilter && p.type !== typeFilter) return false;
      if (!search) return true;
      const q = search.toLowerCase();
      return p.full_name.toLowerCase().includes(q) || (p.email ?? "").toLowerCase().includes(q);
    });
  }, [persons, search, statusFilter, typeFilter]);

  /* KPIs */
  const kpis: KpiCardData[] = useMemo(() => [
    { label: "Total Persons", value: persons.length, icon: Users },
    { label: "Active", value: persons.filter((p) => p.status === "active").length, icon: UserCheck },
    { label: "Skill Gaps", value: persons.filter((p) => p.status === "skill_gap").length, icon: AlertTriangle },
    { label: "In Review", value: persons.filter((p) => p.status === "in_review").length, icon: Briefcase },
    { label: "No Group", value: persons.filter((p) => !p.group_names?.length).length, icon: FolderKanban },
    { label: "No Position", value: persons.filter((p) => !p.position_id).length, icon: UserX },
  ], [persons]);

  /* Filter options */
  const statusOptions: FilterOption[] = Object.entries(PERSON_STATUSES).map(([k, v]) => ({ value: k, label: v.label }));
  const typeOptions: FilterOption[] = [{ value: "candidate", label: "Candidate" }, { value: "employee", label: "Employee" }];

  const clearAll = () => { setSearch(""); setStatusFilter(""); setTypeFilter(""); };

  const handleRowClick = (p: PersonListItem) => router.push(`/dashboard/persons/${p.id}`);

  /* Bulk actions */
  const bulkActions = [
    { label: "Add Tag", icon: Tag, onClick: () => { /* TODO: bulk tag */ } },
    { label: "Delete", icon: Trash2, onClick: () => { /* TODO: bulk delete */ }, variant: "destructive" as const },
  ];

  return (
    <div className="bg-transparent text-[#ECF0F7] pb-12">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Persons" }]} />
        <SharedDashboardPageHeader
          className="mb-10"
          title="People CRM"
          description="Orchestrate your talent pipeline and employee growth"
          actions={(
            <SharedDashboardButton
              onClick={() => setDialogOpen(true)}
              className="bg-[#7C8FFF] hover:bg-[#5B6CF0] text-white h-12 px-8 rounded-xl shadow-lg shadow-[#7C8FFF]/20 transition-all font-semibold gap-2 border-0"
              leadingIcon={<Plus className="h-5 w-5" />}
            >
              Add New Entry
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
              { key: "type", label: "Type", options: typeOptions, value: typeFilter, onChange: setTypeFilter },
            ]}
            onClearAll={clearAll}
          />
          <ViewSwitcher value={view} onChange={(v) => setView(v as ViewMode)} />
        </div>

        {view === "table" && (
          <PersonsTableView
            data={filtered}
            onRowClick={handleRowClick}
            selectedIds={selectedIds}
            onSelectChange={setSelectedIds}
          />
        )}
        {view === "card" && <PersonsCardView data={filtered} onCardClick={handleRowClick} />}
        {view === "kanban" && <PersonsKanbanView data={filtered} onCardClick={handleRowClick} />}

        <BulkActionBar selectedCount={selectedIds.size} actions={bulkActions} onClear={() => setSelectedIds(new Set())} />
      </PageContainer>

      <PersonFormDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={() => router.refresh()} />
    </div>
  );
}
