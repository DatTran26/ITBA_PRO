"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";
import AppNavbar from "@/components/ui/app-navbar";
import WorkplacePageHeader from "@/components/ui/workplace-page-header";
import PageContainer from "@/components/ui/page-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { readApiResponse } from "@/lib/api-response";

type EmployeeDetail = {
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
  enrollment: { id: string; created_at: string; imageCount?: number; hasLocalFiles?: boolean } | null;
  attendance: Array<{
    id: string;
    date: string;
    check_in_at: string;
    check_out_at: string | null;
    work_duration_minutes: number | null;
    status: string;
  }>;
  violations: Array<{
    id: string;
    detected_at: string;
    violation_type: string;
    severity: string;
    status: string;
    camera_location: string;
  }>;
};

function vnDate(iso: string | null | undefined) {
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

export default function EmployeeDetailClient({ employeeId }: { employeeId: string }) {
  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setBusy(true);
    try {
      const response = await fetch(`/api/employees/${employeeId}`, { cache: "no-store" });
      const data = await readApiResponse<{ employee?: EmployeeDetail; error?: string }>(response);
      if (!response.ok) throw new Error(data.error ?? "Unable to load employee");
      setEmployee(data.employee ?? null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load employee");
    } finally {
      setBusy(false);
    }
  }, [employeeId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="min-h-screen bg-[#121A2E] text-[#ECF0F7]">
      <AppNavbar />
      <PageContainer>
        <WorkplacePageHeader
          title={employee?.name ?? "Employee"}
          description={employee?.email}
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Employees", href: "/dashboard/employees" },
            { label: employee?.name ?? "Detail" },
          ]}
          actions={
            <Button variant="outline" size="icon" title="Refresh" onClick={() => void load()} disabled={busy}>
              <RefreshCw className="size-4" />
            </Button>
          }
        />

        {!employee ? (
          <p className="text-sm text-[#8B99B0]">{busy ? "Loading…" : "Employee not found."}</p>
        ) : (
          <Tabs defaultValue="profile">
            <TabsList className="mb-4 bg-[#222C4A]">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="face">Face</TabsTrigger>
              <TabsTrigger value="attendance">Attendance ({employee.attendance.length})</TabsTrigger>
              <TabsTrigger value="violations">Violations ({employee.violations.length})</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <Card className="border-[#8B99B0]/10 bg-[#101828]">
                <CardHeader>
                  <CardTitle className="text-lg font-medium">Ordinary data</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
                  <Field label="Name" value={employee.name} />
                  <Field label="Email" value={employee.email} />
                  <Field label="Role" value={employee.role} />
                  <Field label="User id" value={employee.id} />
                  <Field label="Attendance sessions" value={String(employee.attendanceCount)} />
                  <Field label="Pending violations" value={String(employee.pendingViolations)} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="face">
              <Card className="border-[#8B99B0]/10 bg-[#101828]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-medium">Face enrollment</CardTitle>
                  <Link href="/dashboard/faces">
                    <Button variant="outline">Open Face Management</Button>
                  </Link>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <Badge variant={employee.faceEnrolled ? "default" : "outline"}>
                    {employee.faceEnrolled ? "Enrolled" : "Not enrolled"}
                  </Badge>
                  <Field label="Enrolled at" value={vnDate(employee.faceEnrolledAt)} />
                  <Field label="Images" value={employee.enrollment?.imageCount != null ? String(employee.enrollment.imageCount) : "—"} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance">
              {employee.attendance.length === 0 ? (
                <p className="text-sm text-[#8B99B0]">No attendance records for this person yet.</p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#8B99B0]/10 bg-[#101828]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#1A2236] text-[11px] uppercase tracking-[0.12em] text-[#5A6882]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Date</th>
                        <th className="px-4 py-3 font-medium">Check-in</th>
                        <th className="px-4 py-3 font-medium">Check-out</th>
                        <th className="px-4 py-3 font-medium">Minutes</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employee.attendance.map((row) => (
                        <tr key={row.id} className="border-t border-[#8B99B0]/10">
                          <td className="px-4 py-3">{row.date}</td>
                          <td className="px-4 py-3 text-[#8B99B0]">{vnDate(row.check_in_at)}</td>
                          <td className="px-4 py-3 text-[#8B99B0]">{vnDate(row.check_out_at)}</td>
                          <td className="px-4 py-3 text-[#8B99B0]">{row.work_duration_minutes ?? "—"}</td>
                          <td className="px-4 py-3">{row.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            <TabsContent value="violations">
              <div className="mb-3">
                <Link href="/dashboard/behavior">
                  <Button variant="outline">Open Behavior Review</Button>
                </Link>
              </div>
              {employee.violations.length === 0 ? (
                <p className="text-sm text-[#8B99B0]">No violations recorded for this person yet.</p>
              ) : (
                <div className="overflow-hidden rounded-xl border border-[#8B99B0]/10 bg-[#101828]">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-[#1A2236] text-[11px] uppercase tracking-[0.12em] text-[#5A6882]">
                      <tr>
                        <th className="px-4 py-3 font-medium">Detected</th>
                        <th className="px-4 py-3 font-medium">Type</th>
                        <th className="px-4 py-3 font-medium">Severity</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                        <th className="px-4 py-3 font-medium">Camera</th>
                      </tr>
                    </thead>
                    <tbody>
                      {employee.violations.map((row) => (
                        <tr key={row.id} className="border-t border-[#8B99B0]/10">
                          <td className="px-4 py-3 text-[#8B99B0]">{vnDate(row.detected_at)}</td>
                          <td className="px-4 py-3">{row.violation_type}</td>
                          <td className="px-4 py-3 text-[#8B99B0]">{row.severity}</td>
                          <td className="px-4 py-3">{row.status}</td>
                          <td className="px-4 py-3 text-[#8B99B0]">{row.camera_location}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </PageContainer>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.12em] text-[#5A6882]">{label}</p>
      <p className="mt-1 text-[#ECF0F7]">{value}</p>
    </div>
  );
}
