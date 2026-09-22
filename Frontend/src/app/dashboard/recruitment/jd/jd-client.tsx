"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, CheckCircle, XCircle } from "lucide-react";
import JdFormDialog from "@/components/recruitment/jd-form-dialog";

interface JD {
  id: string;
  title: string;
  role_key: string | null;
  department: string | null;
  seniority: string | null;
  required_skills: { skill: string; weight?: number }[];
  auto_reject_threshold: number | null;
  is_active: boolean;
  created_at: string;
}

interface Props { userRole: string }

const CAN_WRITE = (role: string) => role === "interviewer" || role === "admin" || role === "super_admin";

export default function JdClient({ userRole }: Props) {
  const [jds, setJds] = useState<JD[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchJds = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/recruitment/job-descriptions");
    const data = await res.json();
    setJds(data.jobDescriptions ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchJds(); }, [fetchJds]);

  async function handleDelete(id: string) {
    if (!confirm("Xóa JD này? Nếu đang được dùng sẽ chuyển sang inactive.")) return;
    setDeletingId(id);
    await fetch(`/api/recruitment/job-descriptions/${id}`, { method: "DELETE" });
    setDeletingId(null);
    fetchJds();
  }

  const canWrite = CAN_WRITE(userRole);

  return (
    <div className="py-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-foreground">Job Descriptions</h1>
        {canWrite && (
          <JdFormDialog
            mode="create"
            onSuccess={fetchJds}
            trigger={
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:bg-primary/80 transition-colors">
                <Plus className="w-4 h-4" /> Tạo JD
              </button>
            }
          />
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-border/30 border-t-border rounded-full animate-spin" />
        </div>
      ) : jds.length === 0 ? (
        <div className="glass-card p-10 text-center text-muted-foreground text-sm">
          Chưa có Job Description nào.
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {jds.map((jd) => (
            <div key={jd.id} className="glass-card p-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  {jd.is_active
                    ? <CheckCircle className="w-3.5 h-3.5 text-success shrink-0" />
                    : <XCircle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  }
                  <span className="text-sm font-medium text-foreground">{jd.title}</span>
                  {jd.seniority && <span className="text-xs text-muted-foreground">· {jd.seniority}</span>}
                </div>

                {(jd.department || jd.role_key) && (
                  <p className="text-xs text-muted-foreground ml-5">
                    {[jd.department, jd.role_key].filter(Boolean).join(" · ")}
                  </p>
                )}

                {jd.required_skills.length > 0 && (
                  <div className="flex flex-wrap gap-1 ml-5 mt-1">
                    {jd.required_skills.slice(0, 6).map((s) => (
                      <span key={s.skill} className="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary">{s.skill}</span>
                    ))}
                    {jd.required_skills.length > 6 && (
                      <span className="text-[10px] text-muted-foreground">+{jd.required_skills.length - 6}</span>
                    )}
                  </div>
                )}

                {jd.auto_reject_threshold != null && (
                  <p className="text-xs text-warning ml-5">Gợi ý review &lt; {jd.auto_reject_threshold}</p>
                )}
              </div>

              {canWrite && (
                <div className="flex items-center gap-2 ml-5 sm:ml-0 shrink-0">
                  <JdFormDialog
                    mode="edit"
                    jd={jd}
                    onSuccess={fetchJds}
                    trigger={
                      <button className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    }
                  />
                  <button
                    onClick={() => handleDelete(jd.id)}
                    disabled={deletingId === jd.id}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-danger hover:bg-danger/10 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
