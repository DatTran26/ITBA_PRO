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
import type { GroupListItem } from "@/app/dashboard/management-types";

const GROUP_TYPES = ["department", "batch", "campaign", "other"] as const;

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  type: z.enum(GROUP_TYPES),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: GroupListItem | null;
}

export default function GroupFormDialog({ open, onOpenChange, onSuccess, editData }: Props) {
  const isEdit = !!editData;
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "department" },
  });

  useEffect(() => {
    if (open) {
      reset(isEdit ? {
        name: editData.name,
        type: editData.type,
        description: editData.description ?? "",
      } : { name: "", type: "department", description: "" });
    }
  }, [open, isEdit, editData, reset]);

  async function onSubmit(values: FormValues) {
    try {
      const url = isEdit ? `/api/groups/${editData.id}` : "/api/groups";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(isEdit ? "Group updated" : "Group created");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Failed to save group");
    }
  }

  const typeValue = watch("type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0C1220] border-[#8B99B0]/15 text-[#ECF0F7] max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Group" : "Create Group"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label className="text-[#8B99B0] text-xs mb-1 block">Name *</Label>
            <Input {...register("name")} className="bg-[#1E2840] border-[#8B99B0]/15 text-[#ECF0F7]" />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <Label className="text-[#8B99B0] text-xs mb-1 block">Type *</Label>
            <Select value={typeValue} onValueChange={(v) => setValue("type", v as typeof GROUP_TYPES[number])}>
              <SelectTrigger className="bg-[#1E2840] border-[#8B99B0]/15 text-[#ECF0F7]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1E2840] border-[#8B99B0]/15">
                {GROUP_TYPES.map((t) => (
                  <SelectItem key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
