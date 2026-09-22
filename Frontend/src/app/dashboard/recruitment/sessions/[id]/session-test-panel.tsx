"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Link2, Plus, Unlink, X } from "lucide-react";
import { toast } from "sonner";
import { CreateTestWorkbench } from "@/components/tests/create-test-workbench";
import Link from "next/link";
import TestDetailClient from "@/app/dashboard/tests/[id]/test-detail-client";

type TestOption = {
  id: string;
  title: string | null;
  job_role: string;
  level: string;
  share_token: string;
  status: string;
  target_type?: string | null;
};

type SessionTest = {
  id: string;
  title?: string | null;
  job_role?: string | null;
  share_token?: string;
  status?: string;
} | null;

interface Props {
  sessionId: string;
  currentTest: SessionTest;
  onUpdated: () => void;
}

export default function SessionTestPanel({ sessionId, currentTest, onUpdated }: Props) {
  const [tests, setTests] = useState<TestOption[]>([]);
  const [selected, setSelected] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastCreatedTestId, setLastCreatedTestId] = useState<string | null>(null);
  const [drawerMode, setDrawerMode] = useState<"create" | "view">("create");
  const [viewTest, setViewTest] = useState<unknown | null>(null);
  const [viewLoading, setViewLoading] = useState(false);

  const [openQuickCreate, setOpenQuickCreate] = useState(false);

  const openQuickCreatePanel = () => {
    setDrawerMode("create");
    setOpenQuickCreate(true);
  };

  const fetchTests = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/tests");
      const data = response.ok ? await response.json() : null;
      setTests((data?.tests ?? []).filter((test: TestOption) => !test.target_type || test.target_type === "candidate"));
    } catch {
      toast.error("Không tải được danh sách test");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, []);

  const attachById = async (testId: string | null) => {
    const response = await fetch(`/api/recruitment/sessions/${sessionId}/test`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ testId }),
    });
    const json = await response.json();
    if (!response.ok) throw new Error(json.error ?? "Không cập nhật được session test");
    return json;
  };

  const attachTest = async () => {
    if (!selected) {
      toast.error("Hãy chọn test để gắn");
      return;
    }
    setSaving(true);
    try {
      await attachById(selected);
      toast.success("Đã gắn test vào session");
      onUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gắn test thất bại");
    } finally {
      setSaving(false);
    }
  };

  const detachTest = async () => {
    setSaving(true);
    try {
      await attachById(null);
      toast.success("Đã gỡ test khỏi session");
      onUpdated();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gỡ test thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickCreated = async (test: { id: string }) => {
    await attachById(test.id);
    await fetchTests();
    setSelected(test.id);
    setLastCreatedTestId(test.id);
    setDrawerMode("view");
    await loadTestForView(test.id);
    onUpdated();
    toast.success("Đã tạo và gắn test vào session");
  };

  const loadTestForView = async (testId: string) => {
    setViewLoading(true);
    try {
      const response = await fetch(`/api/tests/${testId}`);
      const json = await response.json().catch(() => null);
      if (!response.ok || !json?.test) {
        toast.error(json?.error ?? "Không tải được chi tiết bài test");
        return;
      }
      setViewTest(json.test);
    } finally {
      setViewLoading(false);
    }
  };

  const openViewInDrawer = async (testId: string) => {
    setOpenQuickCreate(true);
    setDrawerMode("view");
    await loadTestForView(testId);
  };

  const currentLink = useMemo(
    () => (currentTest?.share_token ? `${window.location.origin}/test/${currentTest.share_token}` : null),
    [currentTest?.share_token]
  );

  return (
    <>
      <div className="space-y-3">
        <p className="text-xs text-muted-foreground">Test dùng trong buổi phỏng vấn. Candidate không nhận email tự động.</p>

        {currentTest ? (
          <div className="rounded-lg border border-border/25 bg-success/10 p-3">
            <p className="text-sm font-medium text-foreground">{currentTest.title ?? currentTest.job_role ?? "Session Test"}</p>
            <p className="text-xs text-muted-foreground">Status: {currentTest.status ?? "active"}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {currentLink && (
                <button onClick={() => navigator.clipboard.writeText(currentLink).then(() => toast.success("Đã copy test link"))} className="inline-flex items-center gap-2 rounded-md border border-border/40 bg-primary/10 px-2.5 py-1.5 text-xs text-primary hover:bg-primary/20">
                  <Link2 className="h-3.5 w-3.5" /> Copy test link
                </button>
              )}
              {lastCreatedTestId && (
                <button
                  onClick={() => openViewInDrawer(lastCreatedTestId)}
                  className="inline-flex items-center gap-2 rounded-md border border-border/35 bg-success/10 px-2.5 py-1.5 text-xs text-success hover:bg-success/20"
                >
                  Xem trực tiếp trong drawer
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-border/20 bg-background p-3 text-xs text-muted-foreground">Chưa gắn test cho session này.</div>
        )}

        {loading ? (
          <div className="flex justify-center py-3"><Loader2 className="h-4 w-4 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-2">
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <select value={selected} onChange={(event) => setSelected(event.target.value)} className="w-full rounded-lg border border-border/15 bg-background px-3 py-2 text-sm text-foreground focus:border-border/50 focus:outline-none">
                <option value="">-- Chọn test candidate --</option>
                {tests.map((test) => (
                  <option key={test.id} value={test.id}>{test.title ?? test.job_role} ({test.level})</option>
                ))}
              </select>
              <button onClick={openQuickCreatePanel} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/40 bg-primary/10 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/20">
                <Plus className="h-4 w-4" /> Tạo nhanh
              </button>
            </div>

            <div className="flex gap-2">
              <button onClick={attachTest} disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-50">
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />} Gắn test
              </button>
              <button onClick={detachTest} disabled={saving || !currentTest} className="inline-flex items-center justify-center gap-2 rounded-lg border border-border/40 bg-danger/10 px-3 py-2 text-sm font-medium text-danger disabled:opacity-50">
                <Unlink className="h-4 w-4" /> Gỡ
              </button>
            </div>
          </div>
        )}
      </div>

      {openQuickCreate && (
        <div className="fixed inset-x-0 bottom-0 top-12 z-50 bg-black/50 backdrop-blur-[2px]">
          <div className="absolute right-0 top-0 h-full w-full max-w-[72vw] border-l border-border/15 bg-background shadow-2xl">
            <div className="flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-border/12 px-6 py-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.18em] text-primary">Quick Create</p>
                  <h3 className="text-xl font-semibold text-foreground">{drawerMode === "create" ? "Tạo nhanh bộ test" : "Chi tiết bài test"}</h3>
                </div>
                <button onClick={() => setOpenQuickCreate(false)} className="rounded-lg p-2 text-muted-foreground hover:bg-muted-foreground/10 hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="flex items-center gap-2 border-b border-border/12 px-6 py-3">
                <button
                  onClick={() => setDrawerMode("create")}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${drawerMode === "create" ? "bg-primary/20 text-primary" : "text-muted-foreground hover:bg-muted-foreground/10"}`}
                >
                  Tạo nhanh
                </button>
                <button
                  onClick={() => {
                    if (lastCreatedTestId) {
                      setDrawerMode("view");
                      void loadTestForView(lastCreatedTestId);
                    }
                  }}
                  disabled={!lastCreatedTestId}
                  className={`rounded-lg px-3 py-1.5 text-xs font-medium ${drawerMode === "view" ? "bg-success/15 text-success" : "text-muted-foreground hover:bg-muted-foreground/10"} disabled:opacity-40`}
                >
                  Xem bài test
                </button>
                {lastCreatedTestId && (
                  <Link href={`/dashboard/tests/${lastCreatedTestId}`} target="_blank" rel="noreferrer" className="ml-auto text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline">
                    Mở tab mới
                  </Link>
                )}
              </div>

              <div className="flex-1 overflow-hidden px-4 pb-4 pt-4">
                <div className="h-full rounded-xl border border-border/12 bg-background">
                  {drawerMode === "create" ? (
                    <CreateTestWorkbench embedded onCreated={handleQuickCreated} />
                  ) : viewLoading ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground"><Loader2 className="mr-2 h-4 w-4 animate-spin" />Đang tải chi tiết bài test...</div>
                  ) : viewTest ? (
                    <TestDetailClient embedded test={viewTest as Parameters<typeof TestDetailClient>[0]["test"]} generationContext={{ job_description: null, test_description: null }} />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Chưa có bài test để hiển thị.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
