import { completeChatFetch, type AiRuntimeConfig } from "../_shared/ai-settings.ts";

export interface AiQuestion {
  question_text: string;
  option_a?: string | null;
  option_b?: string | null;
  option_c?: string | null;
  option_d?: string | null;
  correct_answer?: string | null;
  question_type?: string;
  answer_payload?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
  grading_mode?: "auto" | "manual";
  explanation: string | null;
  level: string;
  topic_tag: string | null;
  // Verbatim quote (max ~280 chars) from source document supporting this question.
  source_excerpt?: string | null;
}

export interface TopicInput {
  id: string;
  title: string;
  summary: string | null;
  key_points: string[];
}

// 120s gives room for large multi-topic generations; stays within Supabase Edge wall-clock (150s free / 400s paid).
const SUPPORTED_TYPES = [
  "single_choice", "multiple_choice", "true_false", "matching", "fill_blank",
  "scenario", "ordering", "reading_comprehension", "priority_severity",
  "short_case_study", "image_diagram", "communication_response", "short_answer",
  "sql_logic_code",
].join(", ");

const TOPIC_SYSTEM_PROMPT = `You are an expert technical interviewer and question-bank designer.
Generate source-grounded IT interview questions from uploaded document topics.
Cover all approved topics without duplicate questions.
Include junior, middle, and senior when the source content supports them.
Choose suitable question types yourself from: ${SUPPORTED_TYPES}.
Use grading_mode "manual" for short_answer, sql_logic_code, and short_case_study; otherwise use "auto".
Return ONLY JSON object: {"questions": [...]}.
Each item must include: question_text, question_type, option_a, option_b, option_c, option_d, correct_answer, answer_payload, metadata, grading_mode, explanation, level, topic_tag, source_excerpt.

STRICT FIELD RULES (violations cause DB insert failure):
- level: EXACTLY one of "junior", "middle", "senior" (lowercase, no other values).
- correct_answer: ONLY a single lowercase letter "a"|"b"|"c"|"d" for single_choice/true_false (use "a"=True, "b"=False). Use null for ALL other types.
- For multiple_choice: put the correct letters as an array in answer_payload.correct_answer (e.g. ["a","c"]). Set top-level correct_answer to null.
- For matching: answer_payload.pairs = [{"left":"...","right":"..."}].
- For ordering: answer_payload.sequence = ["step1","step2",...].
- For fill_blank: answer_payload.blanks = ["answer1","answer2"].
- For short_answer/sql_logic_code/short_case_study: answer_payload.expected_answer = "..." and answer_payload.rubric = ["criterion1","criterion2"].

source_excerpt MUST be a verbatim quote (max ~280 chars) copied from the Source document excerpt that supports the question — used for traceability so reviewers can locate the original passage. Never paraphrase.
Use null for option_a..option_d that do not apply.`;

function normalizeQuestion(raw: AiQuestion): AiQuestion {
  const type = raw.question_type || "single_choice";
  const manual = ["short_answer", "sql_logic_code", "short_case_study"].includes(type);
  return {
    ...raw,
    question_type: type,
    option_a: raw.option_a ?? null,
    option_b: raw.option_b ?? null,
    option_c: raw.option_c ?? null,
    option_d: raw.option_d ?? null,
    correct_answer: raw.correct_answer ?? null,
    answer_payload: raw.answer_payload ?? {},
    metadata: raw.metadata ?? {},
    grading_mode: raw.grading_mode ?? (manual ? "manual" : "auto"),
    explanation: raw.explanation ?? null,
    topic_tag: raw.topic_tag ?? null,
    source_excerpt: raw.source_excerpt ?? null,
  };
}

