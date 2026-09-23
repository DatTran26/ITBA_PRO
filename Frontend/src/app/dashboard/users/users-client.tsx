"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
    Users,
    Search,
    MoreHorizontal,
    Shield,
    UserPlus,
    Trash2,
    Settings2,
    ShieldCheck,
    Loader2,
    XCircle,
    Copy,
    Check,
    KeyRound
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PageTransition } from "@/components/ui/motion-wrapper";
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
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { SharedDashboardPageHeader } from "@/components/shares";
import { ROLE_ORDER, ROLE_LABEL, roleTone } from "@/lib/ui/roles";

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
    const [roleFilter, setRoleFilter] = useState<string>("");
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

    const countRole = (role: string) => users.filter((u) => u.role === role).length;
    const resetCount = users.filter((u) => u.force_password_change).length;
    const rail = [
        { key: "", label: "Tất cả", hint: "Mọi tài khoản", count: users.length, color: "var(--foreground)" },
        ...ROLE_ORDER.map((r) => ({ key: r as string, label: ROLE_LABEL[r], hint: ROLE_ACCESS_LABEL[r], count: countRole(r), color: roleTone(r).mark })),
    ];

    const filteredUsers = users.filter(u =>
        (roleFilter === "" || (roleFilter === "reset" ? u.force_password_change : u.role === roleFilter)) &&
        (u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()))
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

                <div className="grid grid-cols-[260px_1fr] gap-6 items-start">
                    {/* Rail vai trò: đếm + lọc */}
                    <nav className="sticky top-24 rounded-2xl border border-border bg-card p-2 shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)]">
                        <p className="px-3 pt-2 pb-1 text-[11px] font-bold uppercase tracking-wide text-muted-foreground">Vai trò</p>
                        {rail.map((r) => {
                            const on = roleFilter === r.key;
                            return (
                                <button key={r.key || "all"} type="button" onClick={() => setRoleFilter(r.key)} aria-pressed={on}
                                        className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer ${on ? "bg-accent" : "hover:bg-muted"} ${r.count === 0 && r.key ? "opacity-50" : ""}`}>
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                                    <span className="flex-1 min-w-0">
                                        <span className={`block text-sm truncate ${on ? "font-extrabold text-foreground" : "font-semibold text-foreground"}`}>{r.label}</span>
                                        <span className="block text-[11px] text-muted-foreground truncate">{r.hint}</span>
                                    </span>
                                    <span className="text-sm font-bold tabular-nums text-muted-foreground">{r.count}</span>
                                </button>
                            );
                        })}
                        <div className="my-2 border-t border-border" />
                        <button type="button" onClick={() => setRoleFilter("reset")} aria-pressed={roleFilter === "reset"}
                                className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors cursor-pointer ${roleFilter === "reset" ? "bg-accent" : "hover:bg-muted"}`}>
                            <KeyRound className="w-4 h-4 shrink-0 text-warning" />
                            <span className="flex-1 text-sm font-semibold text-foreground">Chờ đổi mật khẩu</span>
                            <span className={`text-sm font-bold tabular-nums ${resetCount ? "text-warning" : "text-muted-foreground"}`}>{resetCount}</span>
                        </button>
                    </nav>

                    {/* Roster */}
                    <section className="rounded-2xl border border-border bg-card overflow-hidden shadow-[0_2px_14px_color-mix(in_srgb,var(--primary)_8%,transparent)]">
                        <div className="flex items-center justify-between gap-4 px-5 py-4 border-b border-border">
                            <div>
                                <h2 className="text-lg font-extrabold text-foreground">
                                    {roleFilter === "reset" ? "Chờ đổi mật khẩu" : roleFilter ? ROLE_LABEL[roleFilter] : "Tất cả tài khoản"}
                                </h2>
                                <p className="text-xs text-muted-foreground tabular-nums">{filteredUsers.length} tài khoản</p>
                            </div>
                            <div className="relative w-72 group">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                                <Input
                                    placeholder="Tìm theo tên, email..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10 h-10 bg-muted/40 border-border rounded-xl text-foreground placeholder:text-muted-foreground/60"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-[1fr_140px_200px_110px_40px] gap-4 px-5 py-2.5 text-[11px] font-bold uppercase tracking-wide text-muted-foreground bg-muted/40">
                            <span>Người dùng</span><span>Vai trò</span><span>Quyền</span><span>Tạo lúc</span><span />
                        </div>
                        {filteredUsers.length === 0 && (
                            <p className="px-5 py-12 text-center text-sm text-muted-foreground">Không có tài khoản nào khớp</p>
                        )}
                        <ul className="divide-y divide-border">
                            {filteredUsers.map((user) => {
                                const tone = roleTone(user.role);
                                const isMe = user.id === currentUser.id;
                                return (
                                    <li key={user.id} className="grid grid-cols-[1fr_140px_200px_110px_40px] items-center gap-4 px-5 py-3 hover:bg-muted/40 transition-colors">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="w-10 h-10 shrink-0 rounded-full grid place-items-center text-xs font-bold" style={{ color: tone.ink, backgroundColor: tone.bg }}>
                                                {(user.name || user.email).trim().split(/\s+/).map((w) => w[0]).slice(-2).join("").toUpperCase()}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="flex items-center gap-2 font-bold text-foreground truncate">
                                                    {user.name}
                                                    {isMe && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">Bạn</span>}
                                                    {user.force_password_change && (
                                                        <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-warning bg-warning/10">
                                                            <KeyRound className="w-3 h-3" />Chờ đổi mật khẩu
                                                        </span>
                                                    )}
                                                </p>
                                                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                                            </div>
                                        </div>
                                        <span className="justify-self-start rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ color: tone.ink, backgroundColor: tone.bg }}>
                                            {ROLE_LABEL[user.role] ?? user.role}
                                        </span>
                                        <span className="text-xs text-muted-foreground truncate">{ROLE_ACCESS_LABEL[user.role] ?? "Standard"}</span>
                                        <span className="text-xs text-muted-foreground tabular-nums">
                                            {new Date(user.created_at).toLocaleDateString("vi-VN")}
                                        </span>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger render={
                                                <Button variant="ghost" size="icon" aria-label="Thao tác" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
                                                    <MoreHorizontal className="w-4 h-4" />
                                                </Button>
                                            } />
                                            <DropdownMenuContent align="end" className="bg-card border-border text-foreground w-52">
                                                <DropdownMenuGroup>
                                                    <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleResetCredentials(user)}>
                                                        <Settings2 className="w-4 h-4 text-muted-foreground" />Cấp lại mật khẩu
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 cursor-pointer" onClick={() => handleRoleUpdate(user)}>
                                                        <Shield className="w-4 h-4 text-muted-foreground" />Đổi vai trò
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem className="gap-2 cursor-pointer text-danger focus:text-danger" onClick={() => handleDeleteUser(user)}>
                                                        <Trash2 className="w-4 h-4" />Xóa tài khoản
                                                    </DropdownMenuItem>
                                                </DropdownMenuGroup>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </li>
                                );
                            })}
                        </ul>
                    </section>
                </div>
            </PageContainer>
        </PageTransition>
    );
}
