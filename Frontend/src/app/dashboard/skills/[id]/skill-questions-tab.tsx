"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import QuestionBankTable from "@/components/question-bank/question-bank-table";
import QuestionFormDialog from "@/components/question-bank/question-form-dialog";
import { toast } from "sonner";
import type { QuestionRow } from "@/components/question-bank/question-bank-types";

interface Props {
  skillId: string;
  canEdit: boolean;
  refreshKey: number;
  onRequestMore: () => void;
}

const LIMIT = 20;

// Lists questions scoped to a single skill, reusing the global QB table + form dialog.
export default function SkillQuestionsTab({ skillId, canEdit, refreshKey, onRequestMore }: Props) {
  const [data, setData] = useState<QuestionRow[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<QuestionRow | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchData = useCallback(
    async (p: number) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ page: String(p), limit: String(LIMIT), skillId });
        const res = await fetch(`/api/question-bank?${params}`);
        const json = await res.json();
        setData(json.data ?? []);
        setTotal(json.total ?? 0);
      } catch {
        toast.error("Failed to load questions");
      } finally {
        setLoading(false);
      }
    },
    [skillId]
  );

  useEffect(() => {
    fetchData(page);
  }, [page, fetchData, refreshKey]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this question?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/question-bank/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Question deleted");
      fetchData(page);
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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-[#8B99B0]">
          {total} question{total !== 1 ? "s" : ""} for this skill
        </p>
        <div className="flex gap-2">
          {canEdit && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setEditTarget(null); setDialogOpen(true); }}
              className="border-[#8B99B0]/20 text-[#8B99B0] hover:text-[#ECF0F7]"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add Question
            </Button>
          )}
          {canEdit && (
            <Button
              size="sm"
              onClick={onRequestMore}
              className="bg-[#10B981] hover:bg-[#0D9E6E] text-white border-0"
            >
              <Sparkles className="w-3.5 h-3.5 mr-1.5" />
              Tạo thêm
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="border border-[#8B99B0]/10 rounded-lg flex items-center justify-center py-16">
          <p className="text-sm text-[#5A6882]">Loading...</p>
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
        onSuccess={() => fetchData(page)}
        editData={editTarget}
        skillId={skillId}
      />
    </div>
  );
}
