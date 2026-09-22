"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { AlertTriangle } from "lucide-react";
import type { SkillRequirement } from "@/app/dashboard/management-types";

interface AssignedPerson {
  id: string;
  full_name: string;
}

interface PersonSkillRow {
  person_id: string;
  skill_id: string;
  current_level: number;
}

interface GapEntry {
  skillName: string;
  requiredLevel: number;
  isMandatory: boolean;
  missingCount: number;
  belowCount: number;
}

interface Props {
  persons: AssignedPerson[];
  requirements: SkillRequirement[];
}

export default function PositionGapAnalysisTab({ persons, requirements }: Props) {
  const [gaps, setGaps] = useState<GapEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!persons.length || !requirements.length) {
      setGaps([]);
      setLoading(false);
      return;
    }

    async function analyze() {
      /* Fetch person_skills for all assigned persons */
      const personIds = persons.map((p) => p.id);
      const allSkills: PersonSkillRow[] = [];
      for (const pid of personIds) {
        try {
          const res = await fetch(`/api/person-skills?person_id=${pid}`);
          if (res.ok) {
            const { person_skills } = await res.json();
            allSkills.push(...(person_skills ?? []).map((s: { skill_id: string; current_level: number }) => ({
              person_id: pid,
              skill_id: s.skill_id,
              current_level: s.current_level,
            })));
          }
        } catch { /* skip */ }
      }

      /* Build gap entries */
      const entries: GapEntry[] = requirements.map((req) => {
        let missingCount = 0;
        let belowCount = 0;
        for (const pid of personIds) {
          const ps = allSkills.find((s) => s.person_id === pid && s.skill_id === req.skill_id);
          if (!ps) { missingCount++; }
          else if (ps.current_level < req.required_level) { belowCount++; }
        }
        return {
          skillName: req.skills.name,
          requiredLevel: req.required_level,
          isMandatory: req.is_mandatory,
          missingCount,
          belowCount,
        };
      });

      entries.sort((a, b) => (b.missingCount + b.belowCount) - (a.missingCount + a.belowCount));
      setGaps(entries);
      setLoading(false);
    }

    analyze();
  }, [persons, requirements]);

  if (loading) {
    return (
      <Card className="bg-muted border-border/10 p-6">
        <div className="animate-pulse space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-10 bg-accent rounded" />
          ))}
        </div>
      </Card>
    );
  }

  if (!persons.length || !requirements.length) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <div className="w-10 h-10 rounded-xl bg-accent border border-border/10 flex items-center justify-center mb-3">
          <AlertTriangle className="w-5 h-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          {!persons.length ? "No assigned persons to analyze" : "No skill requirements to compare against"}
        </p>
      </div>
    );
  }

  const totalPersons = persons.length;

  return (
    <Card className="bg-muted border-border/10 p-4">
      <h3 className="text-sm font-medium text-foreground mb-3">
        Gap Analysis — {totalPersons} person{totalPersons !== 1 ? "s" : ""} × {requirements.length} skill{requirements.length !== 1 ? "s" : ""}
      </h3>
      <div className="space-y-1.5">
        {gaps.map((g) => {
          const gapTotal = g.missingCount + g.belowCount;
          const pct = totalPersons > 0 ? Math.round(((totalPersons - gapTotal) / totalPersons) * 100) : 0;
          return (
            <div key={g.skillName} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-background">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground truncate">{g.skillName}</span>
                  {g.isMandatory && <span className="text-[10px] text-warning">mandatory</span>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Level {g.requiredLevel} required · {g.missingCount} missing · {g.belowCount} below level
                </p>
              </div>
              <div className="w-20 shrink-0">
                <div className="h-1.5 bg-accent rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: pct >= 80 ? "var(--success)" : pct >= 50 ? "var(--warning)" : "var(--danger)",
                    }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground text-right mt-0.5">{pct}% ready</p>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
