"use client";

import { useState, useRef, useCallback } from "react";
import { Trash2, ChevronDown, ChevronUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TopicKeyPointsEditor } from "./topic-key-points-editor";
import type { DocumentTopic } from "./question-bank-types";

interface Props {
  topic: DocumentTopic;
  onUpdate: (
    id: string,
    patch: Partial<Pick<DocumentTopic, "title" | "summary" | "key_points" | "is_approved">>
  ) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  count?: number;
  onCountChange?: (count: number) => void;
}

const DEBOUNCE_MS = 500;

export function TopicCard({ topic, onUpdate, onDelete, count = 5, onCountChange }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(topic.title);
  const [summary, setSummary] = useState(topic.summary ?? "");
  const [keyPoints, setKeyPoints] = useState<string[]>(topic.key_points ?? []);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSave = useCallback(
    (patch: Partial<Pick<DocumentTopic, "title" | "summary" | "key_points">>) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          await onUpdate(topic.id, patch);
        } finally {
          setSaving(false);
        }
      }, DEBOUNCE_MS);
    },
    [onUpdate, topic.id]
  );

  function handleTitleChange(v: string) {
    setTitle(v);
    scheduleSave({ title: v, summary, key_points: keyPoints });
  }

  function handleSummaryChange(v: string) {
    setSummary(v);
    scheduleSave({ title, summary: v, key_points: keyPoints });
  }

  function handleKeyPointsChange(pts: string[]) {
    setKeyPoints(pts);
    scheduleSave({ title, summary, key_points: pts });
  }

  async function handleApproveToggle(checked: boolean) {
    setSaving(true);
    try {
      await onUpdate(topic.id, { is_approved: checked });
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm(`Delete topic "${title}"?`)) return;
    setDeleting(true);
    try {
      await onDelete(topic.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-center gap-3">
        <Switch
          checked={topic.is_approved}
          onCheckedChange={handleApproveToggle}
          disabled={saving}
          aria-label="Approve topic"
        />
        <div className="flex-1 min-w-0">
          <Input
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="font-medium animate-none"
            placeholder="Topic title"
          />
        </div>
        {topic.is_approved && onCountChange && (
          <div className="flex items-center gap-1.5 shrink-0 ml-1">
            <span className="text-xs text-muted-foreground whitespace-nowrap">Q Count:</span>
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => onCountChange(Math.max(1, Math.min(20, parseInt(e.target.value, 10) || 1)))}
              className="w-12 h-8 px-1 text-center text-xs rounded-md bg-muted/60 border border-border/20 text-foreground focus:outline-none focus:border-border/50"
            />
          </div>
        )}
        <div className="flex items-center gap-1 shrink-0">
          {saving && (
            <span className="text-xs text-muted-foreground">Saving...</span>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setExpanded((v) => !v)}
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={handleDelete}
            disabled={deleting}
            aria-label="Delete topic"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 pl-10">
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Summary
            </label>
            <Textarea
              value={summary}
              onChange={(e) => handleSummaryChange(e.target.value)}
              placeholder="Topic summary"
              rows={3}
              className="text-sm resize-none"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Key Points
            </label>
            <TopicKeyPointsEditor
              points={keyPoints}
              onChange={handleKeyPointsChange}
            />
          </div>
        </div>
      )}
    </div>
  );
}
