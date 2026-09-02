// Pass 1: extract structured topics from document text using OpenAI

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
    `[extract-document-topics] ${label} | model:${model} | ${(durationMs / 1000).toFixed(2)}s` +
    ` | in:${inTok} out:${outTok} total:${total} | ~$${cost.toFixed(5)}`,
  );
}

// gpt-5 family requires the Responses API (no chat/completions); detect to switch endpoint.
function isGpt5Model(model: string): boolean {
  return model.trim().toLowerCase().startsWith("gpt-5");
}

function extractResponsesText(data: {
  output_text?: string;
  output?: Array<{ content?: Array<{ text?: string }> }>;
}): string {
  if (data.output_text) return data.output_text;
  return data.output
    ?.flatMap((item) => item.content ?? [])
    .map((content) => content.text ?? "")
    .join("\n")
    .trim() ?? "";
}

export interface ExtractedTopic {
  title: string;
  summary: string;
  key_points: string[];
}

const CHUNK_SIZE = 80_000;
const MAX_TOPICS_PER_CHUNK = 20;

const SYSTEM_PROMPT = `You are a document analyst. Extract the main topics from the given text.
Return ONLY a valid JSON object (no markdown fences, no extra text) with a "topics" array.
Each topic object has:
- title: concise topic name (max 80 chars)
- summary: 1-2 sentence description of what this topic covers
- key_points: array of 3-6 key facts or concepts for this topic

Return at most ${MAX_TOPICS_PER_CHUNK} topics. Focus on distinct, meaningful topics.`;

const MAX_CONCURRENCY = 4;

export async function extractTopics(text: string, openaiKey: string, model: string): Promise<ExtractedTopic[]> {
  const chunks = chunkText(text);
  console.log(`[extract-document-topics] extractTopics: ${chunks.length} chunk(s), text length: ${text.length} chars | model:${model}`);
  const t0 = Date.now();

  const results = await runWithConcurrency(chunks, MAX_CONCURRENCY, (chunk, index) =>
    extractTopicsFromChunk(chunk, openaiKey, model, index + 1, chunks.length)
  );

  const allTopics: ExtractedTopic[] = [];
  for (const result of results) {
    if (result.status === "fulfilled") allTopics.push(...result.value);
    else console.error("[extract-document-topics] chunk extraction failed:", result.reason);
  }

  const deduped = deduplicateTopics(allTopics);
  console.log(
    `[extract-document-topics] extractTopics done | total: ${((Date.now() - t0) / 1000).toFixed(2)}s` +
    ` | raw topics: ${allTopics.length} → deduped: ${deduped.length}`,
  );
  return deduped;
}

async function runWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<PromiseSettledResult<R>[]> {
  const results = new Array<PromiseSettledResult<R>>(items.length);
  let cursor = 0;
  async function worker() {
    while (cursor < items.length) {
      const index = cursor++;
      try {
        results[index] = { status: "fulfilled", value: await fn(items[index], index) };
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

const OPENAI_TIMEOUT_MS = 120_000;

async function extractTopicsFromChunk(
  chunk: string,
  apiKey: string,
  model: string,
  chunkNum = 1,
  totalChunks = 1,
): Promise<ExtractedTopic[]> {
  const useResponsesApi = isGpt5Model(model);
  const label = `topic chunk ${chunkNum}/${totalChunks} (${chunk.length} chars)`;
  const t0 = Date.now();

  const userContent = `Extract topics from this document text and return a JSON object with a "topics" array:\n\n${chunk}`;

  const requestBody = useResponsesApi
    ? {
        model,
        reasoning: { effort: "medium" },
        input: [
          { role: "system", content: [{ type: "input_text", text: SYSTEM_PROMPT }] },
          { role: "user", content: [{ type: "input_text", text: userContent }] },
        ],
      }
    : {
        model,
        temperature: 0.3,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
      };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("openai-timeout"), OPENAI_TIMEOUT_MS);
  const res = await fetch(
    useResponsesApi ? "https://api.openai.com/v1/responses" : "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    },
  ).finally(() => clearTimeout(timeout));

  if (!res.ok) throw new Error(`OpenAI error: ${await res.text()}`);
  const data = await res.json() as {
    choices?: { message?: { content?: string } }[];
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string }> }>;
    usage?: {
      prompt_tokens?: number; completion_tokens?: number;
      input_tokens?: number; output_tokens?: number; total_tokens?: number;
    };
  };
  logAiCall(label, model, Date.now() - t0, data.usage ?? {});
  const content = useResponsesApi
    ? (extractResponsesText(data) || "{}")
    : (data.choices?.[0]?.message?.content ?? "{}");

  try {
    return parseTopicsPayload(content);
  } catch (err) {
    console.error("[extract-document-topics] Failed to parse topic JSON:", err);
    return [];
  }
}

function parseTopicsPayload(content: string): ExtractedTopic[] {
  const parsed = JSON.parse(stripJsonFence(content)) as unknown;
  const topics = Array.isArray(parsed)
    ? parsed
    : Array.isArray((parsed as { topics?: unknown }).topics)
      ? (parsed as { topics: unknown[] }).topics
      : [];

  return topics
    .map(normalizeTopic)
    .filter((topic): topic is ExtractedTopic => topic !== null);
}

function stripJsonFence(content: string): string {
  return content
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

function normalizeTopic(value: unknown): ExtractedTopic | null {
  if (!value || typeof value !== "object") return null;
  const topic = value as { title?: unknown; summary?: unknown; key_points?: unknown; keyPoints?: unknown };
  if (typeof topic.title !== "string" || topic.title.trim().length === 0) return null;

  const keyPoints = Array.isArray(topic.key_points)
    ? topic.key_points
    : Array.isArray(topic.keyPoints)
      ? topic.keyPoints
      : [];

  return {
    title: topic.title.trim().slice(0, 80),
    summary: typeof topic.summary === "string" ? topic.summary.trim() : "",
    key_points: keyPoints.filter((point): point is string => typeof point === "string"),
  };
}

function chunkText(text: string): string[] {
  if (text.length <= CHUNK_SIZE) return [text];
  const paragraphs = text.split(/\n\n+/);
  const chunks: string[] = [];
  let current = "";

  for (const para of paragraphs) {
    if (current.length + para.length > CHUNK_SIZE && current.length > 0) {
      chunks.push(current.trim());
      current = para;
    } else {
      current = current ? `${current}\n\n${para}` : para;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks.length > 0 ? chunks : [text.slice(0, CHUNK_SIZE)];
}

function deduplicateTopics(topics: ExtractedTopic[]): ExtractedTopic[] {
  const seen = new Set<string>();
  return topics.filter((t) => {
    const key = t.title.toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
