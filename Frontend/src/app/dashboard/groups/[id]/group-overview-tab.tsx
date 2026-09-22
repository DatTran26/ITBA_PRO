"use client";

import { ChartFrame, DonutStat, HBarList, TrendArea, colorAt } from "@/components/charts";
import { countByMonth } from "@/lib/ui/series";
import type { GroupListItem, GroupMemberItem } from "@/app/dashboard/management-types";

interface Props {
  group: GroupListItem;
  members: GroupMemberItem[];
}

export default function GroupOverviewTab({ group, members }: Props) {
  const byType = [
    { label: "Nhân viên", value: members.filter((m) => m.persons.type === "employee").length, color: colorAt(0) },
    { label: "Ứng viên", value: members.filter((m) => m.persons.type === "candidate").length, color: colorAt(1) },
  ].filter((s) => s.value > 0);

  const byDept = [...members.reduce((m, x) => {
    const d = x.persons.department ?? "Chưa gán phòng ban";
    return m.set(d, (m.get(d) ?? 0) + 1);
  }, new Map<string, number>())].map(([label, value]) => ({ label, value }));

  const joined = countByMonth(members.map((m) => m.added_at));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <DonutStat
        title="Cơ cấu thành viên"
        subtitle="Nhân viên và ứng viên trong nhóm"
        tag={{ label: `${members.length} người`, tone: "violet" }}
        slices={byType}
        centerLabel="Người"
      />

      <HBarList
        title="Theo phòng ban"
        subtitle="Thành viên đến từ đâu"
        tag={{ label: "Phòng ban", tone: "orange" }}
        items={byDept}
      />

      <TrendArea
        title="Thành viên mới"
        subtitle="Được thêm vào nhóm trong 6 tháng gần nhất"
        tag={{ label: "6 tháng", tone: "teal" }}
        points={joined}
        color={colorAt(2)}
      />

      <ChartFrame title="Thông tin nhóm" subtitle="Chi tiết và mô tả" tag={{ label: "Group" }}>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 text-sm">
          <div><dt className="text-xs font-bold text-muted-foreground">Loại</dt><dd className="mt-1 font-semibold text-foreground capitalize">{group.type}</dd></div>
          <div><dt className="text-xs font-bold text-muted-foreground">Ngày tạo</dt><dd className="mt-1 font-semibold text-foreground">{new Date(group.created_at).toLocaleDateString("vi-VN")}</dd></div>
          <div><dt className="text-xs font-bold text-muted-foreground">Vị trí liên quan</dt><dd className="mt-1 font-semibold text-foreground">{group.position_count ?? 0}</dd></div>
          <div><dt className="text-xs font-bold text-muted-foreground">Cảnh báo</dt><dd className="mt-1 font-semibold text-foreground">{group.alert_count ?? 0}</dd></div>
        </dl>
        <p className="mt-4 pt-4 border-t border-border text-sm text-muted-foreground leading-relaxed">
          {group.description || "Chưa có mô tả."}
        </p>
      </ChartFrame>
    </div>
  );
}
