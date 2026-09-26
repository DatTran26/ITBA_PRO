import { toneByName, type ToneName } from "./tones";

/** Tông + nhãn cố định theo vai trò — cùng vai trò luôn cùng màu ở pill và biểu đồ. */
export const ROLE_ORDER = ["super_admin", "admin", "leader", "hr", "interviewer", "recruiter"] as const;

const ROLE_TONE: Record<string, ToneName> = {
    super_admin: "pink", admin: "blue", leader: "teal", hr: "orange", interviewer: "violet", recruiter: "gold",
};

export const ROLE_LABEL: Record<string, string> = {
    super_admin: "Super Admin", admin: "Admin", leader: "Leader", hr: "HR", interviewer: "Interviewer", recruiter: "Recruiter",
};

export const roleTone = (role: string) => toneByName(ROLE_TONE[role] ?? "gold");
