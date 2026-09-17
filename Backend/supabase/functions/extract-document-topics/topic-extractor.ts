import { completeChatFetch, type AiRuntimeConfig } from "../_shared/ai-settings.ts";

export interface ExtractedTopic {
  title: string;
  summary: string;
  key_points: string[];
}

const COST_TABLE: Record<string, { in: number; out: number }> = {
  "gpt-4o": { in: 2.50, out: 10.00 },
  "gpt-4o-mini": { in: 0.15, out: 0.60 },
  "gpt-5": { in: 5.00, out: 20.00 },
};

function logAiCall(
  label: string,
  model: string,
  durationMs: number,
  usage: { prompt_tokens?: number; completion_tokens?: number },
) {
  const inTok = usage.prompt_tokens ?? 0;
  const outTok = usage.completion_tokens ?? 0;
  const total = inTok + outTok;
  const baseModel = Object.keys(COST_TABLE).find((k) => model.startsWith(k)) ?? "gpt-4o";
  const rates = COST_TABLE[baseModel];
  const cost = (inTok * rates.in + outTok * rates.out) / 1_000_000;
  console.log(
    `[extract-document-topics] ${label} | model:${model} | ${(durationMs / 1000).toFixed(2)}s` +
    ` | in:${inTok} out:${outTok} total:${total} | ~$${cost.toFixed(5)}`,
  );
}

const CHUNK_SIZE = 80_000;
const MAX_TOPICS_PER_CHUNK = 20;
const MAX_CONCURRENCY = 4;

const SYSTEM_PROMPT = `You are a document analyst. Extract the main topics from the given text.
Return ONLY a valid JSON object (no markdown fences, no extra text) with a "topics" array.
Each topic object has:
- title: concise topic name (max 80 chars)
- summary: 1-2 sentence description of what this topic covers
- key_points: array of 3-6 key facts or concepts for this topic

Return at most ${MAX_TOPICS_PER_CHUNK} topics. Focus on distinct, meaningful topics.`;

export async function extractTopics(text: string, config: AiRuntimeConfig): Promise<ExtractedTopic[]> {
  const chunks = chunkText(text);
  console.log(`[extract-document-topics] extractTopics: ${chunks.length} chunk(s), text length: ${text.length} chars | provider:${config.provider} | model:${config.model}`);
  const t0 = Date.now();

  const results = await runWithConcurrency(chunks, MAX_CONCURRENCY, (chunk, index) =>
    extractTopicsFromChunk(chunk, config, index + 1, chunks.length),
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

async function extractTopicsFromChunk(
  chunk: string,
  config: AiRuntimeConfig,
  chunkNum = 1,
  totalChunks = 1,
): Promise<ExtractedTopic[]> {
  const label = `topic chunk ${chunkNum}/${totalChunks} (${chunk.length} chars)`;
  const t0 = Date.now();
  const userContent = `Extract topics from this document text and return a JSON object with a "topics" array:\n\n${chunk}`;

  const data = await completeChatFetch(config, {
    system: SYSTEM_PROMPT,
    user: userContent,
    json: true,
    temperature: 0.3,
  });
  logAiCall(label, config.model, Date.now() - t0, {
    prompt_tokens: data.tokensIn,
    completion_tokens: data.tokensOut,
  });

  try {
    return parseTopicsPayload(data.content || "{}");
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
