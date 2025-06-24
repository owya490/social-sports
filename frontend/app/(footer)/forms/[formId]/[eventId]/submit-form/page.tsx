"use client";
import FormResponder from "@/components/forms/FormResponder";
import { useParams, useRouter } from "next/navigation";

const ViewForm = () => {
  const params = useParams();
  const router = useRouter();
  const formId = params?.formId as string;
  const eventId = params?.eventId as string;

  return <FormResponder formId={formId} eventId={eventId} formResponseId={null} />;
};

export default ViewForm;
