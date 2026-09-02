---
phase: 5
title: "UI Topic Review Components"
status: pending
priority: P1
effort: "3h"
dependencies: [1, 4]
---

# Phase 5: UI Topic Review Components

## Overview

Add `DocumentTopic` interface + extend `DocumentSource.status` in shared types, then create three new components: `TopicReviewPanel` (container with approve-all + CTA), `TopicCard` (per-topic inline edit + approve toggle), and `TopicKeyPointsEditor` (add/remove chips). These render in the `topic-review` pipeline state between Pass 1 and Pass 2.

## Requirements

- Functional:
  - Fetch topics from `GET /api/document-sources/[id]/topics` on mount
  - Each topic card: inline-edit title, expand/collapse summary textarea, add/remove key_points chips, approve/reject toggle, delete (calls `DELETE /api/document-topics/[id]`)
  - All edits auto-save via `PUT /api/document-topics/[id]` on blur/enter (debounced 500ms)
  - Approve-all toggle in panel header
  - "Generate Questions from X approved topics" CTA — disabled when 0 approved, shows count
  - CTA calls `POST /api/document-sources/[id]/generate-questions { approvedTopicIds }`
- Non-functional:
  - Design tokens: `#1C2333` bg, `#7C8FFF` accent, `#8B99B0` muted, `#5A6882` labels, `#ECF0F7` text, `#10B981` approved green
  - Loading skeleton while fetching; empty state if no topics
  - Match existing shadcn/ui card patterns from `ai-questions-review.tsx`

## Architecture

```
TopicReviewPanel (fetches topics[], owns approve state)
  ├── header: approve-all toggle + count + CTA button
  └── TopicCard[] (receives topic, onUpdate, onDelete)
        ├── title: inline edit input
        ├── summary: collapse/expand textarea (auto-save on blur)
        ├── TopicKeyPointsEditor (key_points chips)
        └── footer: approve toggle + delete button
              └── TopicKeyPointsEditor
                    ├── existing chips (×)
                    └── [+ add chip] input
```

## Related Code Files

- Modify: `src/components/question-bank/question-bank-types.ts`
- Create: `src/components/question-bank/topic-review-panel.tsx`
- Create: `src/components/question-bank/topic-card.tsx`
- Create: `src/components/question-bank/topic-key-points-editor.tsx`
- Read (pattern): `src/components/question-bank/ai-questions-review.tsx`

## Implementation Steps

### 1. Extend `question-bank-types.ts`

Add after `AiQuestion` interface:

```typescript
export interface DocumentTopic {
  id: string;
  document_id: string;
  title: string;
  summary: string | null;
  key_points: string[];
  order_index: number;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}
```

Extend `DocumentSource.status`:
```typescript
// Replace existing status union:
status:
  | "pending"
  | "processing"
  | "extracting_topics"
  | "topics_ready"
  | "generating_questions"
  | "done"
  | "failed";
```

### 2. `topic-key-points-editor.tsx`

```typescript
"use client";
import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  points: string[];
  onChange: (points: string[]) => void;
  disabled?: boolean;
}

export function TopicKeyPointsEditor({ points, onChange, disabled }: Props) {
  const [draft, setDraft] = useState("");

  function addPoint() {
    const trimmed = draft.trim();
    if (!trimmed || points.includes(trimmed)) return;
    onChange([...points, trimmed]);
    setDraft("");
  }

  function removePoint(idx: number) {
    onChange(points.filter((_, i) => i !== idx));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") { e.preventDefault(); addPoint(); }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-1.5">
        {points.map((p, i) => (
          <span
            key={i}
            className="flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs"
            style={{ background: "#1E2840", color: "#ECF0F7", border: "1px solid #5A6882" }}
          >
            {p}
            {!disabled && (
              <button onClick={() => removePoint(i)} className="hover:text-red-400 transition-colors">
                <X size={10} />
              </button>
            )}
          </span>
        ))}
      </div>
      {!disabled && (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={addPoint}
          placeholder="Add key point, press Enter"
          className="h-7 text-xs"
          style={{ background: "#1C2333", border: "1px solid #5A6882", color: "#ECF0F7" }}
        />
      )}
    </div>
  );
}
```

### 3. `topic-card.tsx`

