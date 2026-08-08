"use client";
import FormResponder from "@/components/forms/FormResponder";
import { EventId } from "@/interfaces/EventTypes";
import { FormId } from "@/interfaces/FormTypes";
import { useParams } from "next/navigation";

const ViewForm = () => {
  const params = useParams<{ formId: string; eventId: string }>();
  const formId = params.formId as FormId;
  const eventId = params.eventId as EventId;
  return <FormResponder formId={formId} eventId={eventId} formResponseId={null} canEditForm={true} variant="compact" />;
};

export default ViewForm;
