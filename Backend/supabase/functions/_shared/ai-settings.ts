export type AiProvider = "openai" | "gemini";

export interface AiRuntimeConfig {
  provider: AiProvider;
  apiKey: string;
  model: string;
}

const OPENAI_MODELS = ["gpt-5", "gpt-5-mini", "gpt-4.1", "gpt-4o", "gpt-4o-mini", "gpt-4-turbo"];
const GEMINI_MODELS = ["gemini-3.6-flash", "gemini-2.5-flash", "gemini-2.0-flash"];
const DEFAULT_MODEL: Record<AiProvider, string> = {
  openai: "gpt-4o",
  gemini: "gemini-2.0-flash",
};
const AI_TIMEOUT_MS = 120_000;

export function settingString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

type EnvReader = {
  OPENAI_API_KEY?: string;
  GEMINI_API_KEY?: string;
  GOOGLE_GENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  GEMINI_MODEL?: string;
  get?: (key: string) => string | undefined;
};

function envGet(env: EnvReader, key: string): string {
  if (typeof env.get === "function") return env.get(key) ?? "";
  return (env as Record<string, string | undefined>)[key] ?? "";
}

export function resolveAiConfig(
  rows: Array<{ key: string; value: unknown }>,
  env: EnvReader = {},
): AiRuntimeConfig {
  const map = new Map(rows.map((row) => [row.key, row.value]));
  const provider: AiProvider = settingString(map.get("ai_provider")) === "gemini" ? "gemini" : "openai";
  const allowed = provider === "gemini" ? GEMINI_MODELS : OPENAI_MODELS;
  const rawModel = settingString(map.get("ai_model"));
  const fallback = provider === "gemini"
    ? (envGet(env, "GEMINI_MODEL") || DEFAULT_MODEL.gemini)
    : (envGet(env, "OPENAI_MODEL") || DEFAULT_MODEL.openai);
  const model = allowed.includes(rawModel) ? rawModel : fallback;
  const dbOpenAi = settingString(map.get("openai_api_key"));
  const dbGemini = settingString(map.get("gemini_api_key"));
  const apiKey = provider === "gemini"
    ? (dbGemini || envGet(env, "GEMINI_API_KEY") || envGet(env, "GOOGLE_GENAI_API_KEY") || "")
    : (dbOpenAi || envGet(env, "OPENAI_API_KEY") || "");
  return { provider, apiKey, model };
}

function isGpt5Model(model: string): boolean {
  return model.trim().toLowerCase().startsWith("gpt-5");
}

function extractResponsesText(data: {
  output_text?: string;
  output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
}): string {
  if (data.output_text) return data.output_text;
  const message = data.output?.find((item) => item.type === "message") ?? data.output?.[0];
  const textPart = message?.content?.find((part) => part.type === "output_text") ?? message?.content?.[0];
  if (textPart?.text) return textPart.text;
  return data.output?.flatMap((item) => item.content ?? []).map((part) => part.text ?? "").join("\n").trim() ?? "";
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort("ai-timeout"), AI_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

export async function completeChatFetch(config: AiRuntimeConfig, input: {
  system?: string;
  user: string;
  json?: boolean;
  temperature?: number;
}): Promise<{ content: string; tokensIn: number; tokensOut: number }> {
  if (!config.apiKey) throw new Error("AI API key is not configured in System Settings.");

  if (config.provider === "gemini") {
    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": config.apiKey,
        },
        body: JSON.stringify({
          system_instruction: input.system ? { parts: [{ text: input.system }] } : undefined,
          contents: [{ role: "user", parts: [{ text: input.user }] }],
          generationConfig: {
            temperature: input.temperature,
            responseMimeType: input.json ? "application/json" : undefined,
          },
        }),
      },
    );
    if (!res.ok) throw new Error(`Gemini error: ${await res.text()}`);
    const data = await res.json() as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number };
    };
    return {
      content: data.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
      tokensIn: data.usageMetadata?.promptTokenCount ?? 0,
      tokensOut: data.usageMetadata?.candidatesTokenCount ?? 0,
    };
  }

  if (isGpt5Model(config.model)) {
    const res = await fetchWithTimeout("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify({
        model: config.model,
        reasoning: { effort: "medium" },
        input: [
          ...(input.system ? [{ role: "system", content: [{ type: "input_text", text: input.system }] }] : []),
          { role: "user", content: [{ type: "input_text", text: input.user }] },
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI error: ${await res.text()}`);
    const data = await res.json() as {
      output_text?: string;
      output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
      usage?: { input_tokens?: number; output_tokens?: number };
    };
    return {
      content: extractResponsesText(data),
      tokensIn: data.usage?.input_tokens ?? 0,
      tokensOut: data.usage?.output_tokens ?? 0,
    };
  }

  const messages = [
    ...(input.system ? [{ role: "system", content: input.system }] : []),
    { role: "user", content: input.user },
  ];
  const res = await fetchWithTimeout("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      temperature: input.temperature,
      response_format: input.json ? { type: "json_object" } : undefined,
      messages,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI error: ${await res.text()}`);
  const data = await res.json() as {
    choices?: Array<{ message?: { content?: string } }>;
    usage?: { prompt_tokens?: number; completion_tokens?: number };
  };
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    tokensIn: data.usage?.prompt_tokens ?? 0,
    tokensOut: data.usage?.completion_tokens ?? 0,
  };
}

export async function extractPdfWithConfig(
  bytes: Uint8Array,
  filename: string,
  config: AiRuntimeConfig,
): Promise<string> {
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const base64 = btoa(binary);
  const prompt = "Extract and return ALL text content from this PDF. Return only the raw text, preserving paragraph structure. Do not summarize or omit anything.";

  if (config.provider === "gemini") {
    const res = await fetchWithTimeout(
      `https://generativelanguage.googleapis.com/v1beta/models/${config.model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": config.apiKey,
        },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [
              { text: prompt },
              { inline_data: { mime_type: "application/pdf", data: base64 } },
            ],
          }],
        }),
      },
    );
    if (!res.ok) throw new Error(`Gemini PDF extract failed: ${await res.text()}`);
    const data = await res.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
  }

  const res = await fetchWithTimeout("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      input: [{
        role: "user",
        content: [
          { type: "input_file", filename, file_data: `data:application/pdf;base64,${base64}` },
          { type: "input_text", text: prompt },
        ],
      }],
    }),
  });
  if (!res.ok) throw new Error(`OpenAI PDF extract failed: ${await res.text()}`);
  const data = await res.json() as {
    output_text?: string;
    output?: Array<{ type?: string; content?: Array<{ type?: string; text?: string }> }>;
  };
  return extractResponsesText(data);
}
