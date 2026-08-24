import { useEffect, useRef, useState, type ReactNode } from "react";
import { SidebarSimple } from "@phosphor-icons/react";
import { useAppShellMotion } from "../../hooks/useWorkspaceMotion";
import { SidebarNavigation } from "./SidebarNavigation";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const tabletRailQuery = "(max-width: 1279px)";
  const [compactViewport, setCompactViewport] = useState(() =>
    window.matchMedia(tabletRailQuery).matches,
  );
  const [desktopCollapsed, setDesktopCollapsed] = useState(false);
  const [compactCollapsed, setCompactCollapsed] = useState(true);
  const collapsed = compactViewport ? compactCollapsed : desktopCollapsed;
  const shellRef = useRef<HTMLDivElement>(null);
  useAppShellMotion(shellRef);

  useEffect(() => {
    const media = window.matchMedia(tabletRailQuery);
    const syncViewport = (event: MediaQueryListEvent) =>
      setCompactViewport(event.matches);
    media.addEventListener("change", syncViewport);
    return () => media.removeEventListener("change", syncViewport);
  }, []);

  function toggleSidebar() {
    if (compactViewport) {
      setCompactCollapsed((value) => !value);
      return;
    }
    setDesktopCollapsed((value) => !value);
  }

  return (
    <div className="app-shell" data-sidebar-collapsed={collapsed} ref={shellRef}>
      <aside className="app-sidebar">
        <div className="brand-lockup" aria-label="DOWN TOWN HRMS">
          <span className="brand-mark" aria-hidden="true">
            <span>D</span>
            <span>T</span>
          </span>
          <span className="brand-name">DOWN TOWN</span>
        </div>

        <SidebarNavigation collapsed={collapsed} />

        <button
          className="sidebar-toggle"
          type="button"
          onClick={toggleSidebar}
          aria-label={
            collapsed ? "Mở rộng thanh điều hướng" : "Thu gọn thanh điều hướng"
          }
          aria-expanded={!collapsed}
        >
          <SidebarSimple size={19} aria-hidden="true" />
          <span>{collapsed ? "Mở rộng" : "Thu gọn"}</span>
        </button>
      </aside>

      <div className="app-frame">
        <header className="app-header">
          <div className="mobile-brand" aria-hidden="true">
            DT
          </div>
          <div className="workspace-context">
            <span className="workspace-context__eyebrow">Không gian vận hành</span>
            <span className="workspace-context__name">Tài liệu nhân sự</span>
          </div>
          <div className="demo-persona">
            <span className="demo-persona__badge">Tài khoản demo</span>
            <span className="demo-persona__avatar" aria-hidden="true">
              TH
            </span>
            <span className="demo-persona__identity">
              <strong>Thanh</strong>
              <span>HR Operations</span>
            </span>
          </div>
        </header>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
