"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { RefreshCw, Search, Users } from "lucide-react";
import { toast } from "sonner";
import AppNavbar from "@/components/ui/app-navbar";
import WorkplacePageHeader from "@/components/ui/workplace-page-header";
import PageContainer from "@/components/ui/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { readApiResponse } from "@/lib/api-response";

type EmployeeListItem = {
  id: string;
  name: string;
  email: string;
  role: string;
  faceEnrolled: boolean;
  faceEnrolledAt: string | null;
  attendanceCount: number;
  lastCheckIn: string | null;
  pendingViolations: number;
  totalViolations: number;
};

function vnDate(iso: string | null) {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Ho_Chi_Minh",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date(iso));
}

export default function EmployeesClient() {
  const [employees, setEmployees] = useState<EmployeeListItem[]>([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const response = await fetch("/api/employees", { cache: "no-store" });
      const data = await readApiResponse<{ employees?: EmployeeListItem[]; error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Unable to load employees");
      setEmployees(data.employees ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load employees");
    } finally {
      setBusy(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((row) =>
      [row.name, row.email, row.role].some((value) => value.toLowerCase().includes(q)),
    );
  }, [employees, query]);

  return (
    <div className="min-h-screen bg-[#121A2E] text-[#ECF0F7]">
      <AppNavbar />
      <PageContainer>
        <WorkplacePageHeader
          title="Employees"
          description="Profile, face enrollment, attendance, and violations in one place."
          breadcrumbs={[{ label: "Dashboard", href: "/dashboard" }, { label: "Employees" }]}
          actions={
            <Button variant="outline" size="icon" title="Refresh" onClick={() => void load()} disabled={busy}>
              <RefreshCw className="size-4" />
            </Button>
          }
        />

        <div className="mb-5 flex flex-wrap items-center gap-3">
          <div className="relative max-w-sm flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-[#5A6882]" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, email, or role"
              className="pl-9"
            />
          </div>
          <p className="text-sm text-[#8B99B0]">{filtered.length} people</p>
        </div>

        {filtered.length === 0 ? (
          <Card className="border-[#8B99B0]/10 bg-[#101828]">
            <CardContent className="flex items-center gap-3 p-8 text-sm text-[#8B99B0]">
              <Users className="size-5" />
              No employees yet. Enroll a face or add a local account to populate this list.
            </CardContent>
          </Card>
        ) : (
          <div className="overflow-hidden rounded-xl border border-[#8B99B0]/10 bg-[#101828]">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1A2236] text-[11px] uppercase tracking-[0.12em] text-[#5A6882]">
                <tr>
                  <th className="px-4 py-3 font-medium">Employee</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Face</th>
                  <th className="px-4 py-3 font-medium">Attendance</th>
                  <th className="px-4 py-3 font-medium">Violations</th>
                  <th className="px-4 py-3 font-medium">Last check-in</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id} className="border-t border-[#8B99B0]/10 hover:bg-[#1A2236]/60">
                    <td className="px-4 py-3">
                      <Link href={`/dashboard/employees/${row.id}`} className="block">
                        <p className="font-medium text-[#ECF0F7]">{row.name}</p>
                        <p className="text-xs text-[#8B99B0]">{row.email}</p>
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-[#8B99B0]">{row.role}</td>
                    <td className="px-4 py-3">
                      <Badge variant={row.faceEnrolled ? "default" : "outline"}>
                        {row.faceEnrolled ? "Enrolled" : "Missing"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-[#8B99B0]">{row.attendanceCount}</td>
                    <td className="px-4 py-3">
                      <span className="text-[#ECF0F7]">{row.totalViolations}</span>
                      {row.pendingViolations > 0 ? (
                        <span className="ml-2 text-xs text-[#F59E0B]">{row.pendingViolations} pending</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-[#8B99B0]">{vnDate(row.lastCheckIn)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </PageContainer>
    </div>
  );
}
