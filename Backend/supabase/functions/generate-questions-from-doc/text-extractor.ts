// Text extraction: PDF via OpenAI Responses API (inline base64), DOCX via XML regex, TXT direct, URL via fetch

export async function extractTextFromFile(
  bytes: Uint8Array,
  format: string,
  filename: string,
  openaiApiKey: string,
): Promise<string> {
  if (format === "pdf") return extractPdfViaOpenAI(bytes, filename, openaiApiKey);
  if (format === "docx") return extractDocx(bytes);
  if (format === "txt") return new TextDecoder().decode(bytes);
  throw new Error(`Unsupported format: ${format}`);
}

export async function extractTextFromUrl(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) throw new Error(`Failed to fetch URL: ${res.status}`);
  const html = await res.text();
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function extractPdfViaOpenAI(
  bytes: Uint8Array,
  filename: string,
  apiKey: string,
): Promise<string> {
  const model = "gpt-4o";
  console.log(`[generate-questions-from-doc] PDF extract: sending ${bytes.length} bytes to ${model} Responses API`);
  const t0 = Date.now();

  // Encode PDF as base64 in chunks to avoid call stack overflow on large files
  const chunks: string[] = [];
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    chunks.push(String.fromCharCode(...bytes.subarray(i, i + chunkSize)));
  }
  const base64 = btoa(chunks.join(""));

  // Use Responses API with inline base64 — GPT-4o understands PDFs natively;
  // the old Files API /content endpoint returned raw bytes, not extracted text.
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_file",
              filename,
              file_data: `data:application/pdf;base64,${base64}`,
            },
            {
              type: "input_text",
              text: "Extract and return ALL text content from this PDF. Return only the raw text, preserving paragraph structure. Do not summarize or omit anything.",
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) throw new Error(`OpenAI PDF extraction failed: ${await res.text()}`);

  const result = await res.json() as {
    output?: Array<{ type: string; content?: Array<{ type: string; text?: string }> }>;
    usage?: { input_tokens?: number; output_tokens?: number; total_tokens?: number };
  };

  // Log latency + cost (Responses API uses input_tokens / output_tokens)
  const usage = result.usage ?? {};
  const inTok  = usage.input_tokens  ?? 0;
  const outTok = usage.output_tokens ?? 0;
  const cost   = (inTok * 2.50 + outTok * 10.00) / 1_000_000;
  console.log(
    `[generate-questions-from-doc] PDF extract (OpenAI) | model:${model} | ${((Date.now() - t0) / 1000).toFixed(2)}s` +
    ` | in:${inTok} out:${outTok} | ~$${cost.toFixed(5)}`,
  );

  const msgOutput = result.output?.find((o) => o.type === "message");
  const textContent = msgOutput?.content?.find((c) => c.type === "output_text");
  return textContent?.text ?? "";
}

function extractDocx(bytes: Uint8Array): string {
  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  const parts: string[] = [];
  for (const m of text.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)) {
    if (m[1].trim()) parts.push(m[1]);
  }
  if (parts.length > 0) return parts.join(" ");
  return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
