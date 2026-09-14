import { redirect } from "next/navigation";
import { getAuthContext, isAuthError } from "@/lib/api/auth-helpers";
import ModelControllerClient from "./model-controller-client";

export const metadata = {
  title: "Cấu hình Model AI | DownTown",
  description: "Trang điều khiển và tinh chỉnh thông số mô hình Vision AI",
};

export default async function ModelControllerPage() {
  const ctx = await getAuthContext();
  if (isAuthError(ctx)) redirect("/login");
  if (!ctx.isSuperAdmin) redirect("/dashboard");

  return <ModelControllerClient />;
}
