"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { FileImage, Loader2, RefreshCw, ScanText, Upload } from "lucide-react";
import AppNavbar from "@/components/ui/app-navbar";
import PageBreadcrumb from "@/components/ui/page-breadcrumb";
import PageContainer from "@/components/ui/page-container";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type JobStatus = "pending" | "processing" | "done" | "failed";

type OcrJob = {
  id: string;
  status: JobStatus;
  result_json: { original_ocr_text?: string; text?: string } | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
};

const statusTone: Record<JobStatus, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  processing: "secondary",
  done: "default",
  failed: "destructive",
};

export default function OcrWorkbenchClient() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [job, setJob] = useState<OcrJob | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const extractedText = useMemo(
    () => job?.result_json?.original_ocr_text ?? job?.result_json?.text ?? "",
    [job],
  );

  async function startOcr() {
    if (!file) return;
    setIsUploading(true);
    setError(null);
    setJob(null);
    setDocumentId(null);

    const form = new FormData();
    form.append("file", file);

    try {
      const response = await fetch("/api/document-sources/ocr", { method: "POST", body: form });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "OCR upload failed");
      setDocumentId(payload.documentId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "OCR upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  useEffect(() => {
    if (!documentId) return;
    let stopped = false;

    async function poll() {
      try {
        const response = await fetch(`/api/document-sources/${documentId}/job`, { cache: "no-store" });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error ?? "Could not load OCR job");
        if (stopped) return;
        setJob(payload as OcrJob);
        if (payload.status === "done" || payload.status === "failed") return;
        window.setTimeout(poll, 1500);
      } catch (err) {
        if (!stopped) setError(err instanceof Error ? err.message : "Could not load OCR job");
      }
    }

    poll();
    return () => {
      stopped = true;
    };
  }, [documentId, refreshKey]);

  return (
    <div className="bg-transparent pb-12 text-[#ECF0F7]">
      <AppNavbar />
      <PageContainer>
        <PageBreadcrumb
          breadcrumbs={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Document AI OCR" },
          ]}
        />

        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-1">
            <h1 className="font-display text-4xl font-extralight tracking-tight text-[#ECF0F7]">Document AI OCR</h1>
            <p className="text-sm font-light text-[#5A6882]">Upload an image and review the OCR text stored in Document AI jobs.</p>
          </div>
          {job && <Badge variant={statusTone[job.status]}>{job.status}</Badge>}
        </div>

        {error && (
          <Alert variant="destructive" className="mb-5">
            <AlertTitle>OCR failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-5 lg:grid-cols-[360px_1fr]">
          <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="size-4" />
                Image Upload
              </CardTitle>
              <CardDescription>PNG, JPG, JPEG, or WEBP up to 10 MB.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setError(null);
                }}
              />

              <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-[#8B99B0]">
                {file ? (
                  <>
                    <p className="font-medium text-[#ECF0F7]">{file.name}</p>
                    <p>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                ) : (
                  "No image selected"
                )}
              </div>

              <Button
                className="h-10 w-full gap-2"
                onClick={startOcr}
                disabled={!file || isUploading || job?.status === "processing" || job?.status === "pending"}
              >
                {isUploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                Start OCR
              </Button>

              {documentId && (
                <Button
                  variant="outline"
                  className="h-10 w-full gap-2"
                  onClick={() => setRefreshKey((key) => key + 1)}
                  disabled={!documentId}
                >
                  <RefreshCw className="size-4" />
                  Refresh Job
                </Button>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-lg bg-[#10192B]/80">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanText className="size-4" />
                OCR Text
              </CardTitle>
              <CardDescription>
                Original OCR output is persisted on the latest `document_jobs.result_json`.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {job?.status === "pending" || job?.status === "processing" ? (
                <div className="mb-4 flex items-center gap-2 text-sm text-[#8B99B0]">
                  <Loader2 className="size-4 animate-spin" />
                  OCR job is {job.status}.
                </div>
              ) : null}

              <Textarea
                value={extractedText}
                readOnly
                placeholder="OCR text will appear here after processing."
                className="min-h-[420px] resize-y border-white/10 bg-[#0B1220] text-sm leading-6 text-[#ECF0F7]"
              />

              {job?.error_message && (
                <p className="mt-3 text-sm text-red-300">{job.error_message}</p>
              )}
            </CardContent>
          </Card>
        </div>
      </PageContainer>
    </div>
  );
}
