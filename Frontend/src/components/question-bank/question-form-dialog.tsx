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
import { toast } from "sonner";
import type { QuestionRow } from "./question-bank-types";

const schema = z.object({
  question_text: z.string().min(1, "Question text is required"),
  option_a: z.string().min(1, "Required"),
  option_b: z.string().min(1, "Required"),
  option_c: z.string().min(1, "Required"),
  option_d: z.string().min(1, "Required"),
  correct_answer: z.enum(["a", "b", "c", "d"]),
  level: z.enum(["junior", "middle", "senior"]),
  explanation: z.string().optional(),
  points: z.number().int().min(1).max(100),
  time_limit: z.number().int().min(10).max(600),
  topic_tag: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editData?: QuestionRow | null;
  // When set, newly created questions are tagged to this skill (skill-scoped bank).
  skillId?: string;
}

const defaultValues: FormValues = {
  question_text: "",
  option_a: "",
  option_b: "",
  option_c: "",
  option_d: "",
  correct_answer: "a",
  level: "junior",
  explanation: "",
  points: 1,
  time_limit: 60,
  topic_tag: "",
};

export default function QuestionFormDialog({ open, onOpenChange, onSuccess, editData, skillId }: Props) {
  const isEdit = !!editData;
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  useEffect(() => {
    if (open) {
      reset(isEdit ? {
        question_text: editData.question_text,
        option_a: editData.option_a ?? "",
        option_b: editData.option_b ?? "",
        option_c: editData.option_c ?? "",
        option_d: editData.option_d ?? "",
        correct_answer: editData.correct_answer as FormValues["correct_answer"],
        level: editData.level as FormValues["level"],
        explanation: editData.explanation ?? "",
        points: editData.points,
        time_limit: editData.time_limit,
        topic_tag: editData.topic_tag ?? "",
      } : defaultValues);
    }
  }, [open, isEdit, editData, reset]);

  async function onSubmit(values: FormValues) {
    try {
      const url = isEdit ? `/api/question-bank/${editData.id}` : "/api/question-bank";
      const res = await fetch(url, {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit || !skillId ? values : { ...values, skill_id: skillId }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.code === "DUPLICATE") {
          toast.error("A question with identical text already exists");
          return;
        }
        throw new Error(json.error);
      }
      toast.success(isEdit ? "Question updated" : "Question created");
      onOpenChange(false);
      onSuccess();
    } catch {
      toast.error("Failed to save question");
    }
  }

  const fieldCls = "bg-[#1E2840] border-[#8B99B0]/15 text-[#ECF0F7] placeholder:text-[#5A6882]";
  const labelCls = "text-[#8B99B0] text-xs mb-1 block";
  const errCls = "text-red-400 text-xs mt-1";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0C1220] border-[#8B99B0]/15 text-[#ECF0F7] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Question" : "Add Question"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div>
            <Label className={labelCls}>Question *</Label>
            <Textarea {...register("question_text")} rows={3} className={`${fieldCls} resize-none`} placeholder="Enter the question text..." />
            {errors.question_text && <p className={errCls}>{errors.question_text.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            {(["a", "b", "c", "d"] as const).map((letter) => (
              <div key={letter}>
                <Label className={labelCls}>Option {letter.toUpperCase()} *</Label>
                <Input {...register(`option_${letter}`)} className={fieldCls} placeholder={`Option ${letter.toUpperCase()}`} />
                {errors[`option_${letter}`] && <p className={errCls}>{errors[`option_${letter}`]?.message}</p>}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label className={labelCls}>Correct Answer *</Label>
              <select {...register("correct_answer")} className={`w-full h-10 px-3 rounded-md border text-sm ${fieldCls}`}>
                <option value="a">A</option>
                <option value="b">B</option>
                <option value="c">C</option>
                <option value="d">D</option>
              </select>
            </div>
            <div>
              <Label className={labelCls}>Level *</Label>
              <select {...register("level")} className={`w-full h-10 px-3 rounded-md border text-sm ${fieldCls}`}>
                <option value="junior">Junior</option>
                <option value="middle">Middle</option>
                <option value="senior">Senior</option>
              </select>
            </div>
            <div>
              <Label className={labelCls}>Topic Tag</Label>
              <Input {...register("topic_tag")} className={fieldCls} placeholder="e.g. API Design" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className={labelCls}>Points</Label>
              <Input {...register("points", { valueAsNumber: true })} type="number" min={1} max={100} className={fieldCls} />
              {errors.points && <p className={errCls}>{errors.points.message}</p>}
            </div>
            <div>
              <Label className={labelCls}>Time Limit (seconds)</Label>
              <Input {...register("time_limit", { valueAsNumber: true })} type="number" min={10} max={600} className={fieldCls} />
              {errors.time_limit && <p className={errCls}>{errors.time_limit.message}</p>}
            </div>
          </div>

          <div>
            <Label className={labelCls}>Explanation</Label>
            <Textarea {...register("explanation")} rows={2} className={`${fieldCls} resize-none`} placeholder="Optional explanation for the correct answer..." />
          </div>

          <div className="flex gap-2 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-[#8B99B0]/20 text-[#8B99B0] hover:text-[#ECF0F7]">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="bg-[#10B981] hover:bg-[#0D9E6E] text-white border-0">
              {isSubmitting ? "Saving..." : isEdit ? "Save Changes" : "Create Question"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
