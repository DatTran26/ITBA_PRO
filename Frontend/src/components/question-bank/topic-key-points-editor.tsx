"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Props {
  points: string[];
  onChange: (points: string[]) => void;
  disabled?: boolean;
}

export function TopicKeyPointsEditor({ points, onChange, disabled }: Props) {
  const [draft, setDraft] = useState("");

  function add() {
    const trimmed = draft.trim();
    if (!trimmed) return;
    onChange([...points, trimmed]);
    setDraft("");
  }

  function remove(index: number) {
    onChange(points.filter((_, i) => i !== index));
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      add();
    }
  }

  return (
    <div className="space-y-2">
      <ul className="flex flex-wrap gap-1">
        {points.map((pt, i) => (
          <li
            key={i}
            className="flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 text-sm"
          >
            <span>{pt}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </li>
        ))}
      </ul>
      {!disabled && (
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={add}
          placeholder="Add key point and press Enter"
          className="h-8 text-sm"
        />
      )}
    </div>
  );
}
