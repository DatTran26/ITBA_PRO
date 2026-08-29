"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface DetailDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  width?: string;
}

export default function DetailDrawer({
  open,
  onClose,
  title,
  children,
  width = "max-w-lg",
}: DetailDrawerProps) {
  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="right"
        className={`${width} bg-[#1B253B] border-l border-[#8B99B0]/10 p-0 overflow-hidden flex flex-col`}
      >
        <SheetHeader className="px-5 py-4 border-b border-[#8B99B0]/10 shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-[#ECF0F7] text-base font-semibold">
              {title}
            </SheetTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-7 w-7 p-0 text-[#5A6882] hover:text-[#ECF0F7]"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </SheetContent>
    </Sheet>
  );
}
