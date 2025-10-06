"use client";
import FormResponder from "@/components/forms/FormResponder";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import { EventId } from "@/interfaces/EventTypes";
import { FormId, FormResponseId } from "@/interfaces/FormTypes";
import { useParams } from "next/navigation";

const OrganiserViewFormResponse = () => {
  const params = useParams();
  const formId = params?.formId as FormId;
  const eventId = params?.eventId as EventId;
  const responseId = params?.responseId as FormResponseId;

  return (
    <div className="bg-core-hover h-screen overflow-hidden">
      <div className="mt-8 sm:mt-14">
        <OrganiserNavbar />
      </div>
      <div className="pt-10 pb-24 sm:pb-20 h-full overflow-y-auto">
        <FormResponder formId={formId} eventId={eventId} formResponseId={responseId} />
      </div>
    </div>
  );
};

export default OrganiserViewFormResponse;
