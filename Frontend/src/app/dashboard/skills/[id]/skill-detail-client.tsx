"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import SkillHeader from "./skill-header";
import SkillOverviewTab from "./skill-overview-tab";
import SkillPositionsTab from "./skill-positions-tab";
import SkillPersonsTab from "./skill-persons-tab";
import SkillAnalyticsTab from "./skill-analytics-tab";
import SkillKnowledgeTab from "./skill-knowledge-tab";
import SkillQuestionsTab from "./skill-questions-tab";
import SkillFormDialog from "@/components/management/skill-form-dialog";
import CreateTestFromSkills from "@/components/tests/create-test-from-skills";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { SkillDetail, SkillListItem } from "@/app/dashboard/management-types";

interface Props {
  skill: SkillDetail;
  isAdmin: boolean;
  canEdit: boolean;
}

const TABS = ["overview", "positions", "persons", "knowledge", "questions", "analytics"] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  overview: "Overview",
  positions: "Positions",
  persons: "Persons",
  knowledge: "Knowledge",
  questions: "Questions",
  analytics: "Analytics",
};

export default function SkillDetailClient({ skill, isAdmin, canEdit }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
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
    <div className="min-h-screen bg-[#121A2E]">
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

        <div className="flex gap-1 border-b border-[#8B99B0]/10 mb-4 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                tab === t
                  ? "border-[#7C8FFF] text-[#ECF0F7]"
                  : "border-transparent text-[#5A6882] hover:text-[#8B99B0]"
              }`}
            >
              {TAB_LABELS[t]}
              {t === "positions" && (
                <span className="ml-1.5 text-xs text-[#5A6882]">({skill.position_requirements.length})</span>
              )}
              {t === "persons" && (
                <span className="ml-1.5 text-xs text-[#5A6882]">({skill.person_skills.length})</span>
              )}
            </button>
          ))}
        </div>

        {tab === "overview" && <SkillOverviewTab skill={skill} />}
        {tab === "positions" && <SkillPositionsTab requirements={skill.position_requirements} />}
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
        {tab === "analytics" && (
          <SkillAnalyticsTab
            positionCount={skill.position_requirements.length}
            personCount={skill.person_skills.length}
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
          className="max-w-3xl w-[calc(100%-2rem)] max-h-[90vh] overflow-y-auto bg-[#101828] ring-[#7C8FFF]/15"
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
