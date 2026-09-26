"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { Button } from "@/components/ui/button";
import { Plus, Zap, Download, LayoutList, LayoutGrid, Grid3X3, FilePlus2, X } from "lucide-react";
import { SharedDashboardPageHeader } from "@/components/shares";
import FilterBar from "@/components/crm/filter-bar";
import SkillFormDialog from "@/components/management/skill-form-dialog";
import CreateTestFromSkills from "@/components/tests/create-test-from-skills";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import SkillsTableView from "./skills-table-view";
import SkillsCategoryView from "./skills-category-view";
import SkillsMatrixView from "./skills-matrix-view";
import SupplyDemandMap from "./supply-demand-map";
import { toast } from "sonner";
import type { SkillListItem } from "@/app/dashboard/management-types";
import type { SkillCategory, SkillKpis } from "./page";
import type { FilterOption } from "@/lib/crm/types";
import { toneAt, toneFor } from "@/lib/ui/tones";

type ViewMode = "table" | "category" | "matrix";

interface Props {
  skills: SkillListItem[];
  categories: SkillCategory[];
  isAdmin: boolean;
  kpis: SkillKpis;
}

/* Tông theo thứ tự nhóm trong DB (display_order) → mỗi nhóm một màu, không trùng như hash. */
export function categoryTone(name: string | null, order: string[]) {
  const i = name ? order.indexOf(name) : -1;
  return i >= 0 ? toneAt(i) : toneFor(name ?? "");
}
export function categoryStyle(name: string | null, order: string[]): React.CSSProperties {
  if (!name) return { color: "var(--muted-foreground)", backgroundColor: "var(--muted)", borderColor: "transparent" };
  const t = categoryTone(name, order);
  return { color: t.ink, backgroundColor: t.bg, borderColor: "transparent" };
}

const VIEW_OPTIONS = [
  { mode: "table" as ViewMode, icon: LayoutList, label: "Table" },
  { mode: "category" as ViewMode, icon: LayoutGrid, label: "Category" },
  { mode: "matrix" as ViewMode, icon: Grid3X3, label: "Matrix" },
];

export default function SkillsListClient({ skills: initialSkills, categories, isAdmin }: Props) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createTestOpen, setCreateTestOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SkillListItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [mapPick, setMapPick] = useState<{ key: string; ids: Set<string> } | null>(null);

  const filtered = useMemo(() => {
    return initialSkills.filter((s) => {
      if (mapPick && !mapPick.ids.has(s.id)) return false;
      if (categoryFilter && s.category !== categoryFilter) return false;
      if (!search) return true;
      return s.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [initialSkills, search, categoryFilter, mapPick]);

  const categoryOrder = categories.map((c) => c.name);
  const categoryOptions: FilterOption[] = categories.map((c) => ({ value: c.name, label: c.name }));

  async function handleDelete(id: string) {
    if (!confirm("Delete this skill?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/skills/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Skill deleted");
      router.refresh();
    } catch {
      toast.error("Failed to delete skill");
    } finally {
      setDeletingId(null);
    }
  }

  async function handleExportCsv() {
    setExporting(true);
    try {
      const res = await fetch("/api/export/skills?format=csv");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `skills-export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Skills exported");
    } catch {
      toast.error("Export failed");
    } finally {
      setExporting(false);
    }
  }

  function openEdit(skill: SkillListItem) {
    setEditTarget(skill);
    setDialogOpen(true);
  }

  function handleDialogClose(open: boolean) {
    setDialogOpen(open);
    if (!open) setEditTarget(null);
  }

  const handleRowClick = (s: SkillListItem) => router.push(`/dashboard/skills/${s.id}`);
  const clearAll = () => { setSearch(""); setCategoryFilter(""); setMapPick(null); };

  return (
    <div className="bg-transparent text-foreground pb-12">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Skills" }]} />
        <SharedDashboardPageHeader
          title="Bản đồ kỹ năng"
          icon={Zap}
          badge={{ label: `${initialSkills.length} kỹ năng` }}
          description="Năng lực hiện có của tổ chức và những kỹ năng đang thiếu so với yêu cầu vị trí"
          actions={<>
            {isAdmin && (
              <Button
                onClick={handleExportCsv}
                disabled={exporting}
                variant="outline"
                className="h-12 px-6 rounded-xl border border-border bg-muted text-muted-foreground hover:text-foreground hover:bg-muted gap-2 transition-all"
              >
                <Download className="w-4 h-4" />{exporting ? "Exporting..." : "Export CRM"}
              </Button>
            )}
            <Button
              onClick={() => setCreateTestOpen(true)}
              variant="outline"
              className="h-12 px-6 rounded-xl border border-border/35 bg-success/10 text-success hover:bg-success/20 gap-2 transition-all font-semibold"
            >
              <FilePlus2 className="w-5 h-5" /> Tạo bộ test
            </Button>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-primary hover:bg-primary text-white h-12 px-8 rounded-xl shadow-lg shadow-primary/20 transition-all font-semibold gap-2 border-0"
            >
              <Plus className="w-5 h-5" /> Add New Skill
            </Button>
          </>}
        />

        <SupplyDemandMap
          categoryOrder={categoryOrder}
          skills={initialSkills}
          selectedKey={mapPick?.key ?? null}
          onSelect={(key, ids) => setMapPick(key ? { key, ids: new Set(ids) } : null)}
        />

        <div className="flex items-center justify-between gap-3 mb-4">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            filters={[
              { key: "category", label: "Category", options: categoryOptions, value: categoryFilter, onChange: setCategoryFilter },
            ]}
            onClearAll={clearAll}
          />
          <div className="flex items-center gap-1 p-1 rounded-lg bg-muted border border-border/10 shrink-0">
            {VIEW_OPTIONS.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                aria-label={label}
                onClick={() => setView(mode)}
                className={`p-1.5 rounded transition-colors ${view === mode ? "bg-primary text-white" : "text-muted-foreground hover:text-foreground hover:bg-accent"}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {mapPick && (
          <button
            type="button"
            onClick={() => setMapPick(null)}
            className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold text-primary hover:bg-primary/15 cursor-pointer"
          >
            Đang lọc {mapPick.ids.size} kỹ năng từ bản đồ <X className="w-3.5 h-3.5" />
          </button>
        )}

        {view === "table" && (
          <SkillsTableView
            categoryOrder={categoryOrder}
            data={filtered}
            onRowClick={handleRowClick}
            onEdit={openEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        )}
        {view === "category" && (
          <SkillsCategoryView
            categoryOrder={categoryOrder}
            data={filtered}
            onCardClick={handleRowClick}
          />
        )}
        {view === "matrix" && (
          <SkillsMatrixView skills={filtered} />
        )}
      </PageContainer>

      <SkillFormDialog open={dialogOpen} onOpenChange={handleDialogClose} onSuccess={() => router.refresh()} editData={editTarget} />

      <Dialog open={createTestOpen} onOpenChange={setCreateTestOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-3xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto bg-background ring-primary/15"
        >
          <DialogTitle className="sr-only">Create test from skills</DialogTitle>
          <CreateTestFromSkills
            embedded
            onBack={() => setCreateTestOpen(false)}
            onCreated={(test) => {
              setCreateTestOpen(false);
              router.push(`/dashboard/tests/${test.id}`);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
