"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Pin, PinOff, Trash2, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import NoteForm from "@/components/crm/note-form";
import { NOTE_TYPES } from "@/lib/crm/constants";
import type { NoteItem, NoteType, EntityType } from "@/app/dashboard/management-types";
import { createClient } from "@/lib/supabase/client";

// Format helper
const formatRelativeTime = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (diffInSeconds < 60) return "Vừa xong";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
  return date.toLocaleDateString('vi-VN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
};

// Determines initials
const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/);
  if (words.length >= 2) {
    return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};

// Generates a consistent avatar gradient based on string
const getAvatarGradient = (name: string) => {
  const colors = [
    "from-blue-500 to-cyan-400",
    "from-violet-500 to-purple-400",
    "from-emerald-500 to-teal-400",
    "from-rose-500 to-pink-400",
    "from-amber-500 to-orange-400",
    "from-indigo-500 to-blue-400",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

interface NotesPanelProps {
  entityType: EntityType;
  entityId: string;
}

export default function NotesPanel({ entityType, entityId }: NotesPanelProps) {
  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const notesContainerRef = useRef<HTMLDivElement>(null);

  const fetchNotes = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/notes?entity_type=${entityType}&entity_id=${entityId}`);
      if (res.ok) {
        const { notes: data } = await res.json();
        setNotes(data ?? []);
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [entityType, entityId]);

  useEffect(() => {
    const supabase = createClient();

    // Get current user to distinguish own notes visually
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUserId(data.user?.id || null);
    });

    fetchNotes();

    // Supabase realtime for collaborative HR notes
    const channel = supabase
      .channel(`public:notes:${entityId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notes",
          filter: `entity_id=eq.${entityId}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setNotes(prev => prev.filter(n => n.id !== payload.old.id));
          } else {
            // Re-fetch to get complete payload (e.g. joined user info)
            fetchNotes(true);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [entityType, entityId, fetchNotes]);

  const handleCreate = async (content: string, noteType: NoteType) => {
    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entity_type: entityType, entity_id: entityId, content, note_type: noteType }),
    });
    if (res.ok) {
      const { note } = await res.json();
      setNotes((prev) => [note, ...prev].sort((a, b) => (a.is_pinned === b.is_pinned ? 0 : a.is_pinned ? -1 : 1)));
    }
  };

  const handleTogglePin = async (note: NoteItem) => {
    // Optimistic UI
    setNotes((prev) =>
      prev
        .map((n) => (n.id === note.id ? { ...n, is_pinned: !n.is_pinned } : n))
        .sort((a, b) => (a.is_pinned === b.is_pinned ? 0 : a.is_pinned ? -1 : 1))
    );
    const res = await fetch(`/api/notes/${note.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_pinned: !note.is_pinned }),
    });
    if (!res.ok) {
      // Revert on fail
      fetchNotes(true);
    }
  };

  const handleDelete = async (noteId: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== noteId));
    await fetch(`/api/notes/${noteId}`, { method: "DELETE" });
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="w-10 h-10 rounded-full bg-accent animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-1/4 bg-accent rounded animate-pulse" />
              <div className="h-16 bg-accent rounded-xl animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full max-h-[800px]">
      <div className="shrink-0 relative z-20">
        <NoteForm onSubmit={handleCreate} />
      </div>

      <div
        ref={notesContainerRef}
        className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-6 relative z-10"
      >
        {notes.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-center border overflow-hidden relative bg-gradient-to-br from-muted/30 to-background/30 backdrop-blur-sm border-border rounded-2xl">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-ai/20 border border-border/30 flex items-center justify-center mb-4 shadow-[0_0_25px_color-mix(in_srgb,var(--primary)_15%,transparent)]">
              <StickyNote className="w-6 h-6 text-primary" />
            </div>
            <p className="text-[14px] font-bold text-foreground">Chưa có ghi chú nào</p>
            <p className="text-[12.5px] text-muted-foreground mt-2 max-w-[250px] leading-relaxed">Hãy chia sẻ góc nhìn hoặc bình luận đầu tiên của bạn về ứng viên này.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {notes.map((note) => {
              const typeConfig = NOTE_TYPES[note.note_type] || NOTE_TYPES.general;
              const rawAuthor = note.users?.name ?? note.users?.email ?? "Unknown";
              const author = rawAuthor.split('@')[0]; // Clean email to name
              const initials = getInitials(author);
              const isMine = note.author_id === currentUserId;

              return (
                <div key={note.id} className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-500">
                  {/* Timeline Avatar */}
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(author)} flex items-center justify-center shrink-0 border-2 border-border shadow-[0_0_15px_rgba(0,0,0,0.5)] relative z-10 mt-1`}>
                    <span className="text-white font-bold text-[13px] tracking-wider">{initials}</span>
                  </div>

                  {/* Note Content */}
                  <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                    {/* Header: Name, Time, Actions */}
                    <div className="flex items-center justify-between gap-3 px-1">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-[13px] font-semibold text-foreground truncate">
                          {author} {isMine && <span className="text-muted-foreground font-medium text-[11px] ml-1">(Bạn)</span>}
                        </span>
                        <span className="text-muted-foreground text-[10px]">•</span>
                        <span className="text-[11px] font-medium text-muted-foreground whitespace-nowrap">
                          {formatRelativeTime(note.created_at)}
                        </span>
                      </div>

                      {/* Actions hover */}
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTogglePin(note)}
                          className={`h-6 w-6 p-0 rounded-md bg-muted/50 hover:bg-accent shadow-sm ${note.is_pinned ? "text-warning" : "text-muted-foreground hover:text-foreground"}`}
                          aria-label={note.is_pinned ? "Bỏ ghim" : "Ghim ghi chú"}
                        >
                          {note.is_pinned ? <PinOff className="w-3 h-3" /> : <Pin className="w-3 h-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(note.id)}
                          className="h-6 w-6 p-0 rounded-md bg-muted/50 hover:bg-muted text-muted-foreground hover:text-danger transition-colors shadow-sm"
                          aria-label="Xóa"
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>

                    {/* Bubble */}
                    <div className={`p-4 rounded-b-2xl rounded-tr-2xl relative transition-all duration-300 border backdrop-blur-md ${note.is_pinned
                      ? "bg-gradient-to-br from-warning/5 to-muted/80 border-border/30 shadow-[0_4px_25px_color-mix(in_srgb,var(--warning)_5%,transparent)]"
                      : "bg-gradient-to-br from-muted/60 to-background/60 border-border shadow-lg group-hover:border-border group-hover:shadow-xl"
                      }`}>
                      {note.is_pinned && (
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-warning/10 via-transparent to-transparent pointer-events-none rounded-tr-2xl" />
                      )}

                      <div className="relative z-10 flex flex-col gap-3">
                        <div className="flex items-center">
                          <Badge
                            variant="outline"
                            className="text-[10px] px-2 py-0.5 border-border font-bold uppercase tracking-widest bg-card/80 shadow-sm"
                            style={{ color: typeConfig.color }}
                          >
                            {typeConfig.label}
                          </Badge>
                        </div>
                        <p className="text-[13.5px] text-foreground whitespace-pre-wrap leading-relaxed">
                          {note.content}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
