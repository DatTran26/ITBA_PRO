"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { toast } from "sonner";
import GroupHeader from "./group-header";
import GroupOverviewTab from "./group-overview-tab";
import GroupMembersTab from "./group-members-tab";
import GroupPositionsTab from "./group-positions-tab";
import GroupSkillCoverageTab from "./group-skill-coverage-tab";
import GroupAssessmentsTab from "./group-assessments-tab";
import GroupNotesTab from "./group-notes-tab";
import GroupFormDialog from "@/components/management/group-form-dialog";
import MemberPickerDialog from "@/components/management/member-picker-dialog";
import type { GroupListItem, GroupMemberItem, NoteItem, ActivityLogItem } from "@/app/dashboard/management-types";

const TABS = ["overview", "members", "positions", "skill-coverage", "assessments", "notes"] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = {
  overview: "Overview",
  members: "Members",
  positions: "Positions",
  "skill-coverage": "Skill Coverage",
  assessments: "Assessments",
  notes: "Notes",
};

interface Props {
  group: GroupListItem;
  members: GroupMemberItem[];
  notes: NoteItem[];
  activityLogs: ActivityLogItem[];
}

export default function GroupDetailClient({ group, members: initialMembers, notes, activityLogs }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("overview");
  const [editOpen, setEditOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [members, setMembers] = useState<GroupMemberItem[]>(initialMembers);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const existingMemberIds = members.map((m) => m.person_id);

  async function handleRemove(memberId: string, name: string) {
    if (!confirm(`Remove ${name} from this group?`)) return;
    setRemovingId(memberId);
    try {
      const res = await fetch(`/api/groups/${group.id}/members/${memberId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      setMembers((prev) => prev.filter((m) => m.id !== memberId));
      toast.success("Member removed");
      router.refresh();
    } catch {
      toast.error("Failed to remove member");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-[#121A2E]">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Groups", href: "/dashboard/groups" },
          { label: group.name },
        ]} />
        <GroupHeader
          group={group}
          memberCount={members.length}
          onEdit={() => setEditOpen(true)}
          onAddMember={() => setPickerOpen(true)}
        />

        {/* Tabs */}
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
            </button>
          ))}
        </div>

        {tab === "overview" && <GroupOverviewTab group={group} memberCount={members.length} />}
        {tab === "members" && (
          <GroupMembersTab
            groupId={group.id}
            members={members}
            onAddMember={() => setPickerOpen(true)}
            onRemoveMember={handleRemove}
            removingId={removingId}
          />
        )}
        {tab === "positions" && <GroupPositionsTab members={members} />}
        {tab === "skill-coverage" && <GroupSkillCoverageTab members={members} />}
        {tab === "assessments" && <GroupAssessmentsTab memberCount={members.length} />}
        {tab === "notes" && <GroupNotesTab entityId={group.id} activityLogs={activityLogs} />}
      </PageContainer>

      <GroupFormDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={() => router.refresh()}
        editData={group}
      />
      <MemberPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        groupId={group.id}
        existingMemberIds={existingMemberIds}
        onSuccess={() => { setPickerOpen(false); router.refresh(); }}
      />
    </div>
  );
}
