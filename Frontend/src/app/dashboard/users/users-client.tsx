"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Users,
    Plus,
    Search,
    MoreHorizontal,
    Shield,
    UserPlus,
    Trash2,
    Mail,
    Calendar,
    Settings2,
    ShieldCheck,
    UserCircle,
    Loader2,
    Key,
    UserCheck,
    XCircle,
    ArrowLeft,
    Copy,
    Check,
    Briefcase,
    CalendarCheck,
    UserCog,
    KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PageTransition, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { SharedDashboardPageHeader } from "@/components/shares";
import KpiCardGrid from "@/components/crm/kpi-card-grid";
import OverviewBand from "@/components/shares/overview-band";
import { DonutStat, HBarList, TrendArea, colorAt } from "@/components/charts";
import { countByMonth } from "@/lib/ui/series";
import { toneByName, type ToneName } from "@/lib/ui/tones";
import type { KpiCardData } from "@/lib/crm/types";

interface UserProfile {
    id: string;
    auth_id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
    force_password_change?: boolean;
}

const ROLE_OPTIONS = [
    { value: "recruiter", label: "Recruiter", description: "Create and manage tests" },
    { value: "leader", label: "Leader", description: "Manage teams and question bank" },
    { value: "hr", label: "HR", description: "Operate recruitment pipeline" },
    { value: "interviewer", label: "Interviewer", description: "Run interview sessions" },
    { value: "admin", label: "Admin", description: "Full admin access" },
] as const;

/* Tông cố định theo vai trò — cùng vai trò luôn cùng màu ở pill và biểu đồ. */
const ROLE_ORDER = ["super_admin", "admin", "leader", "hr", "interviewer", "recruiter"] as const;
const ROLE_TONE: Record<string, ToneName> = {
    super_admin: "pink", admin: "blue", leader: "teal", hr: "orange", interviewer: "violet", recruiter: "gold",
};
const roleTone = (role: string) => toneByName(ROLE_TONE[role] ?? "gold");
const ROLE_LABEL: Record<string, string> = {
    super_admin: "Super Admin", admin: "Admin", leader: "Leader", hr: "HR", interviewer: "Interviewer", recruiter: "Recruiter",
};

const ROLE_ACCESS_LABEL: Record<string, string> = {
    super_admin: "Root + Version Control",
    admin: "Full Admin",
    leader: "Question Bank + Team Control",
    hr: "Recruitment Operations",
    interviewer: "Interview Operations",
    recruiter: "Test Operations",
};

