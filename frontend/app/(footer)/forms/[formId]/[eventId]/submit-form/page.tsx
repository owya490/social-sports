"use client";
import FormResponder from "@/components/forms/FormResponder";
import { EventId } from "@/interfaces/EventTypes";
import { FormId } from "@/interfaces/FormTypes";
import { useParams, useRouter } from "next/navigation";

const ViewForm = () => {
  const params = useParams();
  const router = useRouter();
  const formId = params?.formId as FormId;
  const eventId = params?.eventId as EventId;

  return <FormResponder formId={formId} eventId={eventId} formResponseId={null} canEditForm={true} />;
};

export default ViewForm;
