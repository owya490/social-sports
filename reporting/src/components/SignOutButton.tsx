"use client";

import { getClientAuth } from "@/lib/firebaseClient";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignOutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function onClick() {
    setPending(true);
    try {
      await fetch("/api/session", { method: "DELETE" });
      await signOut(getClientAuth());
    } catch {
      // The cookie clear is what ends access. Firebase client state is best-effort.
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium disabled:opacity-60"
    >
      {pending ? "Signing out" : "Sign out"}
    </button>
  );
}
