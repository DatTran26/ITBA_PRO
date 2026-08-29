"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import type { PositionDetail } from "@/app/dashboard/management-types";

const LEVELS = ["Junior", "Mid", "Senior", "Lead", "Principal", "Manager", "Director"];

const schema = z.object({
  title: z.string().min(1, "Title is required"),
  department: z.string().optional(),
  description: z.string().optional(),
  target_level: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: PositionDetail | null;
}

export default function PositionFormDialog({ open, onOpenChange, onSuccess, editData }: Props) {
  const isEdit = !!editData;
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  useEffect(() => {
    if (open) {
      reset(isEdit ? {
        title: editData.title,
        department: editData.department ?? "",
        description: editData.description ?? "",
        target_level: editData.target_level ?? "",
      } : { title: "", department: "", description: "", target_level: "" });
    }
  }, [open, isEdit, editData, reset]);

  async function onSubmit(values: FormValues) {
    try {
      const url = isEdit ? `/api/positions/${editData.id}` : "/api/positions";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(isEdit ? "Position updated" : "Position created");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Failed to save position");
    }
  }

  const levelValue = watch("target_level");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0C1220] border-[#8B99B0]/15 text-[#ECF0F7] max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Position" : "Add Position"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label className="text-[#8B99B0] text-xs mb-1 block">Title *</Label>
            <Input {...register("title")} className="bg-[#1E2840] border-[#8B99B0]/15 text-[#ECF0F7]" />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-[#8B99B0] text-xs mb-1 block">Department</Label>
              <Input {...register("department")} className="bg-[#1E2840] border-[#8B99B0]/15 text-[#ECF0F7]" />
            </div>
            <div>
              <Label className="text-[#8B99B0] text-xs mb-1 block">Target Level</Label>
              <Select value={levelValue ?? ""} onValueChange={(v) => setValue("target_level", v ?? undefined)}>
                <SelectTrigger className="bg-[#1E2840] border-[#8B99B0]/15 text-[#ECF0F7]">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent className="bg-[#1E2840] border-[#8B99B0]/15">
                  {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-[#8B99B0] text-xs mb-1 block">Description</Label>
            <Textarea {...register("description")} rows={3} className="bg-[#1E2840] border-[#8B99B0]/15 text-[#ECF0F7] resize-none" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-[#8B99B0]/20 text-[#8B99B0] hover:text-[#ECF0F7]">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#7C8FFF] hover:bg-[#6B7FEF] text-white">
              {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
