"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, FlaskConical } from "lucide-react";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { SharedDashboardPageHeader } from "@/components/shares";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import QuestionFormDialog from "@/components/question-bank/question-form-dialog";
import QuestionBankQuestionsTab from "./question-bank-questions-tab";
import QuestionBankBulkImportTab from "./question-bank-bulk-import-tab";
import QuestionBankAiPipelineTab from "./question-bank-ai-pipeline-tab";

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
}

const VALID_TABS = new Set(["questions", "add", "bulk-import", "ai-pipeline"]);

export default function QuestionBankClient({ kpis, topics, canEdit }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const activeTab = tabFromUrl && VALID_TABS.has(tabFromUrl) ? tabFromUrl : "questions";

  const [questionsRefreshKey, setQuestionsRefreshKey] = useState(0);
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  // Mutate ?tab=... while preserving AI Pipeline params when leaving the tab keeps them resumable.
  const handleTabChange = useCallback(
    (next: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (next === "questions") params.delete("tab");
      else params.set("tab", next);
      const qs = params.toString();
      router.replace(qs ? `?${qs}` : "?", { scroll: false });
    },
    [router, searchParams]
  );

  function handleAiApproved() {
    setQuestionsRefreshKey((k) => k + 1);
    setTimeout(() => handleTabChange("questions"), 1500);
  }

  return (
    <div className="bg-transparent text-foreground pb-12">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Question Bank" }]} />

        <SharedDashboardPageHeader
          title="Ngân hàng câu hỏi"
          description="Quản lý kho câu hỏi dùng cho các bài đánh giá"
          actions={<>
          <Link href="/dashboard/create?source=bank">
            <Button
              className="bg-success/15 border border-border/35 text-success hover:bg-success/25 rounded-xl h-10 px-4 gap-2"
              aria-label="Create test from Question Bank"
            >
              <FlaskConical className="w-4 h-4" />
              Create Test
            </Button>
          </Link>
          </>}
        />

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="questions">Questions</TabsTrigger>
            {canEdit && <TabsTrigger value="add">Add Question</TabsTrigger>}
            {canEdit && <TabsTrigger value="bulk-import">Bulk Import</TabsTrigger>}
            {canEdit && <TabsTrigger value="ai-pipeline">AI Pipeline</TabsTrigger>}
          </TabsList>

          <TabsContent value="questions">
            <QuestionBankQuestionsTab
              kpis={kpis}
              topics={topics}
              canEdit={canEdit}
              refreshKey={questionsRefreshKey}
            />
          </TabsContent>

          {canEdit && (
            <TabsContent value="add">
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-sm text-muted-foreground">Create a new question for the bank.</p>
                <Button
                  onClick={() => setAddDialogOpen(true)}
                  className="bg-success hover:bg-success text-white h-12 px-8 rounded-xl shadow-lg shadow-success/20 transition-all font-semibold gap-2 border-0"
                >
                  <Plus className="w-5 h-5" /> Add Question
                </Button>
              </div>
            </TabsContent>
          )}

          {canEdit && (
            <TabsContent value="bulk-import">
              <QuestionBankBulkImportTab />
            </TabsContent>
          )}

          {canEdit && (
            <TabsContent value="ai-pipeline">
              <QuestionBankAiPipelineTab onApproved={handleAiApproved} />
            </TabsContent>
          )}
        </Tabs>
      </PageContainer>

      <QuestionFormDialog
        open={addDialogOpen}
        onOpenChange={(open) => setAddDialogOpen(open)}
        onSuccess={() => {
          setQuestionsRefreshKey((k) => k + 1);
          setAddDialogOpen(false);
        }}
        editData={null}
      />
    </div>
  );
}
