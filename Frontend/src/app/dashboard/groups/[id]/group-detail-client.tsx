"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { toast } from "sonner";
import GroupHeader from "./group-header";
import GroupSkillHeatmap from "./group-skill-heatmap";
import GroupMembersTab from "./group-members-tab";
import GroupNotesTab from "./group-notes-tab";
import GroupFormDialog from "@/components/management/group-form-dialog";
import MemberPickerDialog from "@/components/management/member-picker-dialog";
import type { GroupListItem, GroupMemberItem, NoteItem, ActivityLogItem } from "@/app/dashboard/management-types";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TABS = ["members", "notes"] as const;
type Tab = typeof TABS[number];

const TAB_LABELS: Record<Tab, string> = { members: "Thành viên", notes: "Ghi chú" };

interface Props {
  group: GroupListItem;
  members: GroupMemberItem[];
  notes: NoteItem[];
  activityLogs: ActivityLogItem[];
}

export default function GroupDetailClient({ group, members: initialMembers, notes, activityLogs }: Props) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("members");
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
    <div className="min-h-screen bg-transparent pb-12">
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

        <GroupSkillHeatmap members={members} />

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className="mb-5 max-w-full overflow-x-auto justify-start [scrollbar-width:none]">
            {TABS.map((t) => (
              <TabsTrigger key={t} value={t}>
                {TAB_LABELS[t]}{t === "members" ? ` (${members.length})` : ""}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {tab === "members" && (
          <GroupMembersTab
            groupId={group.id}
            members={members}
            onAddMember={() => setPickerOpen(true)}
            onRemoveMember={handleRemove}
            removingId={removingId}
          />
        )}
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
