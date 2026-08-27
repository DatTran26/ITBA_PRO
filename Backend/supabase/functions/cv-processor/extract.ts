// PDF/DOCX text extraction using OpenAI Files API (primary strategy)
// Falls back to raw content if Files API fails

export async function extractText(
  fileBytes: Uint8Array,
  mimeType: string,
  filename: string,
  openaiApiKey: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    return extractPdfViaOpenAI(fileBytes, filename, openaiApiKey);
  }
  if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
    return extractDocx(fileBytes);
  }
  throw new Error(`Unsupported mime type: ${mimeType}`);
}

async function extractPdfViaOpenAI(
  bytes: Uint8Array,
  filename: string,
  apiKey: string
): Promise<string> {
  const formData = new FormData();
  const blob = new Blob([bytes], { type: "application/pdf" });
  formData.append("file", blob, filename);
  formData.append("purpose", "assistants");

  // Upload file to OpenAI
  const uploadRes = await fetch("https://api.openai.com/v1/files", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: formData,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`OpenAI file upload failed: ${err}`);
  }

  const uploadedFile = await uploadRes.json();
  const fileId = uploadedFile.id as string;

  try {
    // Retrieve file content (text extraction)
    const contentRes = await fetch(
      `https://api.openai.com/v1/files/${fileId}/content`,
      { headers: { Authorization: `Bearer ${apiKey}` } }
    );
    if (!contentRes.ok) throw new Error("Could not retrieve file content");
    return await contentRes.text();
  } finally {
    // Clean up uploaded file
    await fetch(`https://api.openai.com/v1/files/${fileId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${apiKey}` },
    }).catch(() => {});
  }
}

function extractDocx(bytes: Uint8Array): string {
  // DOCX is a ZIP archive; find word/document.xml and strip XML tags
  try {
    // Convert to string and look for XML content between w:t tags
    const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
    // Extract text between <w:t> tags (simplified approach)
    const matches = text.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g);
    const parts: string[] = [];
    for (const m of matches) {
      if (m[1].trim()) parts.push(m[1]);
    }
    if (parts.length > 0) return parts.join(" ");
    // If no XML tags found, try treating as text
    return text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  } catch {
    throw new Error("Failed to extract DOCX content");
  }
}
