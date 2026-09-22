"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Layers, Brain, Tag } from "lucide-react";
import KpiCardGrid from "@/components/crm/kpi-card-grid";
import FilterBar from "@/components/crm/filter-bar";
import QuestionBankTable from "@/components/question-bank/question-bank-table";
import QuestionFormDialog from "@/components/question-bank/question-form-dialog";
import { toast } from "sonner";
import type { QuestionRow } from "@/components/question-bank/question-bank-types";
import type { KpiCardData, FilterOption } from "@/lib/crm/types";

interface Kpis {
  total: number;
  junior: number;
  middle: number;
  senior: number;
  topics: number;
}

interface Props {
  kpis: Kpis;
  topics: string[];
  canEdit: boolean;
  refreshKey: number;
}

const LIMIT = 20;

export default function QuestionBankQuestionsTab({ kpis, topics, canEdit, refreshKey }: Props) {
  const router = useRouter();
  const [data, setData] = useState<QuestionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [topicFilter, setTopicFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<QuestionRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(async (p: number, q: string, level: string, topic: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT) });
      if (q) params.set("q", q);
      if (level) params.set("level", level);
      if (topic) params.set("topic", topic);
      const res = await fetch(`/api/question-bank?${params}`);
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      toast.error("Failed to load questions");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(page, search, levelFilter, topicFilter);
  }, [page, search, levelFilter, topicFilter, fetchData, refreshKey]);

  function handleSearchChange(v: string) { setSearch(v); setPage(1); }
  function handleLevelChange(v: string) { setLevelFilter(v); setPage(1); }
  function handleTopicChange(v: string) { setTopicFilter(v); setPage(1); }
  function clearAll() { setSearch(""); setLevelFilter(""); setTopicFilter(""); setPage(1); }

  async function handleDelete(id: string) {
    if (!confirm("Delete this question?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/question-bank/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Question deleted");
      fetchData(page, search, levelFilter, topicFilter);
      router.refresh();
    } catch {
      toast.error("Failed to delete question");
    } finally {
      setDeletingId(null);
    }
  }

  function handleEdit(q: QuestionRow) {
    setEditTarget(q);
    setDialogOpen(true);
  }

  const kpiItems: KpiCardData[] = [
    { label: "Total Questions", value: kpis.total, icon: BookOpen, badge: "Toàn kho" },
    { label: "Junior", value: kpis.junior, icon: Layers, badge: "Cơ bản" },
    { label: "Middle", value: kpis.middle, icon: Brain, badge: "Trung cấp" },
    { label: "Senior", value: kpis.senior, icon: Brain, badge: "Nâng cao" },
    { label: "Topics", value: kpis.topics, icon: Tag, badge: "Chủ đề" },
  ];

  const levelOptions: FilterOption[] = [
    { value: "junior", label: "Junior" },
    { value: "middle", label: "Middle" },
    { value: "senior", label: "Senior" },
  ];
  const topicOptions: FilterOption[] = topics.map((t) => ({ value: t, label: t }));

  return (
    <div>
      <KpiCardGrid items={kpiItems} />

      <div className="mt-6 mb-4">
        <FilterBar
          search={search}
          searchPlaceholder="Tìm nội dung câu hỏi..."
          onSearchChange={handleSearchChange}
          filters={[
            { key: "level", label: "Level", options: levelOptions, value: levelFilter, onChange: handleLevelChange },
            { key: "topic", label: "Topic", options: topicOptions, value: topicFilter, onChange: handleTopicChange },
          ]}
          onClearAll={clearAll}
        />
      </div>

      {loading ? (
        <div className="border border-border/10 rounded-lg flex items-center justify-center py-16">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      ) : (
        <QuestionBankTable
          data={data}
          total={total}
          page={page}
          limit={LIMIT}
          onPageChange={setPage}
          onEdit={handleEdit}
          onDelete={handleDelete}
          deletingId={deletingId}
          canEdit={canEdit}
        />
      )}

      <QuestionFormDialog
        open={dialogOpen}
        onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditTarget(null); }}
        onSuccess={() => fetchData(page, search, levelFilter, topicFilter)}
        editData={editTarget}
      />
    </div>
  );
}
