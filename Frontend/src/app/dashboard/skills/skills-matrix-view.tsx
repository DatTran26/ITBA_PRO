"use client";

import { useState } from "react";
import type { SkillListItem } from "@/app/dashboard/management-types";

interface PositionRow {
  id: string;
  title: string;
  department: string | null;
  skills: Record<string, number>; // skill_id -> required_level
}

interface PersonRow {
  id: string;
  name: string;
  skills: Record<string, number>; // skill_id -> current_level
}

interface MatrixData {
  positions: PositionRow[];
  persons: PersonRow[];
}

interface Props {
  skills: SkillListItem[];
  matrixData?: MatrixData;
}

type SubView = "position" | "person";

const LEVEL_COLORS: Record<number, string> = {
  1: "bg-yellow-900/60 text-yellow-300",
  2: "bg-yellow-800/60 text-yellow-200",
  3: "bg-blue-900/60 text-blue-300",
  4: "bg-blue-800/60 text-blue-200",
  5: "bg-purple-900/60 text-purple-300",
};

export default function SkillsMatrixView({ skills, matrixData }: Props) {
  const [subView, setSubView] = useState<SubView>("position");

  const displaySkills = skills.slice(0, 15);

  if (!matrixData) {
    return (
      <div className="border border-border/10 rounded-xl p-8 text-center bg-muted">
        <p className="text-sm text-muted-foreground mb-1">Matrix data not available</p>
        <p className="text-xs text-muted-foreground">Switch to table view for full data</p>
      </div>
    );
  }

  const { positions, persons } = matrixData;

  return (
    <div className="space-y-3">
      {/* Sub-view toggle */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSubView("position")}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            subView === "position"
              ? "bg-primary text-white"
              : "bg-muted text-muted-foreground hover:text-foreground border border-border/10"
          }`}
        >
          Position — Skill
        </button>
        <button
          onClick={() => setSubView("person")}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            subView === "person"
              ? "bg-primary text-white"
              : "bg-muted text-muted-foreground hover:text-foreground border border-border/10"
          }`}
        >
          Person — Skill
        </button>
        <span className="text-xs text-muted-foreground ml-2">
          Showing up to 15 skills
        </span>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-3 flex-wrap">
        {[1, 2, 3, 4, 5].map((lvl) => (
          <div key={lvl} className="flex items-center gap-1.5">
            <span className={`w-5 h-5 rounded text-xs flex items-center justify-center font-medium ${LEVEL_COLORS[lvl]}`}>
              {lvl}
            </span>
            <span className="text-xs text-muted-foreground">
              {lvl <= 2 ? "Basic" : lvl <= 4 ? "Proficient" : "Expert"}
            </span>
          </div>
        ))}
      </div>

      {subView === "position" && (
        <MatrixGrid
          rows={positions.map((p) => ({ id: p.id, label: p.title, sublabel: p.department }))}
          skills={displaySkills}
          getLevelFn={(rowId) => (skillId) => positions.find((p) => p.id === rowId)?.skills[skillId] ?? null}
          rowLabel="Position"
        />
      )}

      {subView === "person" && (
        <MatrixGrid
          rows={persons.map((p) => ({ id: p.id, label: p.name, sublabel: null }))}
          skills={displaySkills}
          getLevelFn={(rowId) => (skillId) => persons.find((p) => p.id === rowId)?.skills[skillId] ?? null}
          rowLabel="Person"
        />
      )}
    </div>
  );
}

function MatrixGrid({
  rows,
  skills,
  getLevelFn,
  rowLabel,
}: {
  rows: { id: string; label: string; sublabel: string | null }[];
  skills: SkillListItem[];
  getLevelFn: (rowId: string) => (skillId: string) => number | null;
  rowLabel: string;
}) {
  if (!rows.length || !skills.length) {
    return (
      <div className="border border-border/10 rounded-xl p-6 text-center bg-muted">
        <p className="text-sm text-muted-foreground">No data to display</p>
      </div>
    );
  }

  return (
    <div className="border border-border/10 rounded-xl overflow-auto bg-muted">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-border/10">
            <th className="px-3 py-2 text-left text-muted-foreground font-medium min-w-[140px] sticky left-0 bg-muted">
              {rowLabel}
            </th>
            {skills.map((s) => (
              <th
                key={s.id}
                className="px-2 py-2 text-center text-muted-foreground font-medium min-w-[80px] max-w-[100px]"
                title={s.name}
              >
                <span className="block truncate max-w-[80px]">{s.name}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const getLevel = getLevelFn(row.id);
            return (
              <tr key={row.id} className="border-b border-border/5 hover:bg-background transition-colors">
                <td className="px-3 py-2 sticky left-0 bg-inherit">
                  <p className="font-medium text-foreground truncate max-w-[130px]">{row.label}</p>
                  {row.sublabel && <p className="text-muted-foreground truncate max-w-[130px]">{row.sublabel}</p>}
                </td>
                {skills.map((s) => {
                  const level = getLevel(s.id);
                  return (
                    <td key={s.id} className="px-2 py-2 text-center">
                      {level !== null ? (
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded font-medium ${LEVEL_COLORS[level] ?? "bg-accent text-muted-foreground"}`}>
                          {level}
                        </span>
                      ) : (
                        <span className="text-accent">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
