"use client";

import { useEffect, useState } from "react";
import { Users2 } from "lucide-react";

interface Group {
    id: string;
    name: string;
    type: string;
}

interface Props {
    value: string | null;
    onChange: (value: string | null) => void;
    disabled?: boolean;
}

export default function GroupSelector({ value, onChange, disabled }: Props) {
    const [groups, setGroups] = useState<Group[]>([]);

    useEffect(() => {
        fetch("/api/groups")
            .then((r) => r.json())
            .then((d) => { if (d.groups) setGroups(d.groups); })
            .catch(() => {});
    }, []);

    if (groups.length === 0) return null;

    return (
        <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-widest font-semibold text-muted-foreground flex items-center gap-1.5">
                <Users2 className="w-3 h-3" />
                Assign to Group (Optional)
            </span>
            <select
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value || null)}
                disabled={disabled}
                className="w-full bg-card border border-border/15 rounded-xl px-3 py-2 text-sm text-foreground focus:border-border/50 focus:outline-none transition-colors disabled:opacity-50"
            >
                <option value="">No group assigned</option>
                {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                        {g.name} ({g.type})
                    </option>
                ))}
            </select>
        </div>
    );
}
