"use client";

import { useRef, useState } from "react";
import { Upload, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { ImportResult } from "./question-bank-types";

interface Props {
  onResult: (result: ImportResult) => void;
}

export default function BulkImportDropzone({ onResult }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);

  async function upload(file: File) {
    if (!file.name.match(/\.(xlsx|xls|csv)$/i)) {
      toast.error("Only .xlsx, .xls, or .csv files are supported");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/question-bank/bulk-import", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      onResult(json as ImportResult);
      toast.success(`Import complete: ${json.inserted.length} inserted`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Import failed");
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !loading && inputRef.current?.click()}
      className={`relative flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-xl py-14 px-6 cursor-pointer transition-colors select-none
        ${dragging ? "border-[#10B981] bg-[#10B981]/5" : "border-[#8B99B0]/20 hover:border-[#8B99B0]/40 bg-[#1E2840]/40"}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) upload(f); e.target.value = ""; }}
      />
      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${dragging ? "bg-[#10B981]/20" : "bg-[#8B99B0]/10"}`}>
        {loading ? (
          <Upload className="w-7 h-7 text-[#10B981] animate-bounce" />
        ) : (
          <FileSpreadsheet className={`w-7 h-7 ${dragging ? "text-[#10B981]" : "text-[#8B99B0]"}`} />
        )}
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-[#ECF0F7]">
          {loading ? "Importing..." : dragging ? "Drop to import" : "Drag & drop your spreadsheet here"}
        </p>
        <p className="text-xs text-[#5A6882] mt-1">Supports .xlsx, .xls, .csv · Max 2 MB · 500 rows</p>
      </div>
      {!loading && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="border-[#8B99B0]/20 text-[#8B99B0] hover:text-[#ECF0F7] pointer-events-none"
        >
          Browse Files
        </Button>
      )}
    </div>
  );
}
