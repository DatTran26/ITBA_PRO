"use client";

import { useRef, useState } from "react";
import { Upload, Link, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";

interface Props {
  onSuccess: (documentId: string) => void;
  skillId?: string;
}

type Tab = "file" | "url";

const ACCEPTED = ".pdf,.docx,.txt";
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB

export default function DocumentUploadForm({ onSuccess, skillId }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [tab, setTab] = useState<Tab>("file");
  const [dragging, setDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  async function submit() {
    setLoading(true);
    try {
      const form = new FormData();
      if (tab === "file") {
        if (!selectedFile) { toast.error("Please select a file"); return; }
        if (selectedFile.size > MAX_BYTES) { toast.error("File exceeds 50 MB limit"); return; }

        // 1. Get a one-time signed upload URL (server gates role + owns the path).
        const urlRes = await fetch("/api/document-sources/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: selectedFile.name }),
        });
        const urlJson = await urlRes.json();
        if (!urlRes.ok) throw new Error(urlJson.error ?? "Could not start upload");

        // 2. Upload the file straight to Storage (no serverless body limit).
        const { error: upErr } = await createClient()
          .storage.from("document-sources")
          .uploadToSignedUrl(urlJson.path, urlJson.token, selectedFile, {
            contentType: selectedFile.type || undefined,
          });
        if (upErr) throw new Error(upErr.message);

        // 3. Register the uploaded file so the pipeline can pick it up.
        const ext = selectedFile.name.split(".").pop()?.toLowerCase() ?? "";
        form.append("storage_path", urlJson.path);
        form.append("file_name", selectedFile.name);
        form.append("format", ext);
      } else {
        if (!url.trim()) { toast.error("Please enter a URL"); return; }
        form.append("source_url", url.trim());
      }
      if (skillId) form.append("skill_id", skillId);

      const res = await fetch("/api/document-sources", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Upload failed");
      toast.success("Document submitted - generating questions...");
      onSuccess(json.documentId as string);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setLoading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  }

  return (
    <div className="space-y-5">
      {/* Tabs */}
      <div className="flex gap-1 bg-muted/60 rounded-xl p-1 w-fit border border-border/10">
        {(["file", "url"] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tab === t
                ? "bg-success text-white"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t === "file" ? <FileText className="w-3.5 h-3.5" /> : <Link className="w-3.5 h-3.5" />}
            {t === "file" ? "Upload File" : "From URL"}
          </button>
        ))}
      </div>

      {tab === "file" ? (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => !loading && inputRef.current?.click()}
          className={`relative flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-xl py-12 px-6 cursor-pointer transition-colors select-none
            ${dragging ? "border-border bg-success/5" : selectedFile ? "border-border/40 bg-success/5" : "border-border/20 hover:border-border/40 bg-muted/40"}`}
        >
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED}
            className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) setSelectedFile(f); e.target.value = ""; }}
          />
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedFile ? "bg-success/20" : "bg-muted-foreground/10"}`}>
            <Upload className={`w-6 h-6 ${selectedFile ? "text-success" : "text-muted-foreground"}`} />
          </div>
          <div className="text-center">
            {selectedFile ? (
              <>
                <p className="text-sm font-medium text-success">{selectedFile.name}</p>
                <p className="text-xs text-muted-foreground mt-1">{(selectedFile.size / 1024).toFixed(0)} KB · Click to change</p>
              </>
            ) : (
              <>
                <p className="text-sm font-medium text-foreground">
                  {dragging ? "Drop to select" : "Drag & drop or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">PDF, DOCX, TXT · Max 50 MB</p>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/article"
            className="bg-muted/60 border-border/20 text-foreground placeholder:text-muted-foreground focus-visible:ring-success/40 h-11"
          />
          <p className="text-xs text-muted-foreground">The page will be fetched and HTML stripped to extract readable text.</p>
        </div>
      )}

      <Button
        onClick={submit}
        disabled={loading || (tab === "file" ? !selectedFile : !url.trim())}
        className="bg-success hover:bg-success text-white border-0 h-11 px-8 rounded-xl font-medium"
      >
        {loading ? "Processing..." : "Generate Questions"}
      </Button>
    </div>
  );
}
