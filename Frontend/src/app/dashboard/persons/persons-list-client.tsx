"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { SharedDashboardButton, SharedDashboardPageHeader } from "@/components/shares";
import { Plus, Users, Trash2, Tag } from "lucide-react";
import FilterBar from "@/components/crm/filter-bar";
import ViewSwitcher from "@/components/crm/view-switcher";
import BulkActionBar from "@/components/crm/bulk-action-bar";
import PersonsTableView from "./persons-table-view";
import PersonsCardView from "./persons-card-view";
import PersonsKanbanView from "./persons-kanban-view";
import PersonFormDialog from "@/components/management/person-form-dialog";
import { PERSON_STATUSES } from "@/lib/crm/constants";
import type { PersonListItem } from "@/app/dashboard/management-types";
import type { FilterOption } from "@/lib/crm/types";

interface Props { persons: PersonListItem[] }

type ViewMode = "table" | "card" | "kanban";

export default function PersonsListClient({ persons }: Props) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("kanban");
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

  const countType = (t: string) => persons.filter((p) => !t || p.type === t).length;

  /* Filter options */
  const statusOptions: FilterOption[] = Object.entries(PERSON_STATUSES).map(([k, v]) => ({ value: k, label: v.label }));

  const clearAll = () => { setSearch(""); setStatusFilter(""); setTypeFilter(""); };

  const handleRowClick = (p: PersonListItem) => router.push(`/dashboard/persons/${p.id}`);

  /* Bulk actions */
  const bulkActions = [
    { label: "Add Tag", icon: Tag, onClick: () => { /* TODO: bulk tag */ } },
    { label: "Delete", icon: Trash2, onClick: () => { /* TODO: bulk delete */ }, variant: "destructive" as const },
  ];

  return (
    <div className="bg-transparent text-foreground pb-12">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Persons" }]} />
        <SharedDashboardPageHeader
          title="People CRM"
          icon={Users}
          badge={{ label: `${countType("employee")} nhân viên · ${countType("candidate")} ứng viên` }}
          description="Mỗi người đang ở đâu trong lộ trình: đang làm, cần đào tạo, thiếu kỹ năng hay sẵn sàng thăng tiến"
          actions={(
            <SharedDashboardButton
              onClick={() => setDialogOpen(true)}
              className="bg-primary hover:bg-primary text-white h-12 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all font-semibold gap-2 border-0"
              leadingIcon={<Plus className="h-5 w-5" />}
            >
              Add New Entry
            </SharedDashboardButton>
          )}
        />

        <div className="flex items-center gap-3 mb-6">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            filters={[
              { key: "status", label: "Status", options: statusOptions, value: statusFilter, onChange: setStatusFilter },
            ]}
            onClearAll={clearAll}
          />
          <div className="flex p-1 rounded-xl bg-card border border-border shrink-0">
            {[["", "Tất cả"], ["employee", "Nhân viên"], ["candidate", "Ứng viên"]].map(([v, l]) => (
              <button key={v} type="button" onClick={() => setTypeFilter(v)} aria-pressed={typeFilter === v}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${typeFilter === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {l}<span className="tabular-nums opacity-70">{countType(v)}</span>
              </button>
            ))}
          </div>
          <div className="flex-1" />
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
