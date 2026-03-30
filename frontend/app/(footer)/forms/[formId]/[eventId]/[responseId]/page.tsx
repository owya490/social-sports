"use client";

import FormResponder from "@/components/forms/FormResponder";
import { EventId } from "@/interfaces/EventTypes";
import { FormId, FormResponseId } from "@/interfaces/FormTypes";
import { useParams } from "next/navigation";

function paramString(v: string | string[] | undefined): string {
  if (typeof v === "string") return v;
  if (Array.isArray(v) && v[0]) return v[0];
  return "";
}

/**
 * Public read-only view of a submitted response (same model as organiser form preview,
 * but with real event + response — not under /organiser).
 */
export default function PublicFormResponsePreviewPage() {
  const params = useParams();
  const formId = paramString(params?.formId) as FormId;
  const eventId = paramString(params?.eventId) as EventId;
  const responseId = paramString(params?.responseId) as FormResponseId;

  return (
    <div className="min-h-[calc(100vh-var(--footer-height))] overflow-hidden bg-core-hover">
      <div className="h-full max-h-[calc(100vh-var(--footer-height))] overflow-y-auto pt-10 pb-24 sm:pb-20">
        <FormResponder formId={formId} eventId={eventId} formResponseId={responseId} />
      </div>
    </div>
  );
}
