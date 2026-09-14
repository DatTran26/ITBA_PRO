import type { LucideIcon } from "lucide-react";
import {
    Users,
    UserCog,
    Briefcase,
    Zap,
    FolderKanban,
    Settings2,
    Settings,
    FileText,
    GitBranch,
    ClipboardList,
    Calendar,
    CalendarDays,
    Mail,
    Send,
    ScrollText,
    Database,
    ScanText,
} from "lucide-react";

/**
 * Single source of truth for navigation structure.
 * Consumed by both top-nav and sidebar layouts.
 * Adding a link or changing role-gating MUST be done here only.
 */

export type UserRole =
    | "super_admin"
    | "admin"
    | "recruiter"
    | "hr"
    | "interviewer"
    | "leader";

export interface NavLink {
    href: string;
    label: string;
    icon: LucideIcon;
    /** Sub-link level role override. Falls back to parent group's allowedRoles. */
    allowedRoles?: UserRole[];
}

export interface NavGroup {
    id: "people" | "recruitment" | "interviews" | "system" | "emails";
    label: string;
    /** Optional icon shown next to the group trigger label (top-nav dropdowns). */
    triggerIcon?: LucideIcon;
    links: NavLink[];
    allowedRoles: UserRole[];
    /** Hex used by sidebar section header label color and top-nav active accent. */
    accentColor: string;
    /** Render a separator line above this group in collapsed sidebar (marks start of a new cluster). */
    dividerBefore?: boolean;
    /** Section label shown above this group in expanded sidebar (replaces divider with readable text). */
    sectionLabel?: string;
}

export const NAV_GROUPS: NavGroup[] = [
    {
        id: "people",
        label: "People & Roles",
        triggerIcon: Users,
        dividerBefore: true,
        sectionLabel: "Workspace",
        links: [
            { href: "/dashboard/persons", label: "Persons", icon: Users },
            { href: "/dashboard/positions", label: "Positions", icon: Briefcase },
            { href: "/dashboard/skills", label: "Skills", icon: Zap },
            { href: "/dashboard/groups", label: "Groups", icon: FolderKanban },
        ],
        allowedRoles: ["recruiter", "leader", "admin", "super_admin"],
        accentColor: "#7C8FFF",
    },
    {
        id: "recruitment",
        label: "Recruitment",
        triggerIcon: ClipboardList,
        links: [
            { href: "/dashboard/recruitment", label: "Candidate CV", icon: Users, allowedRoles: ["hr", "interviewer", "admin", "super_admin"] as UserRole[] },
            { href: "/dashboard/recruitment/sessions", label: "Schedule", icon: CalendarDays, allowedRoles: ["hr", "interviewer", "admin", "super_admin"] as UserRole[] },
            { href: "/dashboard/recruitment/report", label: "Report", icon: FileText, allowedRoles: ["hr", "interviewer", "admin", "super_admin"] as UserRole[] },
            { href: "/dashboard/recruitment/settings", label: "Settings", icon: Settings, allowedRoles: ["hr", "interviewer", "admin", "super_admin"] as UserRole[] },
            { href: "/dashboard/question-bank", label: "Question Bank", icon: Database, allowedRoles: ["leader", "admin", "super_admin"] as UserRole[] },
            { href: "/dashboard/ocr", label: "Vision OCR", icon: ScanText, allowedRoles: ["hr", "interviewer", "leader", "admin", "super_admin"] as UserRole[] },
        ],
        allowedRoles: ["hr", "interviewer", "leader", "admin", "super_admin"],
        accentColor: "#7C8FFF",
    },
    {
        id: "interviews",
        label: "Interviews",
        triggerIcon: Calendar,
        links: [
            { href: "/dashboard/interview-room", label: "Interview Room", icon: Calendar },
        ],
        allowedRoles: ["interviewer", "admin", "super_admin"],
        accentColor: "#F59E0B",
    },
    {
        id: "system",
        label: "System",
        triggerIcon: Settings2,
        dividerBefore: true,
        sectionLabel: "Administration",
        links: [
            { href: "/dashboard/users", label: "Manage Users", icon: UserCog },
            { href: "/dashboard/templates", label: "Templates", icon: FileText },
            { href: "/dashboard/versions", label: "Versions", icon: GitBranch },
            { href: "/dashboard/settings", label: "Settings", icon: Settings },
        ],
        allowedRoles: ["admin", "super_admin"],
        accentColor: "#B48EFF",
    },
    {
        id: "emails",
        label: "Emails",
        triggerIcon: Mail,
        links: [
            { href: "/dashboard/emails", label: "Compose", icon: Send },
            { href: "/dashboard/emails/logs", label: "Logs", icon: ScrollText },
            {
                href: "/dashboard/emails/settings",
                label: "Settings",
                icon: Settings,
                allowedRoles: ["admin", "super_admin"] as UserRole[],
            },
        ],
        allowedRoles: ["hr", "interviewer", "recruiter", "leader", "admin", "super_admin"] as UserRole[],
        accentColor: "#36DDAB",
    },
];

/**
 * Roles that get a standalone Versions link OUTSIDE the System group.
 * Mirrors current top-nav behavior where hr/interviewer/recruiter see Versions
 * without being granted full System access.
 */
export const VERSIONS_STANDALONE_ROLES: UserRole[] = [
    "hr",
    "interviewer",
    "recruiter",
    "leader",
];

type SectionOverride = Pick<NavGroup, "sectionLabel" | "dividerBefore">;

/**
 * Per-role overrides for sectionLabel / dividerBefore.
 * Admin/super_admin use the static group definitions (no override needed).
 * Other roles see fewer groups, so their clusters must be labelled independently.
 */
const ROLE_SECTION_OVERRIDES: Partial<Record<UserRole, Partial<Record<NavGroup["id"], SectionOverride>>>> = {
    hr: {
        recruitment: { sectionLabel: "Pipeline", dividerBefore: true },
        emails: { sectionLabel: "Communication", dividerBefore: true },
    },
    interviewer: {
        recruitment: { sectionLabel: "Pipeline", dividerBefore: true },
        emails: { sectionLabel: "Communication", dividerBefore: true },
    },
    recruiter: {
        // "Workspace" already on people group ✓
        emails: { sectionLabel: "Communication", dividerBefore: true },
    },
    leader: {
        // "Workspace" already on people group ✓
        recruitment: { sectionLabel: "Assessment", dividerBefore: true },
        emails: { sectionLabel: "Communication", dividerBefore: true },
    },
};

export function visibleGroupsFor(role: UserRole | null | undefined): NavGroup[] {
    if (!role) return [];
    const groups = NAV_GROUPS.filter((g) => g.allowedRoles.includes(role));
    const overrides = ROLE_SECTION_OVERRIDES[role];
    if (!overrides) return groups;
    return groups.map((g) => {
        const o = overrides[g.id];
        return o ? { ...g, ...o } : g;
    });
}

/**
 * Returns links within a group that the given role is allowed to see.
 * Links with their own allowedRoles override the group-level allowedRoles.
 */
export function visibleLinksFor(group: NavGroup, role: UserRole): NavLink[] {
    return (group.links ?? []).filter((link) => {
        const allowed = link.allowedRoles ?? group.allowedRoles;
        return allowed.includes(role);
    });
}

export function shouldShowVersionsStandalone(
    role: UserRole | null | undefined,
): boolean {
    return !!role && VERSIONS_STANDALONE_ROLES.includes(role);
}

export function findGroup(id: NavGroup["id"]): NavGroup | undefined {
    return NAV_GROUPS.find((g) => g.id === id);
}
