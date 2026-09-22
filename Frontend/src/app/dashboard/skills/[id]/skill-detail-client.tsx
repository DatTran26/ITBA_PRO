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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KpiCardGrid from "@/components/crm/kpi-card-grid";
import { Briefcase, Users, Layers, TrendingDown } from "lucide-react";
import type { KpiCardData } from "@/lib/crm/types";

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

  /* KPI suy ra từ `skill` đã fetch, không thêm truy vấn. */
  const avgLevel = skill.person_skills.length
    ? (skill.person_skills.reduce((a, p) => a + p.current_level, 0) / skill.person_skills.length).toFixed(1)
    : "0";
  const kpis: KpiCardData[] = [
    { label: "Vị trí yêu cầu", value: skill.position_requirements.length, icon: Briefcase, badge: "Nhu cầu" },
    { label: "Người có kỹ năng", value: skill.person_skills.length, icon: Users, badge: "Nguồn cung" },
    { label: "Level trung bình", value: avgLevel, icon: Layers, badge: "Của nhân sự" },
    { label: "Thiếu hụt", value: editData.shortage_score, icon: TrendingDown, badge: editData.shortage_score > 0 ? "Cần bổ sung" : "Đủ", tone: editData.shortage_score > 0 ? "pink" : "teal" },
  ];

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

        <div className="mb-6"><KpiCardGrid items={kpis} /></div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className="mb-5 max-w-full overflow-x-auto justify-start [scrollbar-width:none]">
            {TABS.map((t) => (
              <TabsTrigger key={t} value={t}>
                {TAB_LABELS[t]}
                {t === "positions" && ` (${skill.position_requirements.length})`}
                {t === "persons" && ` (${skill.person_skills.length})`}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

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
