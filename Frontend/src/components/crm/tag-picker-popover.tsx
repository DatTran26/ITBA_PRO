"use client";

import { useState, useEffect, useCallback } from "react";
import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import type { TagItem, EntityType } from "@/app/dashboard/management-types";

interface TagPickerPopoverProps {
  entityType: EntityType;
  entityId: string;
  activeTags: TagItem[];
  onTagToggle: (tag: TagItem, attached: boolean) => void;
  children: React.ReactNode;
}

export default function TagPickerPopover({
  entityType,
  entityId,
  activeTags,
  onTagToggle,
  children,
}: TagPickerPopoverProps) {
  const [allTags, setAllTags] = useState<TagItem[]>([]);
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState(false);

  const activeIds = new Set(activeTags.map((t) => t.id));

  const fetchTags = useCallback(async () => {
    const res = await fetch("/api/tags");
    if (res.ok) {
      const { tags } = await res.json();
      setAllTags(tags ?? []);
    }
  }, []);

  useEffect(() => {
    if (open) fetchTags();
  }, [open, fetchTags]);

  const handleToggle = async (tag: TagItem) => {
    const isAttached = activeIds.has(tag.id);
    const method = isAttached ? "DELETE" : "POST";
    const res = await fetch("/api/entity-tags", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag_id: tag.id, entity_type: entityType, entity_id: entityId }),
    });
    if (res.ok) onTagToggle(tag, !isAttached);
  };

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    try {
      const res = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        const { tag } = await res.json();
        setAllTags((prev) => [...prev, tag]);
        setNewName("");
      }
    } finally {
      setCreating(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger render={<span />}>{children}</PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-56 bg-muted border-border/10 p-2"
      >
        <div className="space-y-2">
          <div className="max-h-40 overflow-y-auto space-y-0.5">
            {allTags.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">No tags yet</p>
            )}
            {allTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => handleToggle(tag)}
                className="flex items-center gap-2 w-full px-2 py-1.5 rounded text-xs hover:bg-accent transition-colors"
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: tag.color }}
                />
                <span className="flex-1 text-left text-foreground truncate">{tag.name}</span>
                {activeIds.has(tag.id) && <Check className="w-3 h-3 text-primary shrink-0" />}
              </button>
            ))}
          </div>

          <div className="border-t border-border/10 pt-2 flex gap-1">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="New tag..."
              maxLength={30}
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              className="h-7 text-xs bg-accent border-border/10 text-foreground placeholder:text-muted-foreground"
            />
            <Button
              size="sm"
              onClick={handleCreate}
              disabled={!newName.trim() || creating}
              className="h-7 w-7 p-0 bg-primary hover:bg-primary"
            >
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
