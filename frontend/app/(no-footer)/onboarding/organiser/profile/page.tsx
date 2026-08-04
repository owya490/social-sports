"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Legacy URL — organiser onboarding lives at `/onboarding/organiser` (no global footer). */
export default function OrganiserOnboardingProfileRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/onboarding/organiser");
  }, [router]);
  return (
    <div
      className="fixed inset-x-0 top-[var(--navbar-height)] bottom-0 flex items-center justify-center bg-white"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <p className="text-gray-600">Loading…</p>
    </div>
  );
}
