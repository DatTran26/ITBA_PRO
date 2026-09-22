"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";
import type { SkillDetail } from "@/app/dashboard/management-types";

type PersonSkill = SkillDetail["person_skills"][number];

interface Props {
  personSkills: PersonSkill[];
}

const LEVEL_COLORS: Record<number, string> = {
  1: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
  2: "border-yellow-500/30 text-yellow-300 bg-yellow-500/15",
  3: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  4: "border-blue-500/30 text-blue-300 bg-blue-500/15",
  5: "border-purple-500/30 text-purple-300 bg-purple-500/15",
};

const LEVEL_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Basic",
  3: "Proficient",
  4: "Advanced",
  5: "Expert",
};

export default function SkillPersonsTab({ personSkills }: Props) {
  if (!personSkills.length) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="w-10 h-10 rounded-xl bg-accent border border-border/10 flex items-center justify-center mb-3">
          <Users className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">No persons have this skill recorded</p>
      </div>
    );
  }

  /* Level distribution */
  const distribution = [1, 2, 3, 4, 5].map((lvl) => ({
    level: lvl,
    count: personSkills.filter((ps) => ps.current_level === lvl).length,
  }));

  const sorted = [...personSkills].sort((a, b) => b.current_level - a.current_level);

  return (
    <div className="space-y-4">
      {/* Distribution summary */}
      <div className="flex flex-wrap gap-2">
        {distribution.map(({ level, count }) =>
          count > 0 ? (
            <div key={level} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted border border-border/10">
              <Badge variant="outline" className={`text-xs ${LEVEL_COLORS[level]}`}>L{level}</Badge>
              <span className="text-xs text-muted-foreground">{count}</span>
            </div>
          ) : null
        )}
      </div>

      <Card className="bg-muted border-border/10 p-4">
        <h3 className="text-sm font-medium text-foreground mb-3">
          Persons With This Skill ({personSkills.length})
        </h3>
        <div className="space-y-1.5">
          {sorted.map((ps) => (
            <Link
              key={ps.person_id}
              href={`/dashboard/persons/${ps.person_id}`}
              className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-background hover:bg-accent transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-ai/20 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                  {ps.person_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm text-foreground group-hover:text-white">{ps.person_name}</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Level bar */}
                <div className="hidden sm:flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <div
                      key={bar}
                      className={`w-4 h-1.5 rounded-full transition-colors ${
                        bar <= ps.current_level ? "bg-primary" : "bg-accent"
                      }`}
                    />
                  ))}
                </div>
                <Badge variant="outline" className={`text-xs ${LEVEL_COLORS[ps.current_level] ?? "border-border/20 text-muted-foreground"}`}>
                  L{ps.current_level} · {LEVEL_LABELS[ps.current_level] ?? "Unknown"}
                </Badge>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
