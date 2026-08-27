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
        <p className="text-sm text-[#5A6882]">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        <Button
          onClick={onAddMember}
          size="sm"
          className="bg-[#7C8FFF] hover:bg-[#5B6CF0] text-white gap-1.5"
        >
          <UserPlus className="w-3.5 h-3.5" /> Add Member
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="flex flex-col items-center py-14 text-center">
          <div className="w-12 h-12 rounded-xl bg-[#222C4A] border border-[#8B99B0]/10 flex items-center justify-center mb-3">
            <Users className="w-6 h-6 text-[#5A6882]" />
          </div>
          <p className="text-sm text-[#5A6882] mb-3">No members yet</p>
          <Button onClick={onAddMember} size="sm" variant="outline" className="border-[#8B99B0]/20 text-[#8B99B0] hover:text-[#ECF0F7]">
            Add first member
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#1B253B] border border-[#8B99B0]/10 group hover:border-[#8B99B0]/20 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-[#222C4A] flex items-center justify-center text-xs font-bold text-[#7C8FFF] shrink-0">
                  {m.persons.full_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#ECF0F7] truncate">{m.persons.full_name}</p>
                  <p className="text-xs text-[#5A6882] truncate">{m.persons.email ?? "—"}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-2 shrink-0">
                {m.persons.department && (
                  <Badge variant="outline" className="text-xs border-[#8B99B0]/20 text-[#8B99B0] hidden sm:inline-flex">
                    {m.persons.department}
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs capitalize border-[#8B99B0]/20 text-[#8B99B0]">
                  {m.persons.type}
                </Badge>
                <button
                  onClick={() => onRemoveMember(m.id, m.persons.full_name)}
                  disabled={removingId === m.id}
                  className="p-1.5 rounded text-[#5A6882] hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
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
