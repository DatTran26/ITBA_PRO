"use client";

import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface Props {
  positionTitle: string;
}

export default function PositionAssessmentsTab({ positionTitle }: Props) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="w-10 h-10 rounded-xl bg-accent border border-border/10 flex items-center justify-center mb-3">
        <FileText className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">Assessment templates linked to &ldquo;{positionTitle}&rdquo; will appear here</p>
      <p className="text-xs text-muted-foreground/60 mt-1">Create tests with this job role to see them listed</p>
    </div>
  );
}
