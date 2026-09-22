"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Trash2, Users } from "lucide-react";
import type { GroupMemberItem } from "@/app/dashboard/management-types";

interface Props {
  groupId: string;
  members: GroupMemberItem[];
  onAddMember: () => void;
  onRemoveMember: (memberId: string, name: string) => void;
  removingId: string | null;
}

export default function GroupMembersTab({ members, onAddMember, onRemoveMember, removingId }: Props) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        <Button
          onClick={onAddMember}
          size="sm"
          className="bg-primary hover:bg-primary text-white gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5" /> Add Member
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <div className="w-12 h-12 rounded-xl bg-accent border border-border/10 flex items-center justify-center mb-3">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">No members yet</p>
          <Button onClick={onAddMember} size="sm" variant="outline" className="border-border/20 text-muted-foreground hover:text-foreground">
            Add first member
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-muted border border-border/10 group hover:border-border/20 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-accent flex items-center justify-center text-xs font-bold text-primary shrink-0">
                  {m.persons.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{m.persons.full_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{m.persons.email ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2 shrink-0">
                {m.persons.department && (
                  <Badge variant="outline" className="text-xs border-border/20 text-muted-foreground hidden sm:inline-flex">
                    {m.persons.department}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs capitalize border-border/20 text-muted-foreground">
                  {m.persons.type}
                </Badge>
                <button
                  onClick={() => onRemoveMember(m.id, m.persons.full_name)}
                  disabled={removingId === m.id}
                  className="p-1.5 rounded text-muted-foreground hover:text-danger hover:bg-danger/10 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                  aria-label={`Remove ${m.persons.full_name}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
