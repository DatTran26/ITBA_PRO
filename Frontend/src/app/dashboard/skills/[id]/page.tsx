import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import SkillDetailClient from "./skill-detail-client";
import type { SkillDetail } from "@/app/dashboard/management-types";

export default async function SkillDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: userData } = await supabase
    .from("users")
    .select("role")
    .eq("auth_id", user.id)
    .single();

  const isAdmin = userData?.role === "admin" || userData?.role === "super_admin";
  const canEdit = isAdmin || userData?.role === "leader";

  const [skillRes, posReqRes, personSkillRes] = await Promise.all([
    supabase
      .from("skills")
      .select("id, name, category, description, created_at")
      .eq("id", id)
      .single(),
    supabase
      .from("position_skill_requirements")
      .select("position_id, required_level, is_mandatory, positions(id, title, department)")
      .eq("skill_id", id),
    supabase
      .from("person_skills")
      .select("person_id, current_level, persons(id, full_name)")
      .eq("skill_id", id),
  ]);

  if (!skillRes.data) notFound();

  const position_requirements = (posReqRes.data ?? []).map((r) => {
    const pos = Array.isArray(r.positions) ? r.positions[0] : r.positions;
    return {
      position_id: r.position_id,
      position_title: (pos as { title: string } | null)?.title ?? "Unknown",
      department: (pos as { department: string | null } | null)?.department ?? null,
      required_level: r.required_level,
      is_mandatory: r.is_mandatory,
    };
  });

  const person_skills = (personSkillRes.data ?? []).map((r) => {
    const person = Array.isArray(r.persons) ? r.persons[0] : r.persons;
    return {
      person_id: r.person_id,
      person_name: (person as { full_name: string } | null)?.full_name ?? "Unknown",
      current_level: r.current_level,
    };
  });

  const skill: SkillDetail = {
    ...skillRes.data,
    position_requirements,
    person_skills,
  };

  return <SkillDetailClient skill={skill} isAdmin={isAdmin} canEdit={canEdit} />;
}
