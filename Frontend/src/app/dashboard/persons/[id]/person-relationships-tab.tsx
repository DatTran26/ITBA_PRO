"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { FolderKanban } from "lucide-react";

interface MembershipRow {
  id: string;
  groups: { id: string; name: string; type: string } | null;
}

interface Props {
  memberships: MembershipRow[];
}

export default function PersonRelationshipsTab({ memberships }: Props) {
  if (!memberships.length) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="w-10 h-10 rounded-xl bg-[#222C4A] border border-[#8B99B0]/10 flex items-center justify-center mb-3">
          <FolderKanban className="w-5 h-5 text-[#5A6882]" />
        </div>
        <p className="text-sm text-[#5A6882]">Not a member of any group</p>
      </div>
    );
  }

  return (
    <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-4">
      <h3 className="text-sm font-medium text-[#ECF0F7] mb-3">Group Memberships ({memberships.length})</h3>
      <div className="space-y-1.5">
        {memberships.map((m) => m.groups && (
          <Link
            key={m.id}
            href={`/dashboard/groups/${m.groups.id}`}
            className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#0A0F1A] hover:bg-[#222C4A] transition-colors group"
          >
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-[#7C8FFF]" />
              <span className="text-sm text-[#ECF0F7] group-hover:text-white">{m.groups.name}</span>
            </div>
            <span className="text-xs text-[#5A6882] capitalize">{m.groups.type}</span>
          </Link>
        ))}
      </div>
    </Card>
  );
}