export default function UsersClient({
    initialUsers,
    currentUser,
}: {
    initialUsers: UserProfile[];
    currentUser: UserProfile;
}) {
    const [users, setUsers] = useState<UserProfile[]>(initialUsers);
    const [searchQuery, setSearchQuery] = useState("");
    const [isAddingUser, setIsAddingUser] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [resetConfirmationUser, setResetConfirmationUser] = useState<UserProfile | null>(null);
    const [deleteConfirmationUser, setDeleteConfirmationUser] = useState<UserProfile | null>(null);
    const [roleUpdateUser, setRoleUpdateUser] = useState<UserProfile | null>(null);
    const [newRole, setNewRole] = useState<string>("");
    const router = useRouter();

    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        role: "recruiter"
    });

    // State for showing created credentials
    const [createdCredentials, setCreatedCredentials] = useState<{
        name: string;
        email: string;
        passphrase: string;
        role: string;
    } | null>(null);
    const [copied, setCopied] = useState(false);

    const handleCopyCredentials = () => {
        if (!createdCredentials) return;
        const text = `Name: ${createdCredentials.name}\nEmail: ${createdCredentials.email}\nPassword: ${createdCredentials.passphrase}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    /* KPI + dải tổng quan: suy ra từ `users` đã có, không thêm truy vấn. */
    const countRole = (...roles: string[]) => users.filter((u) => roles.includes(u.role)).length;
    const kpis: KpiCardData[] = [
        { label: "Tổng tài khoản", value: users.length, icon: Users, badge: "Toàn hệ thống" },
        { label: "Admin", value: countRole("super_admin", "admin"), icon: Shield, badge: "Quản trị" },
        { label: "HR", value: countRole("hr"), icon: Briefcase, badge: "Tuyển dụng" },
        { label: "Interviewer", value: countRole("interviewer"), icon: CalendarCheck, badge: "Phỏng vấn" },
        { label: "Vận hành", value: countRole("recruiter", "leader"), icon: UserCog, badge: "Recruiter + Leader" },
        { label: "Đổi mật khẩu", value: users.filter((u) => u.force_password_change).length, icon: KeyRound, badge: "Bắt buộc", tone: "pink" },
    ];
    const byRole = ROLE_ORDER.map((r) => ({ label: ROLE_LABEL[r], value: countRole(r), color: roleTone(r).mark })).filter((x) => x.value > 0);
    const byMonth = countByMonth(users.map((u) => u.created_at));
    const byDomain = [...users.reduce((m, u) => {
        const d = u.email.split("@")[1] ?? "khác";
        return m.set(d, (m.get(d) ?? 0) + 1);
    }, new Map<string, number>())].map(([label, value]) => ({ label, value }));

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCreateUser = async () => {
        if (!newUser.name || !newUser.email) {
            toast.error("All fields mandatory for identity provision.");
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch("/api/users", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newUser),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Provisioning failed");

            toast.success("User provisioned successfully");

            setCreatedCredentials({
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                passphrase: data.credentials.passphrase
            });

            // Add to local state (or refetch)
            setUsers([data.user, ...users]);
            setIsAddingUser(false);
            setNewUser({ name: "", email: "", role: "recruiter" });
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Provisioning failed");
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteUser = (user: UserProfile) => {
        if (user.id === currentUser.id) {
            toast.error("Cannot terminate self-identity.");
            return;
        }
        setDeleteConfirmationUser(user);
    };

    const confirmDeleteUser = async () => {
        if (!deleteConfirmationUser) return;
        const { id, auth_id } = deleteConfirmationUser;
        setIsLoading(true);
        try {
            const response = await fetch(`/api/users?id=${id}&auth_id=${auth_id}`, {
                method: "DELETE",
            });

            if (!response.ok) throw new Error("Termination failed");

            setUsers(users.filter(u => u.id !== id));
            toast.success("Identity purged from system.");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Termination failed");
        } finally {
            setIsLoading(false);
            setDeleteConfirmationUser(null);
        }
    };

    const handleResetCredentials = (userToReset: UserProfile) => {
        setResetConfirmationUser(userToReset);
    };

    const confirmResetCredentials = async () => {
        if (!resetConfirmationUser) return;
        const userToReset = resetConfirmationUser;
        setIsLoading(true);
        try {
            const response = await fetch("/api/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    auth_id: userToReset.auth_id,
                    email: userToReset.email,
                    name: userToReset.name,
                    role: userToReset.role,
                    reset_password: true
                }),
            });

            const data = await response.json();

            if (!response.ok) throw new Error(data.error || "Reset failed");

            // Update local state to reflect forced password change
            setUsers(users.map(u =>
                u.id === userToReset.id
                    ? { ...u, force_password_change: true }
                    : u
            ));

            toast.success("Identity credentials reset successfully.");

            setCreatedCredentials({
                name: userToReset.name,
                email: userToReset.email,
                role: userToReset.role,
                passphrase: data.credentials.passphrase
            });

        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Reset failed");
        } finally {
            setIsLoading(false);
            setResetConfirmationUser(null);
        }
    };

    const handleRoleUpdate = (user: UserProfile) => {
        setRoleUpdateUser(user);
        setNewRole(user.role);
    };

    const confirmRoleUpdate = async () => {
        if (!roleUpdateUser) return;
        setIsLoading(true);
        try {
            const response = await fetch("/api/users", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    auth_id: roleUpdateUser.auth_id,
                    name: roleUpdateUser.name,
                    role: newRole,
                    reset_password: false
                }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error || "Update failed");

            setUsers(users.map(u =>
                u.id === roleUpdateUser.id
                    ? { ...u, role: newRole }
                    : u
            ));

            toast.success("Access level synchronized.");
            setRoleUpdateUser(null);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Update failed");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <PageTransition className="min-h-screen bg-background text-foreground font-body selection:bg-primary/30 overflow-hidden relative">

            {/* Mesh Gradient Decor */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-60">
                <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] bg-primary/[0.05] blur-[120px] rounded-full" />
                <div className="absolute bottom-[20%] left-[-10%] w-[30%] h-[30%] bg-primary/[0.03] blur-[100px] rounded-full" />
            </div>

            <AppNavbar user={currentUser} />

            <PageContainer className="relative z-10">
                <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Identity Management" }]} />


                <SharedDashboardPageHeader
                    title="Users"
                    icon={Users}
                    badge={{ label: `${users.length} tài khoản` }}
                    description="Quản lý tài khoản, vai trò và quyền truy cập hệ thống"
                    actions={(
                    <div className="flex items-center gap-3">
                        <Dialog open={isAddingUser} onOpenChange={setIsAddingUser}>
                            <DialogTrigger asChild>
                                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 active:scale-[0.98] transition-all h-11 px-6 rounded-xl gap-2 font-semibold cursor-pointer">
                                    <UserPlus className="w-4 h-4" />
                                    Provision Identity
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-muted border-border text-foreground sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-display">Provision System Agent</DialogTitle>
                                    <DialogDescription className="text-muted-foreground">
                                        Assign a new operative to the system. A unique security passphrase will be generated automatically.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Designation (Name)</Label>
                                        <Input
                                            id="name"
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                            className="bg-muted border-border focus:border-indigo-500/50 h-12 rounded-xl"
                                            placeholder="Agent Identification"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Neural Link (Email)</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            className="bg-muted border-border focus:border-indigo-500/50 h-12 rounded-xl"
                                            placeholder="node@system.local"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role" className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Access Level</Label>
                                        <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v || "recruiter" })}>
                                            <SelectTrigger className="bg-muted border-border focus:border-indigo-500/50 h-12 rounded-xl">
                                                <SelectValue placeholder="Select Access Tier" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-muted border-border text-foreground">
                                                {ROLE_OPTIONS.map((role) => (
                                                    <SelectItem key={role.value} value={role.value}>{role.label} ({role.description})</SelectItem>
                                                ))}
                                                {currentUser.role === 'super_admin' && (
                                                    <SelectItem value="super_admin">Super Admin (Root)</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setIsAddingUser(false)}
                                        className="text-muted-foreground hover:text-foreground hover:bg-muted h-12 rounded-xl"
                                    >
                                        Abort
                                    </Button>
                                    <Button
                                        onClick={handleCreateUser}
                                        disabled={isLoading}
                                        className="bg-indigo-600 hover:bg-indigo-500 h-12 px-8 rounded-xl font-medium"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Deploy Identity"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Credentials Dialog */}
                        <Dialog open={!!createdCredentials} onOpenChange={(open) => !open && setCreatedCredentials(null)}>
                            <DialogContent className="bg-muted border-border text-foreground sm:max-w-[425px]">
                                <DialogHeader>
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <DialogTitle className="text-xl font-display">Identity Provisioned</DialogTitle>
                                    <DialogDescription className="text-muted-foreground">
                                        Share these credentials securely. The user will be required to change their passphrase upon first login.
                                    </DialogDescription>
                                </DialogHeader>
                                {createdCredentials && (
                                    <div className="space-y-4 py-4">
                                        <div className="bg-muted border border-border rounded-xl p-4 space-y-3">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Name</p>
                                                <p className="text-sm font-medium text-muted-foreground">{createdCredentials.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Email</p>
                                                <p className="text-sm font-medium text-muted-foreground">{createdCredentials.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Role</p>
                                                <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-2 h-5 text-[10px] uppercase font-bold tracking-widest">
                                                    {createdCredentials.role}
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground mb-1">Temporary Passphrase</p>
                                                <div className="flex items-center justify-between bg-black/40 border border-border rounded-lg p-2">
                                                    <code className="text-emerald-400 font-mono text-sm px-2">
                                                        {createdCredentials.passphrase}
                                                    </code>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <DialogFooter>
                                    <Button
                                        onClick={handleCopyCredentials}
                                        className={`${copied ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-500'} h-12 px-6 rounded-xl font-medium w-full transition-colors gap-2`}
                                    >
                                        {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                        {copied ? "Copied to Clipboard" : "Copy Secure Credentials"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Reset Confirmation Dialog */}
                        <Dialog open={!!resetConfirmationUser} onOpenChange={(open) => !open && setResetConfirmationUser(null)}>
                            <DialogContent className="bg-muted border-border text-foreground sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-display">Confirm Credential Reset</DialogTitle>
                                    <DialogDescription className="text-muted-foreground">
                                        {resetConfirmationUser ? `Initiate credential reset protocol for ${resetConfirmationUser.email}? A new temporary passphrase will be generated.` : ''}
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setResetConfirmationUser(null)}
                                        className="text-muted-foreground hover:text-foreground hover:bg-muted h-12 rounded-xl"
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={confirmResetCredentials}
                                        disabled={isLoading}
                                        className="bg-indigo-600 hover:bg-indigo-500 h-12 px-8 rounded-xl font-medium"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm Reset"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                        {/* Delete Confirmation Dialog */}
                        <Dialog open={!!deleteConfirmationUser} onOpenChange={(open) => !open && setDeleteConfirmationUser(null)}>
                            <DialogContent className="bg-muted border-border text-foreground sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-display text-rose-500">Confirm Identity Purge</DialogTitle>
                                    <DialogDescription className="text-muted-foreground">
                                        {deleteConfirmationUser ? `Confirm identity termination protocol for ${deleteConfirmationUser.email}? This action is irreversible and all associated access will be permanently revoked.` : ''}
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setDeleteConfirmationUser(null)}
                                        className="text-muted-foreground hover:text-foreground hover:bg-muted h-12 rounded-xl"
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={confirmDeleteUser}
                                        disabled={isLoading}
                                        className="bg-rose-600 hover:bg-rose-500 text-foreground h-12 px-8 rounded-xl font-medium"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Purge Identity"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        {/* Role Update Dialog */}
                        <Dialog open={!!roleUpdateUser} onOpenChange={(open) => !open && setRoleUpdateUser(null)}>
                            <DialogContent className="bg-muted border-border text-foreground sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-display">Update Access Level</DialogTitle>
                                    <DialogDescription className="text-muted-foreground">
                                        Modify administrative permissions for {roleUpdateUser?.email}.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-6 space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Current Role</Label>
                                        <div className="flex items-center gap-2 p-3 bg-muted border border-border rounded-xl">
                                            <Shield className="w-4 h-4 text-indigo-400" />
                                            <span className="capitalize">{roleUpdateUser?.role}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">New Access Tier</Label>
                                        <Select
                                            value={newRole}
                                            onValueChange={(v) => setNewRole(v || "")}
                                            disabled={roleUpdateUser?.role === 'admin' && roleUpdateUser?.id !== currentUser.id}
                                        >
                                            <SelectTrigger className="bg-muted border-border focus:border-indigo-500/50 h-12 rounded-xl">
                                                <SelectValue placeholder="Select Access Tier" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-muted border-border text-foreground">
                                                {ROLE_OPTIONS.map((role) => (
                                                    <SelectItem key={role.value} value={role.value}>{role.label} ({role.description})</SelectItem>
                                                ))}
                                                {currentUser.role === 'super_admin' && (
                                                    <SelectItem value="super_admin">Super Admin (Root)</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                        {roleUpdateUser?.role === 'admin' && roleUpdateUser?.id !== currentUser.id && (
                                            <p className="text-[10px] text-rose-400 mt-2 flex items-center gap-1">
                                                <XCircle className="w-3 h-3" /> Security Policy: Cannot downgrade other administrative agents.
                                            </p>
                                        )}
                                        {roleUpdateUser?.id === currentUser.id && (
                                            <p className="text-[10px] text-amber-400 mt-2 flex items-center gap-1">
                                                <Shield className="w-3 h-3" /> Warning: Modifying self-identity may impact your system access.
                                            </p>
                                        )}
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setRoleUpdateUser(null)}
                                        className="text-muted-foreground hover:text-foreground hover:bg-muted h-12 rounded-xl"
                                        disabled={isLoading}
                                    >
                                        Abort
                                    </Button>
                                    <Button
                                        onClick={confirmRoleUpdate}
                                        disabled={isLoading || (roleUpdateUser?.role === 'admin' && newRole !== 'admin' && roleUpdateUser?.id !== currentUser.id)}
                                        className="bg-indigo-600 hover:bg-indigo-500 h-12 px-8 rounded-xl font-medium"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Authorize Change"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                    )}
                />

                <KpiCardGrid items={kpis} />

                {users.length > 0 && (
                    <OverviewBand className="mt-6">
                        <DonutStat title="Cơ cấu vai trò" subtitle="Tài khoản theo vai trò" tag={{ label: "Vai trò" }} slices={byRole} centerLabel="Tài khoản" />
                        <TrendArea title="Tài khoản mới" subtitle="Tạo trong 6 tháng gần nhất" tag={{ label: "6 tháng", tone: "teal" }} points={byMonth} color={colorAt(2)} />
                        <HBarList title="Theo tên miền email" subtitle="Nguồn tài khoản" tag={{ label: "Domain", tone: "violet" }} items={byDomain} />
                    </OverviewBand>
                )}

                <div className="relative mb-6 max-w-sm group">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                    <Input
                        placeholder="Tìm theo tên, email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-11 bg-muted/40 border-border rounded-xl text-foreground placeholder:text-muted-foreground/60"
                    />
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <StaggerContainer className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {filteredUsers.map((user, i) => (
                            <StaggerItem key={user.id}>
                                <Card className="glass-card glass-card-hover group relative overflow-hidden h-full border-none">
                                    <div className="absolute top-0 right-0 p-24 bg-primary/[0.03] rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <CardContent className="p-6 relative z-10">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-background/60 border border-border/10 flex items-center justify-center relative overflow-hidden group-hover:border-border/30 transition-colors">
                                                    <UserCircle className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-lg font-medium text-foreground group-hover:text-foreground transition-colors">{user.name}</h3>
                                                        <Badge
                                                            className="border-0 px-2 h-5 text-[10px] uppercase font-bold tracking-widest"
                                                            style={{ color: roleTone(user.role).ink, backgroundColor: roleTone(user.role).bg }}
                                                        >
                                                            {user.role}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                                                        <Mail className="w-3 h-3" />
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger render={
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                } />
                                                <DropdownMenuContent align="end" className="bg-muted border-border text-foreground w-48">
                                                    <DropdownMenuGroup>
                                                        <DropdownMenuLabel>Identity Controls</DropdownMenuLabel>
                                                        <DropdownMenuSeparator className="bg-muted" />
                                                        <DropdownMenuItem
                                                            className="focus:bg-muted gap-2 cursor-pointer"
                                                            onClick={() => handleResetCredentials(user)}
                                                        >
                                                            <Settings2 className="w-4 h-4 text-muted-foreground" />
                                                            Update Credentials
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="focus:bg-muted gap-2 cursor-pointer text-indigo-400 focus:text-indigo-400"
                                                            onClick={() => handleRoleUpdate(user)}
                                                        >
                                                            <Shield className="w-4 h-4" />
                                                            Change Access Level
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="focus:bg-muted gap-2 text-rose-400 focus:text-rose-400 cursor-pointer"
                                                            onClick={() => handleDeleteUser(user)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Purge Identity
                                                        </DropdownMenuItem>
                                                    </DropdownMenuGroup>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="mt-8 flex flex-wrap items-center gap-6 pt-6 border-t border-border/8">
                                            <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>Initialized: {new Date(user.created_at).toLocaleDateString("en-US", { month: 'short', year: 'numeric' })}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-widest">
                                                <Key className="w-3.5 h-3.5" />
                                                <span>Access: {ROLE_ACCESS_LABEL[user.role] ?? 'Standard'}</span>
                                            </div>
                                            {user.force_password_change && (
                                                <div className="flex items-center gap-2 text-[11px] font-semibold text-primary/70 uppercase tracking-widest bg-primary/5 px-2 py-1 rounded-md">
                                                    <Shield className="w-3.5 h-3.5" />
                                                    <span>Password Reset Required</span>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </PageContainer>
        </PageTransition>
    );
}
