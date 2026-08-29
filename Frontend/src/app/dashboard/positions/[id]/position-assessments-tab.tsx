"use client";

import { Card } from "@/components/ui/card";
import { FileText } from "lucide-react";

interface Props {
  positionTitle: string;
}

export default function PositionAssessmentsTab({ positionTitle }: Props) {
  return (
    <div className="flex flex-col items-center py-12 text-center">
      <div className="w-10 h-10 rounded-xl bg-[#222C4A] border border-[#8B99B0]/10 flex items-center justify-center mb-3">
        <FileText className="w-5 h-5 text-[#5A6882]" />
      </div>
      <p className="text-sm text-[#5A6882]">Assessment templates linked to &ldquo;{positionTitle}&rdquo; will appear here</p>
      <p className="text-xs text-[#5A6882]/60 mt-1">Create tests with this job role to see them listed</p>
    </div>
  );
}
