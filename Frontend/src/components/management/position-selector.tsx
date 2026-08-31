"use client";

import { useEffect, useState } from "react";
import { Briefcase } from "lucide-react";

interface Position {
    id: string;
    title: string;
    department?: string | null;
}

interface Props {
    value: string | null;
    onChange: (value: string | null) => void;
    disabled?: boolean;
}

export default function PositionSelector({ value, onChange, disabled }: Props) {
    const [positions, setPositions] = useState<Position[]>([]);

    useEffect(() => {
        fetch("/api/positions")
            .then((r) => r.json())
            .then((d) => { if (d.positions) setPositions(d.positions); })
            .catch(() => {});
    }, []);

    if (positions.length === 0) return null;

    return (
        <div className="flex flex-col gap-2">
            <span className="text-[11px] uppercase tracking-widest font-semibold text-[#5A6882] flex items-center gap-1.5">
                <Briefcase className="w-3 h-3" />
                Linked Position (Optional)
            </span>
            <select
                value={value ?? ""}
                onChange={(e) => onChange(e.target.value || null)}
                disabled={disabled}
                className="w-full bg-[#151D2E] border border-[#8B99B0]/15 rounded-xl px-3 py-2 text-sm text-[#ECF0F7] focus:border-[#7C8FFF]/50 focus:outline-none transition-colors disabled:opacity-50"
            >
                <option value="">No position linked</option>
                {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                        {p.title}{p.department ? ` — ${p.department}` : ""}
                    </option>
                ))}
            </select>
        </div>
    );
}
