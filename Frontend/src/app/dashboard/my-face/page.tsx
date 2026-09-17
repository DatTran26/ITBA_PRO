import { redirect } from "next/navigation";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import MyFaceClient from "./my-face-client";

export default async function MyFacePage() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) redirect("/login");
  return <MyFaceClient />;
}
