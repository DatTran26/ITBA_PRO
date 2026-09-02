import type { ComponentType } from "react";
import type { IconProps } from "@phosphor-icons/react";
import {
  BellSimple,
  Buildings,
  ChartDonut,
  ClipboardText,
  Kanban,
  Scan,
  ShieldCheck,
  Sparkle,
  UsersThree,
  VideoCamera,
} from "@phosphor-icons/react";

interface NavigationItem {
  label: string;
  icon: ComponentType<IconProps>;
  enabled?: boolean;
}

interface NavigationGroup {
  label: string;
  items: NavigationItem[];
}

const navigationGroups: NavigationGroup[] = [
  {
    label: "Tổng quan",
    items: [{ label: "Tổng quan & báo cáo", icon: ChartDonut }],
  },
  {
    label: "Con người",
    items: [
      { label: "Quản lý nhân sự", icon: UsersThree },
      { label: "Tuyển dụng & onboarding", icon: Sparkle },
      { label: "Kiểm tra năng lực", icon: ClipboardText },
    ],
  },
  {
    label: "Công việc",
    items: [
      { label: "Cuộc họp AI", icon: VideoCamera },
      { label: "Công việc & Kanban", icon: Kanban },
      { label: "Vận hành nhân viên", icon: ShieldCheck },
    ],
  },
  {
    label: "AI & dữ liệu",
    items: [{ label: "Document AI", icon: Scan, enabled: true }],
  },
  {
    label: "Hệ thống",
    items: [
      { label: "Tổ chức & phân quyền", icon: Buildings },
      { label: "Thông báo & tích hợp", icon: BellSimple },
    ],
  },
];

interface SidebarNavigationProps {
  collapsed: boolean;
}

export function SidebarNavigation({ collapsed }: SidebarNavigationProps) {
  return (
    <nav className="sidebar-navigation" aria-label="Điều hướng chính">
      {navigationGroups.map((group) => (
        <section className="navigation-group" key={group.label}>
          <h2 className="navigation-group__label">{group.label}</h2>
          <ul className="navigation-group__items">
            {group.items.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.label}>
                  <div
                    className={`navigation-item${item.enabled ? " is-active" : ""}`}
                    aria-current={item.enabled ? "page" : undefined}
                    aria-disabled={item.enabled ? undefined : "true"}
                    title={collapsed ? item.label : undefined}
                  >
                    <Icon
                      size={19}
                      weight={item.enabled ? "fill" : "regular"}
                      aria-hidden="true"
                    />
                    <span className="navigation-item__label">{item.label}</span>
                    {!item.enabled && (
                      <span className="navigation-item__status">Sắp ra mắt</span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </nav>
  );
}
