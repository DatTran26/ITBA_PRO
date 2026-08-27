"use client";

import QuestionBankAiPipelineTab from "@/app/dashboard/question-bank/question-bank-ai-pipeline-tab";

interface Props {
  skillId: string;
  onApproved: () => void;
}

// Skill "Knowledge" tab: reuses the global QB AI pipeline scoped to this skill.
// Uploaded documents + generated questions are tagged with skill_id.
export default function SkillKnowledgeTab({ skillId, onApproved }: Props) {
  return <QuestionBankAiPipelineTab context={{ scope: "skill", skillId }} onApproved={onApproved} />;
}