// Generates questions for a single chunk of topics in one OpenAI call.
async function generateChunk(
  topics: TopicInput[],
  config: AiRuntimeConfig,
  documentText: string,
  perTopicCounts?: Record<string, number>,
  levelRatio?: { junior: number; middle: number; senior: number },
  questionTypes?: string[],
): Promise<AiQuestion[]> {
  const topicText = topics.map((topic, index) => {
    const keyPoints = Array.isArray(topic.key_points) && topic.key_points.length > 0
      ? `\nKey points: ${topic.key_points.join("; ")}`
      : "";
    return `${index + 1}. ${topic.title}${topic.summary ? ` - ${topic.summary}` : ""}${keyPoints}`;
  }).join("\n\n");

  const countPrompt = perTopicCounts
    ? `For each topic, generate EXACTLY this number of questions:\n${
        topics.map((t) => `- Topic "${t.title}": generate exactly ${perTopicCounts[t.id] ?? 5} questions`).join("\n")
      }`
    : "Generate exactly 5 questions per topic.";

  const ratioPrompt = levelRatio
    ? `Distribute the generated questions as close as possible to these difficulty levels:
- junior: ${levelRatio.junior}% of the generated questions
- middle: ${levelRatio.middle}% of the generated questions
- senior: ${levelRatio.senior}% of the generated questions`
    : "Self-balance levels by content depth (aim for roughly 40% junior, 40% middle, 20% senior).";

  const typesPrompt = questionTypes
    ? `Strictly choose question types from this whitelist: [${questionTypes.join(", ")}]. Do NOT use any other question types.`
    : `Choose suitable question types from: ${SUPPORTED_TYPES}.`;

  const prompt = `Source document excerpt:\n${documentText.slice(0, 12000)}\n\nApproved topics:\n${topicText}\n\n` +
    `GENERATION REQUIREMENTS:\n` +
    `1. ${countPrompt}\n` +
    `2. ${ratioPrompt}\n` +
    `3. ${typesPrompt}\n\n` +
    `Return JSON only. Ensure every question matches one of the approved topics and includes the corresponding topic_tag matching the topic title exactly.`;

  const topicLabel = topics.map((t) => t.title).join(", ");
  const t0 = Date.now();
  const data = await completeChatFetch(config, {
    system: TOPIC_SYSTEM_PROMPT,
    user: prompt,
    json: true,
    temperature: 0.35,
  });
  logAiCall(`gen-questions [${topicLabel}]`, config.model, Date.now() - t0, {
    prompt_tokens: data.tokensIn,
    completion_tokens: data.tokensOut,
  });
  const content = data.content || "{}";
  const cleaned = content.replace(/^```json?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  const parsed = JSON.parse(cleaned) as { questions?: unknown[] };
  return Array.isArray(parsed.questions)
    ? (parsed.questions as AiQuestion[])
        .filter((q) => typeof q.question_text === "string" && q.question_text.trim().length > 0)
        .map(normalizeQuestion)
    : [];
}

// Pricing per 1M tokens (USD) — update when OpenAI changes rates
const COST_TABLE: Record<string, { in: number; out: number }> = {
  "gpt-4o":       { in: 2.50, out: 10.00 },
  "gpt-4o-mini":  { in: 0.15, out:  0.60 },
  "gpt-5":        { in: 5.00, out: 20.00 }, // placeholder, update when released
};

function logAiCall(
  label: string,
  model: string,
  durationMs: number,
  usage: { prompt_tokens?: number; completion_tokens?: number; input_tokens?: number; output_tokens?: number; total_tokens?: number },
) {
  const inTok  = usage.prompt_tokens  ?? usage.input_tokens  ?? 0;
  const outTok = usage.completion_tokens ?? usage.output_tokens ?? 0;
  const total  = usage.total_tokens   ?? inTok + outTok;
  const baseModel = Object.keys(COST_TABLE).find((k) => model.startsWith(k)) ?? "gpt-4o";
  const rates  = COST_TABLE[baseModel];
  const cost   = (inTok * rates.in + outTok * rates.out) / 1_000_000;
  console.log(
    `[generate-questions-from-doc] ${label} | model:${model} | ${(durationMs / 1000).toFixed(2)}s` +
    ` | in:${inTok} out:${outTok} total:${total} | ~$${cost.toFixed(5)}`,
  );
}

// Max concurrent OpenAI calls. Keeps each request small (one topic) so it finishes
// well within the per-call timeout, while bounding parallelism to avoid rate limits.
const MAX_CONCURRENCY = 4;

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results = new Array<PromiseSettledResult<R>>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        results[index] = { status: "fulfilled", value: await fn(items[index]) };
      } catch (reason) {
        results[index] = { status: "rejected", reason };
      }
    }
  }
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, () => worker()),
  );
  return results;
}

// Generates questions across all topics by fanning out one OpenAI call per topic
// in parallel (bounded). Smaller calls finish faster and a slow/failed topic no
// longer drags down the whole batch — failures surface as per-topic shortages.
export async function generateQuestionsFromTopicsBatch(
  topics: TopicInput[],
  config: AiRuntimeConfig,
  documentText: string,
  perTopicCounts?: Record<string, number>,
  levelRatio?: { junior: number; middle: number; senior: number },
  questionTypes?: string[],
): Promise<AiQuestion[]> {
  console.log(`[generate-questions-from-doc] start | provider:${config.provider} | model:${config.model} | ${topics.length} topic(s)`);
  const t0 = Date.now();

  const results = await runWithConcurrency(topics, MAX_CONCURRENCY, (topic) =>
    generateChunk(
      [topic],
      config,
      documentText,
      perTopicCounts ? { [topic.id]: perTopicCounts[topic.id] ?? 5 } : undefined,
      levelRatio,
      questionTypes,
    ),
  );

  const merged: AiQuestion[] = [];
  let failures = 0;
  for (const result of results) {
    if (result.status === "fulfilled") {
      merged.push(...result.value);
    } else {
      failures++;
      const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
      console.error("[generate-questions-from-doc] topic generation failed:", reason);
    }
  }

  // Only hard-fail when nothing succeeded (e.g. bad key / global timeout); otherwise
  // return partial results so the caller can report shortages per topic.
  if (failures === topics.length && topics.length > 0) {
    throw new Error("All topic generations failed (likely AI timeout or auth error).");
  }

  console.log(
    `[generate-questions-from-doc] done | total: ${((Date.now() - t0) / 1000).toFixed(2)}s` +
    ` | ${merged.length} questions | ${failures} failed topic(s)`,
  );
  return merged;
}
