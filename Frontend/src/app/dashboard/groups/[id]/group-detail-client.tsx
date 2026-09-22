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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KpiCardGrid from "@/components/crm/kpi-card-grid";
import { Users, HeartPulse, Briefcase, AlertTriangle } from "lucide-react";
import type { KpiCardData } from "@/lib/crm/types";

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

  /* KPI suy ra từ `group` + `members` đã fetch, không thêm truy vấn. */
  const kpis: KpiCardData[] = [
    { label: "Thành viên", value: members.length, icon: Users, badge: `${members.filter((m) => m.persons.type === "employee").length} nhân viên` },
    { label: "Health score", value: group.health_score ?? "-", icon: HeartPulse, badge: "Sức khoẻ nhóm" },
    { label: "Vị trí liên quan", value: group.position_count ?? 0, icon: Briefcase, badge: "Positions" },
    { label: "Cảnh báo", value: group.alert_count ?? 0, icon: AlertTriangle, badge: (group.alert_count ?? 0) > 0 ? "Cần xử lý" : "Ổn định", tone: (group.alert_count ?? 0) > 0 ? "pink" : "teal" },
  ];

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

        <div className="mb-6"><KpiCardGrid items={kpis} /></div>

        <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)}>
          <TabsList className="mb-5 max-w-full overflow-x-auto justify-start [scrollbar-width:none]">
            {TABS.map((t) => (
              <TabsTrigger key={t} value={t}>
                {TAB_LABELS[t]}{t === "members" ? ` (${members.length})` : ""}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {tab === "overview" && <GroupOverviewTab group={group} members={members} />}
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
