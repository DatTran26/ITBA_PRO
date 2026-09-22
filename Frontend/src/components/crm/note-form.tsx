"use client";

import { useState } from "react";
import { Send, MessageSquareText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { NOTE_TYPES } from "@/lib/crm/constants";
import type { NoteType } from "@/app/dashboard/management-types";

interface NoteFormProps {
  onSubmit: (content: string, noteType: NoteType) => Promise<void>;
  disabled?: boolean;
}

export default function NoteForm({ onSubmit, disabled }: NoteFormProps) {
  const [content, setContent] = useState("");
  const [noteType, setNoteType] = useState<NoteType>("general");
  const [submitting, setSubmitting] = useState(false);
  const selectedConfig = NOTE_TYPES[noteType] || NOTE_TYPES.general;

  const handleSubmit = async () => {
    const trimmed = content.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      await onSubmit(trimmed, noteType);
      setContent("");
      setNoteType("general");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative group/form">
      {/* Background glow on focus */}
      <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-ai/30 to-warning/30 rounded-[1.5rem] blur-md opacity-0 group-focus-within/form:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

      <div className="relative bg-card rounded-3xl border border-border group-focus-within/form:border-border/40 transition-colors duration-500 overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.4)]">

        {/* Input Area */}
        <div className="flex items-start">
          <div className="pl-5 pt-5 shrink-0">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-muted to-background border border-border flex items-center justify-center shadow-inner group-focus-within/form:border-border/40 transition-colors">
              <MessageSquareText className="w-4 h-4 text-muted-foreground group-focus-within/form:text-primary transition-colors" />
            </div>
          </div>

          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Bạn đang quan tâm điều gì về ứng viên này? Nhắn nhẹ cho team nhé..."
            rows={2}
            disabled={disabled || submitting}
            className="bg-transparent border-0 shadow-none text-foreground placeholder:text-muted-foreground focus-visible:ring-0 resize-none text-[13.5px] min-h-[70px] p-5 flex-1 leading-relaxed custom-scrollbar"
          />
        </div>

        {/* Toolbar Area */}
        <div className="flex items-center justify-between px-3 py-3 bg-background/80 border-t border-border">
          <div className="flex items-center gap-3">
            <Select value={noteType} onValueChange={(v) => setNoteType(v as NoteType)}>
              <SelectTrigger
                className="h-9 w-[130px] bg-muted hover:bg-accent border border-border text-[11px] font-bold tracking-widest uppercase transition-all flex shadow-sm gap-2 focus:ring-0 rounded-xl"
                style={{ color: selectedConfig.color }}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-muted border-border shadow-2xl rounded-xl p-1">
                {Object.entries(NOTE_TYPES).map(([key, { label, color }]) => (
                  <SelectItem
                    key={key}
                    value={key}
                    className="text-[12.5px] font-semibold cursor-pointer rounded-lg focus:bg-accent mb-0.5 last:mb-0"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shadow-[0_0_5px_currentColor]" style={{ backgroundColor: color, color }}></div>
                      <span style={{ color }}>{label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!content.trim() || submitting}
            className="h-9 pl-5 pr-4 bg-gradient-to-r from-primary to-primary hover:from-primary hover:to-primary text-white text-[12px] font-bold tracking-wide rounded-xl shadow-[0_0_20px_color-mix(in_srgb,var(--primary)_30%,transparent)] hover:shadow-[0_0_25px_color-mix(in_srgb,var(--primary)_50%,transparent)] disabled:opacity-50 disabled:shadow-none transition-all duration-300 flex items-center gap-2 group/btn"
          >
            Gửi
            <Send className="w-3.5 h-3.5 group-hover/btn:-translate-y-0.5 group-hover/btn:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </div>
  );
}
