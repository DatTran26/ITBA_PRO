/**
 * Server-safe sanitizer for email HTML content.
 * Strips script tags, unsafe embeds, and inline event handlers
 * without pulling in heavy CJS jsdom dependencies in Next.js Turbopack.
 */
export function sanitizeEmailHtml(html: string): string {
  if (!html) return "";
  return html
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    // Remove dangerous embed tags
    .replace(/<(iframe|embed|object|frame|frameset)\b[^<]*(?:(?!<\/\1>)<[^<]*)*<\/\1>/gi, "")
    .replace(/<(iframe|embed|object|frame|frameset)[^>]*\/?>/gi, "")
    // Remove inline event handlers (e.g. onload, onclick, onerror, onfocus)
    .replace(/\s+on[a-zA-Z]+\s*=\s*(?:'[^']*'|"[^"]*"|[^\s>]+)/gi, "")
    // Neutralize javascript: pseudo-protocol in href or src
    .replace(/href\s*=\s*['"]\s*javascript:[^'"]*['"]/gi, 'href="#"')
    .replace(/src\s*=\s*['"]\s*javascript:[^'"]*['"]/gi, 'src=""')
    .trim();
}
