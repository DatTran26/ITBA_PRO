"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Search, UserPlus } from "lucide-react";
import type { PersonListItem } from "@/app/dashboard/management-types";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  groupId: string;
  existingMemberIds: string[];
  onSuccess: () => void;
}

export default function MemberPickerDialog({ open, onOpenChange, groupId, existingMemberIds, onSuccess }: Props) {
  const [persons, setPersons] = useState<PersonListItem[]>([]);
  const [search, setSearch] = useState("");
  const [adding, setAdding] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    fetch("/api/persons")
      .then((r) => r.json())
      .then((d) => setPersons(d.persons ?? []))
      .catch(() => toast.error("Failed to load persons"));
  }, [open]);

  const filtered = persons.filter((p) => {
    if (existingMemberIds.includes(p.id)) return false;
    const q = search.toLowerCase();
    return p.full_name.toLowerCase().includes(q) || (p.email ?? "").toLowerCase().includes(q);
  });

  async function handleAdd(personId: string) {
    setAdding(personId);
    try {
      const res = await fetch(`/api/groups/${groupId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ person_id: personId }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Member added");
      onSuccess();
      onOpenChange(false);
    } catch {
      toast.error("Failed to add member");
    } finally {
      setAdding(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background border-border/15 text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle>Add Member</DialogTitle>
        </DialogHeader>
        <div className="mt-2 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or email..."
              className="pl-9 bg-muted border-border/15 text-foreground"
            />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">No persons found</p>
            )}
            {filtered.map((p) => (
              <div key={p.id} className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-muted transition-colors">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{p.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.email ?? "—"}</p>
                </div>
                <div className="flex items-center gap-2 ml-2 shrink-0">
                  <Badge variant="outline" className="text-xs border-border/20 text-muted-foreground capitalize">{p.type}</Badge>
                  <Button
                    size="sm"
                    onClick={() => handleAdd(p.id)}
                    disabled={adding === p.id}
                    className="h-7 px-2 bg-primary hover:bg-primary text-white"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
