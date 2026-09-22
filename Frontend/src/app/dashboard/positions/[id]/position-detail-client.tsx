"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { toast } from "sonner";
import PositionHeader from "./position-header";
import PositionOverviewTab from "./position-overview-tab";
import PositionSkillsTab from "./position-skills-tab";
import PositionPersonsTab from "./position-persons-tab";
import PositionGapAnalysisTab from "./position-gap-analysis-tab";
import PositionAssessmentsTab from "./position-assessments-tab";
import PositionNotesTab from "./position-notes-tab";
import PositionFormDialog from "@/components/management/position-form-dialog";
import { SharedDashboardButton } from "@/components/shares";
import type {
  PositionDetail,
  SkillRequirement,
  TagItem,
  ActivityLogItem,
  EntityTagItem,
} from "@/app/dashboard/management-types";

interface AssignedPerson {
  id: string;
  full_name: string;
  email: string | null;
  type: string;
  current_level: string | null;
  status: string;
  position_id: string | null;
}

interface AvailableSkill { id: string; name: string; category: string | null }

interface Props {
  position: PositionDetail;
  availableSkills: AvailableSkill[];
  assignedPersons: AssignedPerson[];
  entityTags: EntityTagItem[];
  activityLogs: ActivityLogItem[];
}

const TABS = ["overview", "skills", "persons", "gap-analysis", "assessments", "notes"] as const;
type Tab = typeof TABS[number];
const TAB_LABELS: Record<Tab, string> = {
  overview: "Overview",
  skills: "Skills",
  persons: "Persons",
  "gap-analysis": "Gap Analysis",
  assessments: "Assessments",
  notes: "Notes",
};

export default function PositionDetailClient({ position, availableSkills, assignedPersons, entityTags, activityLogs }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [tags, setTags] = useState<TagItem[]>(
    entityTags.map((et) => et.tags).filter(Boolean)
  );

  const requirements = [...position.position_skill_requirements].sort(
    (a, b) => a.checklist_order - b.checklist_order
  );

  const handleClone = useCallback(async () => {
    try {
      const res = await fetch("/api/positions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `${position.title} (Copy)`,
          department: position.department,
          target_level: position.target_level,
          description: position.description,
          clone_from: position.id,
        }),
      });
      if (!res.ok) throw new Error();
      const { position: cloned } = await res.json();
      toast.success("Position cloned");
      router.push(`/dashboard/positions/${cloned.id}`);
    } catch {
      toast.error("Failed to clone position");
    }
  }, [position, router]);

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Positions", href: "/dashboard/positions" },
          { label: position.title },
        ]} />

        <PositionHeader
          position={position}
          tags={tags}
          assignedCount={assignedPersons.length}
          reqCount={requirements.length}
          onEdit={() => setEditOpen(true)}
          onClone={handleClone}
          onAddTag={() => {}}
        />

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border/10 mb-4 overflow-x-auto">
          {TABS.map((t) => (
            <SharedDashboardButton
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
                tab === t
                  ? "border-border text-foreground"
                  : "border-transparent text-muted-foreground hover:text-muted-foreground"
              }`}
            >
              {TAB_LABELS[t]}
            </SharedDashboardButton>
          ))}
        </div>

        {tab === "overview" && <PositionOverviewTab position={position} assignedCount={assignedPersons.length} reqCount={requirements.length} tags={tags} />}
        {tab === "skills" && <PositionSkillsTab position={position} requirements={requirements} availableSkills={availableSkills} />}
        {tab === "persons" && <PositionPersonsTab persons={assignedPersons} requirements={requirements} />}
        {tab === "gap-analysis" && <PositionGapAnalysisTab persons={assignedPersons} requirements={requirements} />}
        {tab === "assessments" && <PositionAssessmentsTab positionTitle={position.title} />}
        {tab === "notes" && <PositionNotesTab entityId={position.id} activityLogs={activityLogs} />}
      </PageContainer>

      <PositionFormDialog open={editOpen} onOpenChange={setEditOpen} onSuccess={() => router.refresh()} editData={position} />
    </div>
  );
}
