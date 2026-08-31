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

  const handleTagToggle = (tag: TagItem, attached: boolean) => {
    setTags((prev) => attached ? [...prev, tag] : prev.filter((t) => t.id !== tag.id));
  };

  return (
    <div className="min-h-screen bg-[#121A2E]">
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

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="bg-[#222C4A] border border-[#8B99B0]/10 mb-4 flex-wrap">
            <TabsTrigger value="overview" className="data-[state=active]:bg-[#7C8FFF] data-[state=active]:text-white text-[#8B99B0] text-xs">Overview</TabsTrigger>
            <TabsTrigger value="skills" className="data-[state=active]:bg-[#7C8FFF] data-[state=active]:text-white text-[#8B99B0] text-xs">Skills</TabsTrigger>
            <TabsTrigger value="assessments" className="data-[state=active]:bg-[#7C8FFF] data-[state=active]:text-white text-[#8B99B0] text-xs">Assessments ({results.length})</TabsTrigger>
            <TabsTrigger value="notes" className="data-[state=active]:bg-[#7C8FFF] data-[state=active]:text-white text-[#8B99B0] text-xs">Notes</TabsTrigger>
            <TabsTrigger value="development" className="data-[state=active]:bg-[#7C8FFF] data-[state=active]:text-white text-[#8B99B0] text-xs">Development</TabsTrigger>
            <TabsTrigger value="relationships" className="data-[state=active]:bg-[#7C8FFF] data-[state=active]:text-white text-[#8B99B0] text-xs">Relationships</TabsTrigger>
          </TabsList>
        </Tabs>

        {tab === "overview" && <PersonOverviewTab person={person} skills={skills} memberships={memberships} />}
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
