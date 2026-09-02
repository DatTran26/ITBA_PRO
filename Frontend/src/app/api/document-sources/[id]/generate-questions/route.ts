import { NextResponse } from "next/server";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

export const runtime = "nodejs";

type RouteParams = { params: Promise<{ id: string }> };

const VALID_QUESTION_TYPES = new Set([
  "single_choice",
  "multiple_choice",
  "true_false",
  "matching",
  "fill_blank",
  "scenario",
  "ordering",
  "reading_comprehension",
  "priority_severity",
  "short_case_study",
  "image_diagram",
  "communication_response",
  "short_answer",
  "sql_logic_code",
]);

interface GenerateConfig {
  approvedTopicIds: string[];
  perTopicCounts?: Record<string, number>;
  levelRatio?: { junior: number; middle: number; senior: number };
  questionTypes?: string[];
}

export async function POST(req: Request, { params }: RouteParams) {
  const { id: documentId } = await params;
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;
  const { supabase, userId, isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = (await req.json()) as GenerateConfig;
  if (!body.approvedTopicIds?.length) {
    return NextResponse.json({ error: "approvedTopicIds required" }, { status: 400 });
  }

  // 1. Validate approvedTopicIds are strings
  if (!body.approvedTopicIds.every(id => typeof id === "string" && id.length > 0)) {
    return NextResponse.json({ error: "Invalid approvedTopicIds" }, { status: 400 });
  }

  // 2. Validate perTopicCounts if provided, default to 5
  const perTopicCounts: Record<string, number> = {};
  for (const topicId of body.approvedTopicIds) {
    const rawCount = body.perTopicCounts?.[topicId];
    if (rawCount === undefined) {
      perTopicCounts[topicId] = 5;
    } else {
      if (typeof rawCount !== "number" || rawCount < 1 || rawCount > 20) {
        return NextResponse.json({ error: "Each topic count must be between 1 and 20" }, { status: 400 });
      }
      perTopicCounts[topicId] = rawCount;
    }
  }

  // 3. Validate levelRatio if provided, default to 40-40-20
  const levelRatio = body.levelRatio || { junior: 40, middle: 40, senior: 20 };
  const { junior, middle, senior } = levelRatio;
  if (
    typeof junior !== "number" || junior < 0 ||
    typeof middle !== "number" || middle < 0 ||
    typeof senior !== "number" || senior < 0 ||
    Math.abs(junior + middle + senior - 100) > 0.01
  ) {
    return NextResponse.json({ error: "Level ratio junior, middle, senior must sum to 100%" }, { status: 400 });
  }

  // 4. Validate questionTypes if provided, default to multiple_choice
  const questionTypes = body.questionTypes || ["multiple_choice"];
  if (!Array.isArray(questionTypes) || questionTypes.length === 0) {
    return NextResponse.json({ error: "At least one question type is required" }, { status: 400 });
  }
  for (const qt of questionTypes) {
    if (!VALID_QUESTION_TYPES.has(qt)) {
      return NextResponse.json({ error: `Invalid question type: ${qt}` }, { status: 400 });
    }
  }

  // 5. Total questions soft cap at server level (cost control)
  const totalQuestions = body.approvedTopicIds.reduce((sum, id) => sum + perTopicCounts[id], 0);
  if (totalQuestions > 120) {
    return NextResponse.json({ error: "Total requested questions exceed server limit of 120" }, { status: 400 });
  }

  const { data: doc } = await supabase
    .from("document_sources")
    .select("id, created_by")
    .eq("id", documentId)
    .single();

  if (!doc) return NextResponse.json({ error: "Document not found" }, { status: 404 });
  if (!isAdmin && doc.created_by !== userId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Fire-and-forget — client polls document_sources.status
  supabase.functions
    .invoke("generate-questions-from-doc", {
      body: {
        documentId,
        approvedTopicIds: body.approvedTopicIds,
        perTopicCounts,
        levelRatio,
        questionTypes,
      },
    })
    .catch(() => {});

  return NextResponse.json({ queued: true });
}
