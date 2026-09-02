import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import { generateCsv, type ExportColumn } from "@/lib/export/csv-export";

const RESULTS_COLUMNS: ExportColumn[] = [
  { key: "candidate_name", header: "Candidate Name" },
  { key: "candidate_email", header: "Candidate Email" },
  { key: "test_name", header: "Test Name" },
  { key: "score", header: "Score" },
  { key: "total_questions", header: "Total Questions" },
  { key: "status", header: "Status" },
  { key: "submitted_at", header: "Submitted At", format: (v) => v ? new Date(v as string).toISOString() : "" },
];

const SKILLS_COLUMNS: ExportColumn[] = [
  { key: "name", header: "Skill Name" },
  { key: "category", header: "Category" },
  { key: "created_at", header: "Created At", format: (v) => v ? new Date(v as string).toISOString() : "" },
];

const CANDIDATES_COLUMNS: ExportColumn[] = [
  { key: "full_name", header: "Full Name" },
  { key: "email", header: "Email" },
  { key: "type", header: "Type" },
  { key: "department", header: "Department" },
  { key: "current_level", header: "Level" },
  { key: "created_at", header: "Created At", format: (v) => v ? new Date(v as string).toISOString() : "" },
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ type: string }> }
) {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, isAdmin } = ctx;

  if (!isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { type } = await params;

  try {
    let csvContent = "";
    const filename = `${type}-export-${Date.now()}.csv`;

    if (type === "results") {
      const { data, error } = await supabase
        .from("results")
        .select("candidate_name, candidate_email, tests(title), score, total_questions, status, submitted_at")
        .order("submitted_at", { ascending: false })
        .limit(1000);

      if (error) return NextResponse.json({ error: "Failed to fetch results" }, { status: 500 });

      const rows = (data ?? []).map((r) => ({
        candidate_name: r.candidate_name ?? "",
        candidate_email: r.candidate_email ?? "",
        test_name: (r.tests as { title?: string } | null)?.title ?? "",
        score: r.score ?? 0,
        total_questions: r.total_questions ?? 0,
        status: r.status ?? "",
        submitted_at: r.submitted_at ?? "",
      }));
      csvContent = generateCsv(RESULTS_COLUMNS, rows as Record<string, unknown>[]);

    } else if (type === "skills") {
      const { data, error } = await supabase
        .from("skills")
        .select("name, category, created_at")
        .order("name", { ascending: true })
        .limit(1000);

      if (error) return NextResponse.json({ error: "Failed to fetch skills" }, { status: 500 });
      csvContent = generateCsv(SKILLS_COLUMNS, (data ?? []) as Record<string, unknown>[]);

    } else if (type === "candidates") {
      const { data, error } = await supabase
        .from("persons")
        .select("full_name, email, type, department, current_level, created_at")
        .order("full_name", { ascending: true })
        .limit(1000);

      if (error) return NextResponse.json({ error: "Failed to fetch candidates" }, { status: 500 });
      csvContent = generateCsv(CANDIDATES_COLUMNS, (data ?? []) as Record<string, unknown>[]);

    } else {
      return NextResponse.json({ error: "Invalid export type" }, { status: 400 });
    }

    return new Response(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
