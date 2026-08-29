"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { Button } from "@/components/ui/button";
import { Plus, Zap, TrendingUp, AlertTriangle, Download, LayoutList, LayoutGrid, Grid3X3, FilePlus2 } from "lucide-react";
import KpiCardGrid from "@/components/crm/kpi-card-grid";
import FilterBar from "@/components/crm/filter-bar";
import SkillFormDialog from "@/components/management/skill-form-dialog";
import CreateTestFromSkills from "@/components/tests/create-test-from-skills";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import SkillsTableView from "./skills-table-view";
import SkillsCategoryView from "./skills-category-view";
import SkillsMatrixView from "./skills-matrix-view";
import { toast } from "sonner";
import type { SkillListItem } from "@/app/dashboard/management-types";
import type { SkillCategory, SkillKpis } from "./page";
import type { KpiCardData, FilterOption } from "@/lib/crm/types";

type ViewMode = "table" | "category" | "matrix";

interface Props {
  skills: SkillListItem[];
  categories: SkillCategory[];
  isAdmin: boolean;
  kpis: SkillKpis;
}

export const CATEGORY_COLORS: Record<string, string> = {
  "Technical Skills":  "border-blue-500/30 text-blue-400 bg-blue-500/10",
  "Business Analysis": "border-purple-500/30 text-purple-400 bg-purple-500/10",
  "Communication":     "border-green-500/30 text-green-400 bg-green-500/10",
  "Soft Skills":       "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
  "Domain Knowledge":  "border-orange-500/30 text-orange-400 bg-orange-500/10",
};
export const FALLBACK_COLOR = "border-[#8B99B0]/20 text-[#8B99B0] bg-[#8B99B0]/10";

export function categoryColor(name: string | null) {
  if (!name) return FALLBACK_COLOR;
  return CATEGORY_COLORS[name] ?? FALLBACK_COLOR;
}

const VIEW_OPTIONS = [
  { mode: "table" as ViewMode, icon: LayoutList, label: "Table" },
  { mode: "category" as ViewMode, icon: LayoutGrid, label: "Category" },
  { mode: "matrix" as ViewMode, icon: Grid3X3, label: "Matrix" },
];

export default function SkillsListClient({ skills: initialSkills, categories, isAdmin, kpis }: Props) {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>("table");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [createTestOpen, setCreateTestOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SkillListItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const filtered = useMemo(() => {
    return initialSkills.filter((s) => {
      if (categoryFilter && s.category !== categoryFilter) return false;
      if (!search) return true;
      return s.name.toLowerCase().includes(search.toLowerCase());
    });
  }, [initialSkills, search, categoryFilter]);

  const kpiItems: KpiCardData[] = [
    { label: "Total Skills", value: kpis.totalSkills, icon: Zap },
    { label: "Most Demanded", value: kpis.mostDemandedSkill, icon: TrendingUp },
    { label: "Unmapped Skills", value: kpis.unmappedCount, icon: AlertTriangle },
    { label: "Skill Gaps", value: kpis.shortageCount, icon: AlertTriangle },
  ];

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
  const clearAll = () => { setSearch(""); setCategoryFilter(""); };

  return (
    <div className="bg-transparent text-[#ECF0F7] pb-12">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Skills" }]} />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
          <div className="space-y-1">
            <h1 className="text-4xl font-extralight tracking-tight text-[#ECF0F7] font-display">Skill Intelligence</h1>
            <p className="text-sm text-[#5A6882] font-light">Map your organizational capabilities and identify strategic growth vectors</p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button
                onClick={handleExportCsv}
                disabled={exporting}
                variant="outline"
                className="h-12 px-6 rounded-xl border border-white/5 bg-white/5 text-[#8B99B0] hover:text-[#ECF0F7] hover:bg-white/10 gap-2 transition-all"
              >
                <Download className="w-4 h-4" />{exporting ? "Exporting..." : "Export CRM"}
              </Button>
            )}
            <Button
              onClick={() => setCreateTestOpen(true)}
              variant="outline"
              className="h-12 px-6 rounded-xl border border-[#10B981]/35 bg-[#10B981]/10 text-[#10B981] hover:bg-[#10B981]/20 gap-2 transition-all font-semibold"
            >
              <FilePlus2 className="w-5 h-5" /> Tạo bộ test
            </Button>
            <Button
              onClick={() => setDialogOpen(true)}
              className="bg-[#7C8FFF] hover:bg-[#5B6CF0] text-white h-12 px-8 rounded-xl shadow-lg shadow-[#7C8FFF]/20 transition-all font-semibold gap-2 border-0"
            >
              <Plus className="w-5 h-5" /> Add New Skill
            </Button>
          </div>
        </div>

        <KpiCardGrid items={kpiItems} />

        <div className="flex items-center justify-between gap-3 mt-6 mb-4">
          <FilterBar
            search={search}
            onSearchChange={setSearch}
            filters={[
              { key: "category", label: "Category", options: categoryOptions, value: categoryFilter, onChange: setCategoryFilter },
            ]}
            onClearAll={clearAll}
          />
          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#1B253B] border border-[#8B99B0]/10 shrink-0">
            {VIEW_OPTIONS.map(({ mode, icon: Icon, label }) => (
              <button
                key={mode}
                aria-label={label}
                onClick={() => setView(mode)}
                className={`p-1.5 rounded transition-colors ${view === mode ? "bg-[#7C8FFF] text-white" : "text-[#5A6882] hover:text-[#ECF0F7] hover:bg-[#222C4A]"}`}
              >
                <Icon className="w-4 h-4" />
              </button>
            ))}
          </div>
        </div>

        {view === "table" && (
          <SkillsTableView
            data={filtered}
            onRowClick={handleRowClick}
            onEdit={openEdit}
            onDelete={handleDelete}
            deletingId={deletingId}
          />
        )}
        {view === "category" && (
          <SkillsCategoryView
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
          className="max-w-3xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto bg-[#101828] ring-[#7C8FFF]/15"
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
