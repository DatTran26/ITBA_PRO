"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersonProfileHeader from "./person-profile-header";
import PersonOverviewTab from "./person-overview-tab";
import PersonSkillsTab from "./person-skills-tab";
import PersonAssessmentsTab from "./person-assessments-tab";
import PersonNotesTab from "./person-notes-tab";
import PersonDevelopmentTab from "./person-development-tab";
import PersonRelationshipsTab from "./person-relationships-tab";
import PersonFormDialog from "@/components/management/person-form-dialog";
import TagPickerPopover from "@/components/crm/tag-picker-popover";
import KpiCardGrid from "@/components/crm/kpi-card-grid";
import { GraduationCap, ClipboardCheck, Target, FolderKanban } from "lucide-react";
import type { KpiCardData } from "@/lib/crm/types";
import type { PersonDetail, PersonSkillItem, TagItem, ActivityLogItem, CrmTaskItem } from "@/app/dashboard/management-types";

interface ResultRow {
  id: string;
  score: number;
  total_questions: number;
  status: string | null;
  submitted_at: string;
  tests: { title?: string; job_role: string } | null;
}

interface MembershipRow {
  id: string;
  groups: { id: string; name: string; type: string } | null;
}

interface Props {
  person: PersonDetail;
  skills: PersonSkillItem[];
  results: ResultRow[];
  memberships: MembershipRow[];
  tags: TagItem[];
  activityLogs: ActivityLogItem[];
  tasks: CrmTaskItem[];
}

type TabKey = "overview" | "skills" | "assessments" | "notes" | "development" | "relationships";

export default function PersonDetailClient({ person, skills, results, memberships, tags: initialTags, activityLogs, tasks }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [tags, setTags] = useState<TagItem[]>(initialTags);

  /* KPI suy ra từ dữ liệu đã fetch ở page.tsx, không thêm truy vấn. */
  const pcts = results.filter((r) => r.total_questions > 0).map((r) => Math.round((r.score / r.total_questions) * 100));
  const avgPct = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
  const avgLevel = skills.length ? (skills.reduce((a, s) => a + s.current_level, 0) / skills.length).toFixed(1) : "0";
  const kpis: KpiCardData[] = [
    { label: "Kỹ năng", value: skills.length, icon: GraduationCap, badge: `Level TB ${avgLevel}` },
    { label: "Bài đánh giá", value: results.length, icon: ClipboardCheck, badge: "Đã nộp" },
    { label: "Điểm trung bình", value: avgPct === null ? "-" : `${avgPct}%`, icon: Target, badge: "Các bài test" },
    { label: "Nhóm", value: memberships.length, icon: FolderKanban, badge: "Thành viên" },
  ];

  const handleTagToggle = (tag: TagItem, attached: boolean) => {
    setTags((prev) => attached ? [...prev, tag] : prev.filter((t) => t.id !== tag.id));
  };

  return (
    <div className="min-h-screen bg-transparent pb-12">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Persons", href: "/dashboard/persons" },
          { label: person.full_name },
        ]} />

        <PersonProfileHeader
          person={person}
          tags={tags}
          onEdit={() => setEditOpen(true)}
          onAddTag={() => {}}
        />

        <div className="mb-6"><KpiCardGrid items={kpis} /></div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="mb-5 max-w-full overflow-x-auto justify-start">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="skills">Skills ({skills.length})</TabsTrigger>
            <TabsTrigger value="assessments">Assessments ({results.length})</TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="development">Development ({tasks.length})</TabsTrigger>
            <TabsTrigger value="relationships">Relationships</TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === "overview" && <PersonOverviewTab person={person} skills={skills} memberships={memberships} results={results} />}
        {tab === "skills" && <PersonSkillsTab personId={person.id} skills={skills} positionId={person.position_id} />}
        {tab === "assessments" && <PersonAssessmentsTab results={results} />}
        {tab === "notes" && <PersonNotesTab personId={person.id} activityLogs={activityLogs} />}
        {tab === "development" && <PersonDevelopmentTab tasks={tasks} />}
        {tab === "relationships" && <PersonRelationshipsTab memberships={memberships} />}
      </PageContainer>

      <PersonFormDialog open={editOpen} onOpenChange={setEditOpen} onSuccess={() => router.refresh()} editData={person} />
    </div>
  );
}
