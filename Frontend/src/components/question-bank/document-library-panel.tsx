"use client";

import { useCallback, useEffect, useState } from "react";
import { FolderOpen, Loader2, Search } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { DocumentLibraryCard } from "./document-library-card";
import type { LibraryDocument } from "./question-bank-types";

type DocWithRun = LibraryDocument;

interface Props {
  onSelect: (doc: LibraryDocument) => void;
  selectingId?: string | null;
}

export function DocumentLibraryPanel({ onSelect, selectingId }: Props) {
  const [docs, setDocs] = useState<DocWithRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const fetchDocs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/documents");
      if (!res.ok) throw new Error("Failed to load documents");
      const json = await res.json();
      setDocs(json.data ?? []);
    } catch {
      toast.error("Could not load document library");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocs();
  }, [fetchDocs]);

  async function handleDelete(id: string) {
    if (!confirm("Delete this document from the library?")) return;

    const res = await fetch(`/api/documents/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Failed to delete document");
      return;
    }

    setDocs((prev) => prev.filter((doc) => doc.id !== id));
    toast.success("Document deleted");
  }

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? docs.filter((doc) => doc.title.toLowerCase().includes(normalizedQuery))
    : docs;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-[#5A6882]">
        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
        <span className="text-sm">Loading library...</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A6882]" />
        <Input
          placeholder="Search documents..."
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          className="h-9 border-[#8B99B0]/10 bg-[#1C2333]/40 pl-9 text-sm"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-[#5A6882]">
          <FolderOpen className="mb-2 h-8 w-8 opacity-40" />
          <p className="text-sm">{docs.length === 0 ? "No documents in library yet" : "No matches"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((doc) => (
            <DocumentLibraryCard
              key={doc.id}
              document={doc}
              lastRunStatus={doc.document_sources?.[0]?.status ?? null}
              onSelect={onSelect}
              onDelete={handleDelete}
              selecting={selectingId === doc.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
