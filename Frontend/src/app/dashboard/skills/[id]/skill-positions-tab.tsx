"use client";

import Link from "next/link";
import { Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { SkillDetail } from "@/app/dashboard/management-types";

type Requirement = SkillDetail["position_requirements"][number];

interface Props {
  requirements: Requirement[];
}

const LEVEL_COLORS: Record<number, string> = {
  1: "border-yellow-500/30 text-yellow-400 bg-yellow-500/10",
  2: "border-yellow-500/30 text-yellow-300 bg-yellow-500/15",
  3: "border-blue-500/30 text-blue-400 bg-blue-500/10",
  4: "border-blue-500/30 text-blue-300 bg-blue-500/15",
  5: "border-purple-500/30 text-purple-300 bg-purple-500/15",
};

export default function SkillPositionsTab({ requirements }: Props) {
  if (!requirements.length) {
    return (
      <EmptyState
        icon={<Briefcase />}
        title="No positions require this skill yet"
        className="border-0 bg-transparent py-12"
      />
    );
  }

  return (
    <Card className="bg-[#1B253B] border-[#8B99B0]/10 p-4">
      <h3 className="mb-3 text-sm font-medium text-[#ECF0F7]">
        Positions Requiring This Skill ({requirements.length})
      </h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Position</TableHead>
            <TableHead className="hidden sm:table-cell">Department</TableHead>
            <TableHead className="text-center">Level</TableHead>
            <TableHead className="text-center">Mandatory</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {requirements.map((req) => (
            <TableRow key={req.position_id}>
              <TableCell>
                <Link
                  href={`/dashboard/positions/${req.position_id}`}
                  className="font-medium text-[#7C8FFF] hover:text-[#9BAAFF] hover:underline"
                >
                  {req.position_title}
                </Link>
              </TableCell>
              <TableCell className="hidden text-[#8B99B0] sm:table-cell">
                {req.department || "—"}
              </TableCell>
              <TableCell className="text-center">
                <Badge
                  variant="outline"
                  className={`text-xs ${LEVEL_COLORS[req.required_level] ?? "border-[#8B99B0]/20 text-[#8B99B0]"}`}
                >
                  L{req.required_level}
                </Badge>
              </TableCell>
              <TableCell className="text-center">
                {req.is_mandatory ? (
                  <span className="text-xs text-green-400">Yes</span>
                ) : (
                  <span className="text-xs text-[#5A6882]">No</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Card>
  );
}
