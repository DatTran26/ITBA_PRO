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
      <DialogContent className="bg-background border-border/15 text-foreground max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Position" : "Add Position"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">Title *</Label>
            <Input {...register("title")} className="bg-muted border-border/15 text-foreground" />
            {errors.title && <p className="text-red-400 text-xs mt-1">{errors.title.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">Department</Label>
              <Input {...register("department")} className="bg-muted border-border/15 text-foreground" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs mb-1 block">Target Level</Label>
              <Select value={levelValue ?? ""} onValueChange={(v) => setValue("target_level", v ?? undefined)}>
                <SelectTrigger className="bg-muted border-border/15 text-foreground">
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent className="bg-muted border-border/15">
                  {LEVELS.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-muted-foreground text-xs mb-1 block">Description</Label>
            <Textarea {...register("description")} rows={3} className="bg-muted border-border/15 text-foreground resize-none" />
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-border/20 text-muted-foreground hover:text-foreground">Cancel</Button>
            <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary text-white">
              {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