```typescript
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
  onUpdate: (id: string, patch: Partial<Pick<DocumentTopic, "title" | "summary" | "key_points" | "is_approved">>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function TopicCard({ topic, onUpdate, onDelete }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState(topic.title);
  const [summary, setSummary] = useState(topic.summary ?? "");
  const [keyPoints, setKeyPoints] = useState(topic.key_points);
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const debouncedSave = useCallback(
    (patch: Partial<Pick<DocumentTopic, "title" | "summary" | "key_points">>) => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(async () => {
        setSaving(true);
        await onUpdate(topic.id, patch);
        setSaving(false);
      }, 500);
    },
    [topic.id, onUpdate],
  );

  return (
    <div
      className="rounded-lg p-3 space-y-2"
      style={{ background: "#1E2840", border: "1px solid #2A3550" }}
    >
      {/* Header row */}
      <div className="flex items-center gap-2">
        <Switch
          checked={topic.is_approved}
          onCheckedChange={(checked) => onUpdate(topic.id, { is_approved: checked })}
          style={{ accentColor: "#10B981" }}
        />
        <Input
          value={title}
          onChange={(e) => { setTitle(e.target.value); debouncedSave({ title: e.target.value }); }}
          className="flex-1 h-7 text-sm font-medium"
          style={{ background: "transparent", border: "none", color: "#ECF0F7", padding: "0 4px" }}
        />
        {saving && <span className="text-xs" style={{ color: "#8B99B0" }}>saving…</span>}
        <button onClick={() => setExpanded(!expanded)} style={{ color: "#8B99B0" }}>
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 hover:text-red-400"
          onClick={() => onDelete(topic.id)}
        >
          <Trash2 size={14} />
        </Button>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="space-y-2 pl-1">
          <Textarea
            value={summary}
            onChange={(e) => { setSummary(e.target.value); debouncedSave({ summary: e.target.value }); }}
            placeholder="Topic summary…"
            rows={3}
            className="text-xs resize-none"
            style={{ background: "#141C2E", border: "1px solid #2A3550", color: "#ECF0F7" }}
          />
          <TopicKeyPointsEditor
            points={keyPoints}
            onChange={(pts) => { setKeyPoints(pts); debouncedSave({ key_points: pts }); }}
          />
        </div>
      )}
    </div>
  );
}
```

### 4. `topic-review-panel.tsx`

```typescript
"use client";
import { useEffect, useState, useCallback } from "react";
import { Loader2, CheckSquare, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TopicCard } from "./topic-card";
import type { DocumentTopic } from "./question-bank-types";

interface Props {
  documentId: string;
  onGenerateQuestions: (approvedTopicIds: string[]) => Promise<void>;
  generating: boolean;
}

export function TopicReviewPanel({ documentId, onGenerateQuestions, generating }: Props) {
  const [topics, setTopics] = useState<DocumentTopic[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/document-sources/${documentId}/topics`)
      .then((r) => r.json())
      .then((data: DocumentTopic[]) => { setTopics(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [documentId]);

  const handleUpdate = useCallback(async (id: string, patch: Partial<DocumentTopic>) => {
    await fetch(`/api/document-topics/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    setTopics((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const handleDelete = useCallback(async (id: string) => {
    await fetch(`/api/document-topics/${id}`, { method: "DELETE" });
    setTopics((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const approvedIds = topics.filter((t) => t.is_approved).map((t) => t.id);
  const allApproved = topics.length > 0 && approvedIds.length === topics.length;

  function toggleAll() {
    const next = !allApproved;
    topics.forEach((t) => handleUpdate(t.id, { is_approved: next }));
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 py-8 justify-center" style={{ color: "#8B99B0" }}>
        <Loader2 size={16} className="animate-spin" /> Loading topics…
      </div>
    );
  }

  if (!topics.length) {
    return <p className="text-center py-8 text-sm" style={{ color: "#8B99B0" }}>No topics extracted.</p>;
  }

  return (
    <div className="space-y-3">
      {/* Panel header */}
      <div className="flex items-center justify-between">
        <button
          className="flex items-center gap-1.5 text-sm"
          style={{ color: "#8B99B0" }}
          onClick={toggleAll}
        >
          {allApproved ? <CheckSquare size={15} style={{ color: "#10B981" }} /> : <Square size={15} />}
          {allApproved ? "Deselect all" : "Select all"} ({topics.length} topics)
        </button>
        <Button
          disabled={approvedIds.length === 0 || generating}
          onClick={() => onGenerateQuestions(approvedIds)}
          style={{ background: "#7C8FFF", color: "#fff" }}
          className="text-sm h-8"
        >
          {generating ? (
            <><Loader2 size={14} className="animate-spin mr-1" /> Generating…</>
          ) : (
            `Generate Questions from ${approvedIds.length} approved topic${approvedIds.length !== 1 ? "s" : ""}`
          )}
        </Button>
      </div>

      {/* Topic list */}
      <div className="space-y-2">
        {topics.map((topic) => (
          <TopicCard
            key={topic.id}
            topic={topic}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
          />
        ))}
      </div>
    </div>
  );
}
```

## Success Criteria

- [ ] `DocumentTopic` interface in `question-bank-types.ts`
- [ ] `DocumentSource.status` union extended with 3 new values
- [ ] `TopicKeyPointsEditor` renders chips, adds on Enter/blur, removes on ×
- [ ] `TopicCard` auto-saves title/summary/key_points 500ms after last change
- [ ] `TopicCard` approve toggle calls PUT immediately (no debounce)
- [ ] `TopicCard` delete removes card from list optimistically
- [ ] `TopicReviewPanel` fetches topics on mount, shows loading → list → empty states
- [ ] Approve-all toggle flips all topics
- [ ] CTA disabled when 0 approved; shows correct count
- [ ] CTA calls `onGenerateQuestions(approvedIds)` with only approved ids

## Risk Assessment

- `Switch` component may need `style={{ accentColor }}` overridden — verify shadcn Switch renders with green checked state; if not, use a custom toggle button instead
- Auto-save debounce shares a `useRef` timer — verify no stale closure issues when rapid edits on different fields; if problematic, use per-field debounce or a single `pendingPatch` state accumulator
- `handleUpdate` optimistic update patches local state but doesn't roll back on API error — add error toast if needed post-MVP
