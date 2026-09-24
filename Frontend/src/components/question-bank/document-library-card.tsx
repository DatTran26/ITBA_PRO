"use client";

import type { ReactNode } from "react";
import { File, FileText, FileType, Loader2, PlayCircle, Trash2 } from "lucide-react";
import { SharedDashboardButton, SharedStatusChip } from "@/components/shares";
import type { LibraryDocument } from "./question-bank-types";

interface Props {
  document: LibraryDocument;
  lastRunStatus?: string | null;
  onSelect: (doc: LibraryDocument) => void;
  onDelete: (id: string) => void;
  selecting?: boolean;
}

const FILE_ICONS: Record<string, ReactNode> = {
  pdf: <FileType className="h-4 w-4 text-red-400" />,
  docx: <FileText className="h-4 w-4 text-blue-400" />,
  txt: <File className="h-4 w-4 text-muted-foreground" />,
};

const STATUS_BADGE: Record<string, { label: string; tone: "neutral" | "info" | "success" | "warning" | "danger" }> = {
  done: { label: "Done", tone: "success" },
  failed: { label: "Failed", tone: "danger" },
  topics_ready: { label: "Topics ready", tone: "info" },
  generating_questions: { label: "Generating...", tone: "info" },
  extracting_topics: { label: "Extracting...", tone: "info" },
  pending: { label: "Pending", tone: "neutral" },
  processing: { label: "Processing...", tone: "warning" },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function DocumentLibraryCard({ document: doc, lastRunStatus, onSelect, onDelete, selecting }: Props) {
  const icon = FILE_ICONS[doc.file_type] ?? <File className="h-4 w-4 text-muted-foreground" />;
  const badge = lastRunStatus ? STATUS_BADGE[lastRunStatus] : null;
  const runCount = doc.document_sources?.length ?? 0;
  const isReRun = runCount > 0;
  const buttonLabel = isReRun ? `Re-run (v${runCount + 1})` : "Use";

  return (
    <div className="flex items-center gap-3 rounded-lg border border-border/10 bg-card/40 px-4 py-3 transition-colors hover:bg-card/70">
      <div className="shrink-0">{icon}</div>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-primary">{doc.title}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {formatDate(doc.created_at)}
          {isReRun && <span className="ml-2 text-primary/70">· {runCount} previous run{runCount > 1 ? "s" : ""}</span>}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {badge && (
          <SharedStatusChip tone={badge.tone} className="text-xs">
            {badge.label}
          </SharedStatusChip>
        )}

        <SharedDashboardButton
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-primary hover:bg-primary/10 hover:text-primary"
          onClick={() => onSelect(doc)}
          disabled={selecting}
          aria-label={isReRun ? "Re-run pipeline on this document" : "Use document"}
          title={isReRun ? "Re-run AI pipeline (creates a new version)" : "Start AI pipeline"}
        >
          {selecting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PlayCircle className="h-3.5 w-3.5" />}
          <span className="ml-1 text-xs">{buttonLabel}</span>
        </SharedDashboardButton>

        <SharedDashboardButton
          size="icon"
          variant="ghost"
          className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(doc.id)}
          aria-label="Delete document"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </SharedDashboardButton>
      </div>
    </div>
  );
}
