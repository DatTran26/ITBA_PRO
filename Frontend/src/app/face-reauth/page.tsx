import { Suspense } from "react";
import FaceReauthClient from "./face-reauth-client";

export default function FaceReauthPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#121A2E]" />}>
      <FaceReauthClient />
    </Suspense>
  );
}
