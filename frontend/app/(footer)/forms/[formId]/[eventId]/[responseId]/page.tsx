"use client";
import FormResponder from "@/components/forms/FormResponder";
import { EventId } from "@/interfaces/EventTypes";
import { FormId, FormResponseId } from "@/interfaces/FormTypes";
import { useParams } from "next/navigation";

const ViewFormResponse = () => {
  const params = useParams();
  const formId = params?.formId as FormId;
  const eventId = params?.eventId as EventId;
  const responseId = params?.responseId as FormResponseId;

  return (
    <div className="py-20 bg-core-hover h-screen overflow-auto">
      <FormResponder formId={formId} eventId={eventId} formResponseId={responseId} />
    </div>
  );
};

export default ViewFormResponse;
