"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Plus, FlaskConical, Library } from "lucide-react";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { SharedDashboardButton, SharedDashboardPageHeader } from "@/components/shares";
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

const VALID_TABS = new Set(["questions", "bulk-import", "ai-pipeline"]);

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
          icon={Library}
          badge={{ label: `${kpis.total} câu · ${kpis.topics} chủ đề` }}
          description="Quản lý kho câu hỏi dùng cho các bài đánh giá"
          actions={<>
          {canEdit && (
            <SharedDashboardButton variant="secondary" onClick={() => setAddDialogOpen(true)} leadingIcon={<Plus className="h-4 w-4" />}>
              Thêm câu hỏi
            </SharedDashboardButton>
          )}
          <Link href="/dashboard/create?source=bank">
            <SharedDashboardButton
              variant="primary"
              aria-label="Create test from Question Bank"
              leadingIcon={<FlaskConical className="h-4 w-4" />}
            >
              Create Test
            </SharedDashboardButton>
          </Link>
          </>}
        />

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <TabsList className="mb-6">
            <TabsTrigger value="questions">Questions</TabsTrigger>
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
