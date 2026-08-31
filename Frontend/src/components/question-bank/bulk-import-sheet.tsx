"use client";

import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import QuestionBankBulkImportTab from "@/app/dashboard/question-bank/question-bank-bulk-import-tab";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export default function BulkImportSheet({ open, onOpenChange }: Props) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-xl bg-[#131929] border-[#8B99B0]/10 overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="text-[#ECF0F7] text-lg font-light">Bulk Import Questions</SheetTitle>
        </SheetHeader>
        <QuestionBankBulkImportTab />
      </SheetContent>
    </Sheet>
  );
}
