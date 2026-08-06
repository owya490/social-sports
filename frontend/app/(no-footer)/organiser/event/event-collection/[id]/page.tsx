"use client";

import { EventCollectionId } from "@/interfaces/EventCollectionTypes";
import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

/**
 * Legacy organiser collection detail → v2 collection hub.
 */
export default function LegacyCollectionPageRedirect() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const collectionId = params.id as EventCollectionId;

  useEffect(() => {
    router.replace(`/organiser/v2/event/event-collection/${collectionId}`);
  }, [collectionId, router]);

  return (
    <div className="min-h-screen bg-surface text-foreground flex items-center justify-center px-4">
      <p className="text-sm text-foreground-muted font-sans">Opening collection…</p>
    </div>
  );
}
