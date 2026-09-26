"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import SkillHeader from "./skill-header";
import SkillDistribution from "./skill-distribution";
import SkillPersonsTab from "./skill-persons-tab";
import SkillKnowledgeTab from "./skill-knowledge-tab";
import SkillQuestionsTab from "./skill-questions-tab";
import SkillFormDialog from "@/components/management/skill-form-dialog";
import CreateTestFromSkills from "@/components/tests/create-test-from-skills";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { SkillDetail, SkillListItem } from "@/app/dashboard/management-types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Props {
  skill: SkillDetail;
  isAdmin: boolean;
  canEdit: boolean;
}

const TABS = ["questions", "knowledge", "persons"] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = { questions: "Câu hỏi", knowledge: "Tri thức AI", persons: "Danh sách nhân sự" };

export default function SkillDetailClient({ skill, isAdmin, canEdit }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("questions");
  const [editOpen, setEditOpen] = useState(false);
  const [createTestOpen, setCreateTestOpen] = useState(false);
  // Bumped after a generation run approves questions, to refresh the Questions tab list.
  const [questionsRefreshKey, setQuestionsRefreshKey] = useState(0);

  /* Minimal SkillListItem shape for SkillFormDialog editData prop */
  const editData: SkillListItem = {
    id: skill.id,
    name: skill.name,
    category: skill.category,
    description: skill.description,
    created_at: skill.created_at,
    position_count: skill.position_requirements.length,
    person_count: skill.person_skills.length,
    demand_score: skill.position_requirements.length,
    shortage_score: Math.max(0, skill.position_requirements.length - skill.person_skills.length),
  };

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Skills", href: "/dashboard/skills" },
          { label: skill.name },
        ]} />

        <SkillHeader
          skill={skill}
          onEdit={() => setEditOpen(true)}
          onCreateTest={() => setCreateTestOpen(true)}
        />

        <SkillDistribution skill={skill} />

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className="mb-5 max-w-full overflow-x-auto justify-start [scrollbar-width:none]">
            {TABS.map((t) => (
              <TabsTrigger key={t} value={t}>
                {TAB_LABELS[t]}
                {t === "persons" && ` (${skill.person_skills.length})`}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {tab === "persons" && <SkillPersonsTab personSkills={skill.person_skills} />}
        {tab === "knowledge" && (
          <SkillKnowledgeTab
            skillId={skill.id}
            onApproved={() => setQuestionsRefreshKey((k) => k + 1)}
          />
        )}
        {tab === "questions" && (
          <SkillQuestionsTab
            skillId={skill.id}
            canEdit={canEdit}
            refreshKey={questionsRefreshKey}
            onRequestMore={() => setTab("knowledge")}
          />
        )}
      </PageContainer>

      <SkillFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => router.refresh()}
        editData={editData}
      />

      <Dialog open={createTestOpen} onOpenChange={setCreateTestOpen}>
        <DialogContent
          showCloseButton={false}
          className="max-w-3xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto bg-background ring-primary/15"
        >
          <DialogTitle className="sr-only">Create test from {skill.name}</DialogTitle>
          <CreateTestFromSkills
            embedded
            initialSkillIds={[skill.id]}
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
