export interface ExportColumn {
  key: string;
  header: string;
  format?: (value: unknown) => string;
}

export function generateCsv(columns: ExportColumn[], data: Record<string, unknown>[]): string {
  const header = columns.map(c => `"${c.header}"`).join(",");
  const rows = data.map(row =>
    columns.map(c => {
      const val = c.format ? c.format(row[c.key]) : String(row[c.key] ?? "");
      return `"${val.replace(/"/g, '""')}"`;
    }).join(",")
  );
  return [header, ...rows].join("\n");
}
