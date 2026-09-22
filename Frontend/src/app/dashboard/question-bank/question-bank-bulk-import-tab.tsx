"use client";

import { useState } from "react";
import { FileDown, FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import BulkImportDropzone from "@/components/question-bank/bulk-import-dropzone";
import ImportResultReport from "@/components/question-bank/import-result-report";
import { toast } from "sonner";
import type { ImportResult } from "@/components/question-bank/question-bank-types";

export default function QuestionBankBulkImportTab() {
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [downloading, setDownloading] = useState(false);

  async function downloadTemplate() {
    setDownloading(true);
    try {
      const res = await fetch("/api/question-bank/template");
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "question-bank-template.xlsx";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Failed to download template");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="border border-border/10 rounded-lg p-6 bg-card/40">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-primary mb-1">Bulk Import via Spreadsheet</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Download the template, fill in your questions, then upload the file.
              Supported formats: .xlsx, .xls, .csv
            </p>
            <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                Columns: question_text, option_a, option_b, option_c, option_d, correct_answer, level, topic_tag, explanation
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                level must be: junior, middle, or senior
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1 h-1 rounded-full bg-muted-foreground" />
                correct_answer must be: a, b, c, or d
              </li>
            </ul>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={downloadTemplate}
            disabled={downloading}
            className="shrink-0 border-border/20 text-muted-foreground hover:text-primary"
          >
            <FileDown className="w-4 h-4 mr-2" />
            {downloading ? "Downloading..." : "Download Template"}
          </Button>
        </div>
      </div>

      <div>
        <div className="flex items-center gap-2 mb-3">
          <FileSpreadsheet className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Upload File</span>
        </div>
        <BulkImportDropzone onResult={setImportResult} />
      </div>

      {importResult && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">Import Result</span>
            <button
              onClick={() => setImportResult(null)}
              className="text-xs text-muted-foreground hover:text-muted-foreground"
            >
              Clear
            </button>
          </div>
          <ImportResultReport result={importResult} />
        </div>
      )}
    </div>
  );
}
