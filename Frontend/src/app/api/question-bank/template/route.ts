import { NextResponse } from "next/server";
import { utils, write } from "xlsx";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";

export const runtime = "nodejs";

export async function GET() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) return ctx;

  const { isAdmin, isLeader } = ctx;
  if (!isLeader && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const headers = [
    "question_text",
    "option_a",
    "option_b",
    "option_c",
    "option_d",
    "correct_answer",
    "level",
    "explanation",
    "points",
    "time_limit",
    "topic_tag",
  ];

  const samples = [
    {
      question_text: "What does REST stand for?",
      option_a: "Representational State Transfer",
      option_b: "Remote Execution of Services and Tasks",
      option_c: "Resource Endpoint Syntax Transfer",
      option_d: "Reliable State Technology",
      correct_answer: "a",
      level: "junior",
      explanation: "REST stands for Representational State Transfer, an architectural style for APIs.",
      points: 1,
      time_limit: 60,
      topic_tag: "API Design",
    },
    {
      question_text: "Which HTTP status code indicates a successful POST that created a resource?",
      option_a: "200",
      option_b: "201",
      option_c: "204",
      option_d: "302",
      correct_answer: "b",
      level: "middle",
      explanation: "201 Created is returned when a new resource is successfully created.",
      points: 2,
      time_limit: 90,
      topic_tag: "HTTP",
    },
  ];

  const ws = utils.json_to_sheet(samples, { header: headers });
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Questions");

  const buffer = write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": 'attachment; filename="question-bank-template.xlsx"',
    },
  });
}
