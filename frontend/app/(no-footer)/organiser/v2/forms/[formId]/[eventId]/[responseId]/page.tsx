"use client";

import { FormResponseViewer } from "@/components/organiser/v2/forms/FormResponseViewer";
import { EventId } from "@/interfaces/EventTypes";
import { FormId, FormResponseId } from "@/interfaces/FormTypes";
import { useParams } from "next/navigation";

export default function OrganiserV2FormResponsePage() {
  const params = useParams<{ formId: string; eventId: string; responseId: string }>();
  const formId = params.formId as FormId;
  const eventId = params.eventId as EventId;
  const responseId = params.responseId as FormResponseId;

  return <FormResponseViewer formId={formId} eventId={eventId} responseId={responseId} />;
}
