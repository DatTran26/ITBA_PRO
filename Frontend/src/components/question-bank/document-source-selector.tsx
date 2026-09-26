"use client";

import { useState } from "react";
import { Library, Upload } from "lucide-react";
import { toast } from "sonner";
import { SharedDashboardButton } from "@/components/shares";
import { DocumentLibraryPanel } from "./document-library-panel";
import DocumentUploadForm from "./document-upload-form";
import type { LibraryDocument } from "./question-bank-types";

interface Props {
  onSuccess: (documentSourceId: string) => void;
  skillId?: string;
}

type Tab = "upload" | "library";

export function DocumentSourceSelector({ onSuccess, skillId }: Props) {
  const [tab, setTab] = useState<Tab>("upload");
  const [selectingId, setSelectingId] = useState<string | null>(null);

  async function handleLibrarySelect(doc: LibraryDocument) {
    setSelectingId(doc.id);
    try {
      const formData = new FormData();
      formData.set("documentId", doc.id);
      if (skillId) formData.set("skill_id", skillId);

      const res = await fetch("/api/document-sources", { method: "POST", body: formData });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        toast.error(json.error ?? "Failed to start pipeline");
        return;
      }

      const { documentId } = await res.json();
      onSuccess(documentId);
    } catch {
      toast.error("Failed to start pipeline");
    } finally {
      setSelectingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex w-fit gap-1 rounded-lg bg-card/60 p-1">
        {(["upload", "library"] as Tab[]).map((item) => (
          <SharedDashboardButton
            key={item}
            onClick={() => setTab(item)}
            variant="ghost"
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === item ? "bg-primary/20 text-primary" : "text-muted-foreground hover:text-primary"
            }`}
          >
            {item === "upload" ? <Upload className="h-3.5 w-3.5" /> : <Library className="h-3.5 w-3.5" />}
            {item === "upload" ? "Upload New" : "From Library"}
          </SharedDashboardButton>
        ))}
      </div>

      {tab === "upload" ? (
        <DocumentUploadForm onSuccess={onSuccess} skillId={skillId} />
      ) : (
        <DocumentLibraryPanel onSelect={handleLibrarySelect} selectingId={selectingId} />
      )}
    </div>
  );
}
