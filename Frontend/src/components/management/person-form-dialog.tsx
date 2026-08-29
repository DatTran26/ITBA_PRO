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
import type { PersonDetail } from "@/app/dashboard/management-types";

const schema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email").or(z.literal("")).optional(),
  type: z.enum(["candidate", "employee"]),
  department: z.string().optional(),
  phone: z.string().optional(),
  current_level: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: PersonDetail | null;
}

export default function PersonFormDialog({ open, onOpenChange, onSuccess, editData }: Props) {
  const isEdit = !!editData;
  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "candidate" },
  });

  useEffect(() => {
    if (open) {
      reset(isEdit ? {
        full_name: editData.full_name,
        email: editData.email ?? "",
        type: editData.type,
        department: editData.department ?? "",
        phone: editData.phone ?? "",
        current_level: editData.current_level ?? "",
        notes: editData.notes ?? "",
      } : { type: "candidate", full_name: "", email: "", department: "", phone: "", current_level: "", notes: "" });
    }
  }, [open, isEdit, editData, reset]);

  async function onSubmit(values: FormValues) {
    try {
      const url = isEdit ? `/api/persons/${editData.id}` : "/api/persons";
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success(isEdit ? "Person updated" : "Person created");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Failed to save person");
    }
  }

  const typeValue = watch("type");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0C1220] border-[#8B99B0]/15 text-[#ECF0F7] max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Person" : "Add Person"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2">
              <Label className="text-[#8B99B0] text-xs mb-1 block">Full Name *</Label>
              <Input {...register("full_name")} className="bg-[#1E2840] border-[#8B99B0]/15 text-[#ECF0F7]" />
              {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message}</p>}
            </div>
            <div className="col-span-2">
              <Label className="text-[#8B99B0] text-xs mb-1 block">Email</Label>
              <Input {...register("email")} type="email" className="bg-[#1E2840] border-[#8B99B0]/15 text-[#ECF0F7]" />
            </div>
            <div>
              <Label className="text-[#8B99B0] text-xs mb-1 block">Type *</Label>
              <Select value={typeValue} onValueChange={(v) => setValue("type", v as "candidate" | "employee")}>
                <SelectTrigger className="bg-[#1E2840] border-[#8B99B0]/15 text-[#ECF0F7]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1E2840] border-[#8B99B0]/15">
                  <SelectItem value="candidate">Candidate</SelectItem>
                  <SelectItem value="employee">Employee</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-[#8B99B0] text-xs mb-1 block">Department</Label>
              <Input {...register("department")} className="bg-[#1E2840] border-[#8B99B0]/15 text-[#ECF0F7]" />
            </div>
            <div>
              <Label className="text-[#8B99B0] text-xs mb-1 block">Phone</Label>
              <Input {...register("phone")} className="bg-[#1E2840] border-[#8B99B0]/15 text-[#ECF0F7]" />
            </div>
            <div>
              <Label className="text-[#8B99B0] text-xs mb-1 block">Level</Label>
              <Input {...register("current_level")} placeholder="e.g. Junior, Senior" className="bg-[#1E2840] border-[#8B99B0]/15 text-[#ECF0F7]" />
            </div>
            <div className="col-span-2">
              <Label className="text-[#8B99B0] text-xs mb-1 block">Notes</Label>
              <Textarea {...register("notes")} rows={2} className="bg-[#1E2840] border-[#8B99B0]/15 text-[#ECF0F7] resize-none" />
            </div>
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
