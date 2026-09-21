import { getAllFaceUsers, type FaceUserRecord } from "@/lib/face-store";
import {
  readLocalAttendance,
  readViolationAlerts,
  type LocalAttendanceSession,
  type LocalViolationAlert,
} from "@/lib/workplace-local";

export type EmployeeListItem = {
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

export type EmployeeDetail = EmployeeListItem & {
  enrollment: FaceUserRecord["enrollment"];
  attendance: LocalAttendanceSession[];
  violations: LocalViolationAlert[];
};

function matchesUser(user: FaceUserRecord, userId: string, profileName?: string | null) {
  if (userId && userId === user.id) return true;
  if (profileName && profileName.trim().toLowerCase() === user.name.trim().toLowerCase()) return true;
  return false;
}

export async function listEmployees(): Promise<EmployeeListItem[]> {
  const [users, attendance, alerts] = await Promise.all([
    getAllFaceUsers(),
    readLocalAttendance(),
    readViolationAlerts(),
  ]);

  return users
    .map((user) => {
      const sessions = attendance.filter((row) => row.user_id === user.id);
      const lastCheckIn = sessions
        .map((row) => row.check_in_at)
        .sort()
        .at(-1) ?? null;
      const violations = alerts.filter((row) => matchesUser(user, row.user_id, row.profile_name));
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        faceEnrolled: Boolean(user.enrollment),
        faceEnrolledAt: user.enrollment?.created_at ?? null,
        attendanceCount: sessions.length,
        lastCheckIn,
        pendingViolations: violations.filter((row) => row.status === "pending_review").length,
        totalViolations: violations.length,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getEmployee(id: string): Promise<EmployeeDetail | null> {
  const [users, attendance, alerts] = await Promise.all([
    getAllFaceUsers(),
    readLocalAttendance(),
    readViolationAlerts(),
  ]);
  const user = users.find((row) => row.id === id);
  if (!user) return null;
  const sessions = attendance.filter((row) => row.user_id === user.id);
  const violations = alerts
    .filter((row) => matchesUser(user, row.user_id, row.profile_name))
    .sort((a, b) => String(b.detected_at).localeCompare(String(a.detected_at)));
  const lastCheckIn = sessions.map((row) => row.check_in_at).sort().at(-1) ?? null;
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    faceEnrolled: Boolean(user.enrollment),
    faceEnrolledAt: user.enrollment?.created_at ?? null,
    attendanceCount: sessions.length,
    lastCheckIn,
    pendingViolations: violations.filter((row) => row.status === "pending_review").length,
    totalViolations: violations.length,
    enrollment: user.enrollment,
    attendance: sessions.sort((a, b) => String(b.check_in_at).localeCompare(String(a.check_in_at))),
    violations,
  };
}
