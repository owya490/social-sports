import FormResponder from "@/components/forms/FormResponder";
import { useParams, useRouter } from "next/navigation";

const ViewFormResponse = () => {
  const router = useRouter();
  const params = useParams();
  const formId = params?.formId as string;
  const eventId = params?.eventId as string;
  const responseId = params?.responseId as string;

  return <FormResponder formId={formId} eventId={eventId} formResponseId={responseId} />;
};

export default ViewFormResponse;