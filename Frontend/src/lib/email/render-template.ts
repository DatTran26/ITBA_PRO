/** Replace {{variable}} with values; missing keys → <key missing>. */
export function renderTemplate(body: string, variables: Record<string, string>): string {
    return body.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (_, key) =>
        variables[key] ?? `<${key} missing>`
    );
}
