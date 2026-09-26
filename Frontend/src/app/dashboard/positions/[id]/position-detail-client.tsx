"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { toast } from "sonner";
import PositionHeader from "./position-header";
import PositionBlueprint from "./position-blueprint";
import PositionSkillsTab from "./position-skills-tab";
import PositionPersonsTab from "./position-persons-tab";
import PositionNotesTab from "./position-notes-tab";
import PositionFormDialog from "@/components/management/position-form-dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type {
  PositionDetail,
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

const TABS = ["skills", "persons", "notes"] as const;
type Tab = typeof TABS[number];
const TAB_LABELS: Record<Tab, string> = { skills: "Chỉnh yêu cầu", persons: "Nhân sự", notes: "Ghi chú" };

export default function PositionDetailClient({ position, availableSkills, assignedPersons, entityTags, activityLogs }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("skills");
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
    <div className="min-h-screen bg-transparent pb-12">
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

        <div className="mb-6"><PositionBlueprint persons={assignedPersons} requirements={requirements} /></div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className="mb-5 max-w-full overflow-x-auto justify-start [scrollbar-width:none]">
            {TABS.map((t) => (
              <TabsTrigger key={t} value={t}>
                {TAB_LABELS[t]}{t === "skills" ? ` (${requirements.length})` : t === "persons" ? ` (${assignedPersons.length})` : ""}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {tab === "skills" && <PositionSkillsTab position={position} requirements={requirements} availableSkills={availableSkills} />}
        {tab === "persons" && <PositionPersonsTab persons={assignedPersons} requirements={requirements} />}
        {tab === "notes" && <PositionNotesTab entityId={position.id} activityLogs={activityLogs} />}
      </PageContainer>

      <PositionFormDialog open={editOpen} onOpenChange={setEditOpen} onSuccess={() => router.refresh()} editData={position} />
    </div>
  );
}
