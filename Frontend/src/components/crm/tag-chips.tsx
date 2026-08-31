"use client";

import { X, Plus } from "lucide-react";
import type { TagItem } from "@/app/dashboard/management-types";

interface TagChipsProps {
  tags: TagItem[];
  onRemove?: (tagId: string) => void;
  onAdd?: () => void;
}

export default function TagChips({ tags, onRemove, onAdd }: TagChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag.id}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-[#8B99B0]/10"
          style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
        >
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ backgroundColor: tag.color }}
          />
          {tag.name}
          {onRemove && (
            <button
              onClick={() => onRemove(tag.id)}
              className="ml-0.5 rounded-full hover:bg-black/20 transition-colors p-0.5"
              aria-label={`Remove tag ${tag.name}`}
            >
              <X className="w-2.5 h-2.5" />
            </button>
          )}
        </span>
      ))}
      {onAdd && (
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border border-dashed border-[#8B99B0]/30 text-[#5A6882] hover:border-[#7C8FFF] hover:text-[#7C8FFF] transition-colors"
          aria-label="Add tag"
        >
          <Plus className="w-3 h-3" />
          Add tag
        </button>
      )}
    </div>
  );
}
