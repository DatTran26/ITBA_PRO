"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, GraduationCap } from "lucide-react";
import type { PersonSkillItem, SkillRequirement } from "@/app/dashboard/management-types";

interface Props {
  personId: string;
  skills: PersonSkillItem[];
  positionId: string | null;
}

export default function PersonSkillsTab({ personId, skills, positionId }: Props) {
  const [requirements, setRequirements] = useState<SkillRequirement[]>([]);

  useEffect(() => {
    if (!positionId) return;
    fetch(`/api/positions/${positionId}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.position?.position_skill_requirements) {
          setRequirements(data.position.position_skill_requirements);
        }
      })
      .catch(() => {});
  }, [positionId]);

  const skillMap = new Map(skills.map((s) => [s.skill_id, s]));

  return (
    <div className="space-y-4">
      {/* Current skills */}
      <Card className="bg-muted border-border/10 p-4">
        <div className="flex items-center gap-2 mb-3">
          <GraduationCap className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-medium text-foreground">Current Skills ({skills.length})</h3>
        </div>
        {skills.length === 0 ? (
          <p className="text-sm text-muted-foreground">No skills recorded</p>
        ) : (
          <div className="space-y-1.5">
            {skills.map((s) => (
              <div key={s.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background">
                <div>
                  <span className="text-sm text-foreground">{s.skills.name}</span>
                  {s.skills.category && <span className="text-xs text-muted-foreground ml-2">{s.skills.category}</span>}
                </div>
                <Badge variant="outline" className="border-border/30 text-primary text-xs">
                  Level {s.current_level}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Required vs current (gap analysis) */}
      {positionId && requirements.length > 0 && (
        <Card className="bg-muted border-border/10 p-4">
          <h3 className="text-sm font-medium text-foreground mb-3">Position Requirements Gap</h3>
          <div className="space-y-1.5">
            {requirements.map((req) => {
              const current = skillMap.get(req.skill_id);
              const met = current && current.current_level >= req.required_level;
              return (
                <div key={req.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background">
                  <div className="flex items-center gap-2">
                    {met ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-success shrink-0" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-danger shrink-0" />
                    )}
                    <span className="text-sm text-foreground">{req.skills.name}</span>
                    {req.is_mandatory && <span className="text-[10px] text-danger">Required</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={met ? "text-success" : "text-danger"}>
                      {current ? current.current_level : 0}
                    </span>
                    <span className="text-muted-foreground">/</span>
                    <span className="text-muted-foreground">{req.required_level}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {positionId && requirements.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">No skill requirements defined for this position</p>
      )}
      {!positionId && (
        <p className="text-sm text-muted-foreground text-center py-4">Assign a position to see skill gap analysis</p>
      )}
    </div>
  );
}
