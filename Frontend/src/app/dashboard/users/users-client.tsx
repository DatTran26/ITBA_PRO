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
    Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { PageTransition, FadeIn, StaggerContainer, StaggerItem } from "@/components/ui/motion-wrapper";
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

const ROLE_BADGE_CLASS: Record<string, string> = {
    user: "bg-slate-500/10 text-slate-300 border-slate-500/20",
    super_admin: "bg-rose-500/10 text-rose-400 border-rose-500/20",
    admin: "bg-[#7C8FFF]/10 text-[#7C8FFF] border-[#7C8FFF]/20",
    leader: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    hr: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    interviewer: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
    recruiter: "bg-[#8B99B0]/5 text-[#8B99B0] border-[#8B99B0]/10",
};

const ROLE_ACCESS_LABEL: Record<string, string> = {
    user: "Awaiting Role Assignment",
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
        <PageTransition className="min-h-screen bg-[#121A2E] text-[#ECF0F7] font-body selection:bg-[#7C8FFF]/30 overflow-hidden relative">

            {/* Mesh Gradient Decor */}
            <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-60">
                <div className="absolute top-[10%] right-[-10%] w-[40%] h-[40%] bg-[#5B6CF0]/[0.05] blur-[120px] rounded-full" />
                <div className="absolute bottom-[20%] left-[-10%] w-[30%] h-[30%] bg-[#7C8FFF]/[0.03] blur-[100px] rounded-full" />
            </div>

            <AppNavbar user={currentUser} />

            <PageContainer className="relative z-10">
                <PageBreadcrumb breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Identity Management" }]} />


                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <FadeIn>
                        <h1 className="text-4xl font-light font-display text-white mb-2">User Directory</h1>
                        <p className="text-white/40 font-light">Manage system access protocols and administrative agents.</p>
                    </FadeIn>

                    <div className="flex items-center gap-4">
                        <FadeIn delay={0.1} className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5A6882] group-focus-within:text-[#7C8FFF] transition-colors" />
                            <Input
                                placeholder="Filter identities..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 w-[240px] md:w-[320px] bg-[#1B253B]/60 border-[#8B99B0]/10 text-[#ECF0F7] placeholder:text-[#5A6882]/70 h-11 rounded-xl focus:border-[#7C8FFF]/40 transition-all font-light"
                            />
                        </FadeIn>

                        <Dialog open={isAddingUser} onOpenChange={setIsAddingUser}>
                            <DialogTrigger asChild>
                                <Button className="bg-[#7C8FFF] hover:bg-[#7C8FFF]/90 text-black shadow-[0_0_20px_rgba(124,143,255,0.3)] hover:-translate-y-0.5 transition-all h-11 px-6 rounded-xl gap-2 font-semibold cursor-pointer">
                                    <UserPlus className="w-4 h-4" />
                                    Provision Identity
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-[#1B253B] border-white/10 text-white sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-display">Provision System Agent</DialogTitle>
                                    <DialogDescription className="text-white/40">
                                        Assign a new operative to the system. A unique security passphrase will be generated automatically.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="space-y-4 py-6">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-white/50">Designation (Name)</Label>
                                        <Input
                                            id="name"
                                            value={newUser.name}
                                            onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                                            className="bg-white/5 border-white/10 focus:border-indigo-500/50 h-12 rounded-xl"
                                            placeholder="Agent Identification"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-xs font-semibold uppercase tracking-wider text-white/50">Neural Link (Email)</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            value={newUser.email}
                                            onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                                            className="bg-white/5 border-white/10 focus:border-indigo-500/50 h-12 rounded-xl"
                                            placeholder="node@system.local"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="role" className="text-xs font-semibold uppercase tracking-wider text-white/50">Access Level</Label>
                                        <Select value={newUser.role} onValueChange={(v) => setNewUser({ ...newUser, role: v || "recruiter" })}>
                                            <SelectTrigger className="bg-white/5 border-white/10 focus:border-indigo-500/50 h-12 rounded-xl">
                                                <SelectValue placeholder="Select Access Tier" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#1B253B] border-white/10 text-white">
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
                                        className="text-white/40 hover:text-white hover:bg-white/5 h-12 rounded-xl"
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
                            <DialogContent className="bg-[#1B253B] border-white/10 text-white sm:max-w-[425px]">
                                <DialogHeader>
                                    <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                                    </div>
                                    <DialogTitle className="text-xl font-display">Identity Provisioned</DialogTitle>
                                    <DialogDescription className="text-white/40">
                                        Share these credentials securely. The user will be required to change their passphrase upon first login.
                                    </DialogDescription>
                                </DialogHeader>
                                {createdCredentials && (
                                    <div className="space-y-4 py-4">
                                        <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-3">
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">Name</p>
                                                <p className="text-sm font-medium text-white/90">{createdCredentials.name}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">Email</p>
                                                <p className="text-sm font-medium text-white/90">{createdCredentials.email}</p>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">Role</p>
                                                <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20 px-2 h-5 text-[10px] uppercase font-bold tracking-widest">
                                                    {createdCredentials.role}
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-semibold uppercase tracking-widest text-white/40 mb-1">Temporary Passphrase</p>
                                                <div className="flex items-center justify-between bg-black/40 border border-white/10 rounded-lg p-2">
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
                            <DialogContent className="bg-[#1B253B] border-white/10 text-white sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-display">Confirm Credential Reset</DialogTitle>
                                    <DialogDescription className="text-white/40">
                                        {resetConfirmationUser ? `Initiate credential reset protocol for ${resetConfirmationUser.email}? A new temporary passphrase will be generated.` : ''}
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setResetConfirmationUser(null)}
                                        className="text-white/40 hover:text-white hover:bg-white/5 h-12 rounded-xl"
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
                            <DialogContent className="bg-[#1B253B] border-white/10 text-white sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-display text-rose-500">Confirm Identity Purge</DialogTitle>
                                    <DialogDescription className="text-white/40">
                                        {deleteConfirmationUser ? `Confirm identity termination protocol for ${deleteConfirmationUser.email}? This action is irreversible and all associated access will be permanently revoked.` : ''}
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setDeleteConfirmationUser(null)}
                                        className="text-white/40 hover:text-white hover:bg-white/5 h-12 rounded-xl"
                                        disabled={isLoading}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={confirmDeleteUser}
                                        disabled={isLoading}
                                        className="bg-rose-600 hover:bg-rose-500 text-white h-12 px-8 rounded-xl font-medium"
                                    >
                                        {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Purge Identity"}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                        {/* Role Update Dialog */}
                        <Dialog open={!!roleUpdateUser} onOpenChange={(open) => !open && setRoleUpdateUser(null)}>
                            <DialogContent className="bg-[#1B253B] border-white/10 text-white sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle className="text-xl font-display">Update Access Level</DialogTitle>
                                    <DialogDescription className="text-white/40">
                                        Modify administrative permissions for {roleUpdateUser?.email}.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-6 space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">Current Role</Label>
                                        <div className="flex items-center gap-2 p-3 bg-white/5 border border-white/10 rounded-xl">
                                            <Shield className="w-4 h-4 text-indigo-400" />
                                            <span className="capitalize">{roleUpdateUser?.role}</span>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-xs font-semibold uppercase tracking-wider text-white/50">New Access Tier</Label>
                                        <Select
                                            value={newRole}
                                            onValueChange={(v) => setNewRole(v || "")}
                                            disabled={roleUpdateUser?.role === 'admin' && roleUpdateUser?.id !== currentUser.id}
                                        >
                                            <SelectTrigger className="bg-white/5 border-white/10 focus:border-indigo-500/50 h-12 rounded-xl">
                                                <SelectValue placeholder="Select Access Tier" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#1B253B] border-white/10 text-white">
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
                                        className="text-white/40 hover:text-white hover:bg-white/5 h-12 rounded-xl"
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
                </div>

                <div className="grid grid-cols-1 gap-6">
                    <StaggerContainer className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                        {filteredUsers.map((user, i) => (
                            <StaggerItem key={user.id}>
                                <Card className="glass-card glass-card-hover group relative overflow-hidden h-full border-none">
                                    <div className="absolute top-0 right-0 p-24 bg-[#7C8FFF]/[0.03] rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                                    <CardContent className="p-6 relative z-10">
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-4">
                                                <div className="w-14 h-14 rounded-2xl bg-[#121A2E]/60 border border-[#8B99B0]/10 flex items-center justify-center relative overflow-hidden group-hover:border-[#7C8FFF]/30 transition-colors">
                                                    <UserCircle className="w-8 h-8 text-[#5A6882] group-hover:text-[#7C8FFF] transition-colors" />
                                                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 border-2 border-[#1B253B] rounded-full" title="Status: Online" />
                                                </div>
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <h3 className="text-lg font-medium text-[#ECF0F7] group-hover:text-white transition-colors">{user.name}</h3>
                                                        <Badge className={`${ROLE_BADGE_CLASS[user.role] ?? ROLE_BADGE_CLASS.recruiter} px-2 h-5 text-[10px] uppercase font-bold tracking-widest`}>
                                                            {user.role}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-sm text-[#8B99B0] flex items-center gap-2">
                                                        <Mail className="w-3 h-3" />
                                                        {user.email}
                                                    </p>
                                                </div>
                                            </div>

                                            <DropdownMenu>
                                                <DropdownMenuTrigger render={
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-white/20 hover:text-white hover:bg-white/5 rounded-lg">
                                                        <MoreHorizontal className="w-4 h-4" />
                                                    </Button>
                                                } />
                                                <DropdownMenuContent align="end" className="bg-[#1B253B] border-white/10 text-white w-48">
                                                    <DropdownMenuGroup>
                                                        <DropdownMenuLabel>Identity Controls</DropdownMenuLabel>
                                                        <DropdownMenuSeparator className="bg-white/5" />
                                                        <DropdownMenuItem
                                                            className="focus:bg-white/5 gap-2 cursor-pointer"
                                                            onClick={() => handleResetCredentials(user)}
                                                        >
                                                            <Settings2 className="w-4 h-4 text-white/40" />
                                                            Update Credentials
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="focus:bg-white/5 gap-2 cursor-pointer text-indigo-400 focus:text-indigo-400"
                                                            onClick={() => handleRoleUpdate(user)}
                                                        >
                                                            <Shield className="w-4 h-4" />
                                                            Change Access Level
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="focus:bg-white/5 gap-2 text-rose-400 focus:text-rose-400 cursor-pointer"
                                                            onClick={() => handleDeleteUser(user)}
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                            Purge Identity
                                                        </DropdownMenuItem>
                                                    </DropdownMenuGroup>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>

                                        <div className="mt-8 flex flex-wrap items-center gap-6 pt-6 border-t border-[#8B99B0]/8">
                                            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#5A6882] uppercase tracking-widest">
                                                <Calendar className="w-3.5 h-3.5" />
                                                <span>Initialized: {new Date(user.created_at).toLocaleDateString("en-US", { month: 'short', year: 'numeric' })}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[11px] font-semibold text-[#5A6882] uppercase tracking-widest">
                                                <Key className="w-3.5 h-3.5" />
                                                <span>Access: {ROLE_ACCESS_LABEL[user.role] ?? 'Standard'}</span>
                                            </div>
                                            {user.force_password_change && (
                                                <div className="flex items-center gap-2 text-[11px] font-semibold text-[#7C8FFF]/70 uppercase tracking-widest bg-[#7C8FFF]/5 px-2 py-1 rounded-md">
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
