"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PersonIdentityCard from "./person-identity-card";
import PersonSkillsTab from "./person-skills-tab";
import PersonAssessmentsTab from "./person-assessments-tab";
import PersonNotesTab from "./person-notes-tab";
import PersonDevelopmentTab from "./person-development-tab";
import PersonFormDialog from "@/components/management/person-form-dialog";
import { AlertTriangle } from "lucide-react";
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

type TabKey = "assessments" | "notes" | "development";

export default function PersonDetailClient({ person, skills, results, memberships, tags: initialTags, activityLogs, tasks }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<TabKey>("assessments");
  const [editOpen, setEditOpen] = useState(false);
  const [tags, setTags] = useState<TagItem[]>(initialTags);

  /* Số nhanh suy ra từ dữ liệu page.tsx đã fetch, không thêm truy vấn. */
  const pcts = results.filter((r) => r.total_questions > 0).map((r) => Math.round((r.score / r.total_questions) * 100));
  const avgPct = pcts.length ? Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length) : null;
  const avgLevel = skills.length ? (skills.reduce((a, s) => a + s.current_level, 0) / skills.length).toFixed(1) : "0";
  const warnings = [
    !person.position_id && "Chưa gán vị trí",
    skills.length === 0 && "Chưa ghi nhận kỹ năng",
    memberships.length === 0 && "Chưa thuộc nhóm nào",
  ].filter(Boolean) as string[];

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

        <div className="grid grid-cols-[340px_1fr] gap-6 items-start">
          <PersonIdentityCard
            person={person}
            tags={tags}
            memberships={memberships}
            stats={{ skills: skills.length, avgLevel, tests: results.length, avgPct }}
            onEdit={() => setEditOpen(true)}
            onAddTag={() => {}}
          />

          <div className="min-w-0 space-y-6">
            {warnings.length > 0 && (
              <div role="status" className="flex items-start gap-3 rounded-2xl border border-warning/30 bg-warning/5 px-5 py-4">
                <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-foreground">Hồ sơ còn thiếu</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{warnings.join(" · ")}</p>
                </div>
              </div>
            )}

            <PersonSkillsTab personId={person.id} skills={skills} positionId={person.position_id} />

            <div>
              <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
                <TabsList className="mb-4">
                  <TabsTrigger value="assessments">Đánh giá ({results.length})</TabsTrigger>
                  <TabsTrigger value="notes">Ghi chú</TabsTrigger>
                  <TabsTrigger value="development">Phát triển ({tasks.length})</TabsTrigger>
                </TabsList>
              </Tabs>
              {tab === "assessments" && <PersonAssessmentsTab results={results} />}
              {tab === "notes" && <PersonNotesTab personId={person.id} activityLogs={activityLogs} />}
              {tab === "development" && <PersonDevelopmentTab tasks={tasks} />}
            </div>
          </div>
        </div>
      </PageContainer>

      <PersonFormDialog open={editOpen} onOpenChange={setEditOpen} onSuccess={() => router.refresh()} editData={person} />
    </div>
  );
}
