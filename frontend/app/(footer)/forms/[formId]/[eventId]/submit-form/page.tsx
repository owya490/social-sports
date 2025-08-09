"use client";
import FormResponder from "@/components/forms/FormResponder";
import { EventId } from "@/interfaces/EventTypes";
import { FormId } from "@/interfaces/FormTypes";

const ViewForm = ({ params }: { params: { formId: FormId; eventId: EventId } }) => {
  const { formId, eventId } = params;
  return <FormResponder formId={formId} eventId={eventId} formResponseId={null} canEditForm={true} />;
};

export default ViewForm;
