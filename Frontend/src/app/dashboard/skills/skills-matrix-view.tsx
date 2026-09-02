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
      <div className="border border-[#8B99B0]/10 rounded-xl p-8 text-center bg-[#1B253B]">
        <p className="text-sm text-[#5A6882] mb-1">Matrix data not available</p>
        <p className="text-xs text-[#5A6882]">Switch to table view for full data</p>
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
              ? "bg-[#7C8FFF] text-white"
              : "bg-[#1B253B] text-[#5A6882] hover:text-[#ECF0F7] border border-[#8B99B0]/10"
          }`}
        >
          Position — Skill
        </button>
        <button
          onClick={() => setSubView("person")}
          className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
            subView === "person"
              ? "bg-[#7C8FFF] text-white"
              : "bg-[#1B253B] text-[#5A6882] hover:text-[#ECF0F7] border border-[#8B99B0]/10"
          }`}
        >
          Person — Skill
        </button>
        <span className="text-xs text-[#5A6882] ml-2">
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
            <span className="text-xs text-[#5A6882]">
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
      <div className="border border-[#8B99B0]/10 rounded-xl p-6 text-center bg-[#1B253B]">
        <p className="text-sm text-[#5A6882]">No data to display</p>
      </div>
    );
  }

  return (
    <div className="border border-[#8B99B0]/10 rounded-xl overflow-auto bg-[#1B253B]">
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-[#8B99B0]/10">
            <th className="px-3 py-2 text-left text-[#5A6882] font-medium min-w-[140px] sticky left-0 bg-[#1B253B]">
              {rowLabel}
            </th>
            {skills.map((s) => (
              <th
                key={s.id}
                className="px-2 py-2 text-center text-[#5A6882] font-medium min-w-[80px] max-w-[100px]"
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
              <tr key={row.id} className="border-b border-[#8B99B0]/5 hover:bg-[#0F1829] transition-colors">
                <td className="px-3 py-2 sticky left-0 bg-inherit">
                  <p className="font-medium text-[#ECF0F7] truncate max-w-[130px]">{row.label}</p>
                  {row.sublabel && <p className="text-[#5A6882] truncate max-w-[130px]">{row.sublabel}</p>}
                </td>
                {skills.map((s) => {
                  const level = getLevel(s.id);
                  return (
                    <td key={s.id} className="px-2 py-2 text-center">
                      {level !== null ? (
                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded font-medium ${LEVEL_COLORS[level] ?? "bg-[#222C4A] text-[#8B99B0]"}`}>
                          {level}
                        </span>
                      ) : (
                        <span className="text-[#222C4A]">—</span>
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
