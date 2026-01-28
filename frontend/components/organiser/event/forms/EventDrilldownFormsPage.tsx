import DownloadCsvButton from "@/components/DownloadCsvButton";
import { FormSelector } from "@/components/events/create/forms/FormSelector";
import { useUser } from "@/components/utility/UserContext";
import { EmptyEventData, EventData, EventMetadata } from "@/interfaces/EventTypes";
import { Form, FormId, FormResponse, FormSection, FormSectionType } from "@/interfaces/FormTypes";
import { Logger } from "@/observability/logger";
import { getEventById, updateEventById } from "@/services/src/events/eventsService";
import { getForm, getFormResponsesForEvent } from "@/services/src/forms/formsServices";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormResponsesTable } from "./FormResponsesTable";

interface EventDrilldownFormsPageProps {
  eventId: string;
  eventMetadata: EventMetadata;
}

const formatTimestamp = (ts: Timestamp | null): string => {
  if (!ts) return "—";
  const date = ts.toDate();
  return date.toLocaleString();
};

interface PurchaserInfo {
  name: string;
  email: string;
}

const createFormResponseToPurchaserMap = (eventMetadata: EventMetadata): Map<string, PurchaserInfo> => {
  const formResponseToPurchaser = new Map<string, PurchaserInfo>();

  if (!eventMetadata.purchaserMap) return formResponseToPurchaser;

  Object.values(eventMetadata.purchaserMap).forEach((purchaser) => {
    const email = purchaser.email || "";
    if (purchaser.attendees) {
      Object.entries(purchaser.attendees).forEach(([name, attendeeData]) => {
        const formResponseIds = attendeeData.formResponseIds || [];
        formResponseIds.forEach((formResponseId: string) => {
          formResponseToPurchaser.set(formResponseId, { name, email });
        });
      });
    }
  });

  return formResponseToPurchaser;
};

const getAnswerDisplay = (section: FormSection | undefined): string => {
  if (!section) return "—";

  switch (section.type) {
    case FormSectionType.TEXT:
    case FormSectionType.DROPDOWN_SELECT:
    case FormSectionType.MULTIPLE_CHOICE:
      return section.answer || "—";
    case FormSectionType.TICKBOX:
      return section.answer?.join(", ") || "—";
    case FormSectionType.DATE_TIME:
      if (!section.timestamp) return "—";
      try {
        return new Date(section.timestamp).toLocaleString();
      } catch {
        return section.timestamp;
      }
    case FormSectionType.FILE_UPLOAD:
      return section.fileUrl || "—";
    default:
      return "—";
  }
};

const EventDrilldownFormsPage = ({ eventId, eventMetadata }: EventDrilldownFormsPageProps) => {
  const logger = new Logger("EventDrilldownFormsPageLogger");
  const { user } = useUser();
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formId, setFormId] = useState<FormId | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [attachingForm, setAttachingForm] = useState(false);
  const router = useRouter();
  const handleFormAttachment = async (selectedFormId: FormId | null) => {
    try {
      setAttachingForm(true);
      setError(null);

      // Update the event with the selected formId (or null to detach)
      await updateEventById(eventId, { formId: selectedFormId });

      if (!selectedFormId) {
        // Detach form: clear local state
        setFormId(null);
        setForm(null);
        setFormResponses([]);
        return;
      }

      // Attach form: update local state and fetch responses
      setFormId(selectedFormId);

      // Fetch form details to get the title
      const form = await getForm(selectedFormId);
      setForm(form);

      // Fetch responses for the newly attached form
      const formResponse = await getFormResponsesForEvent(selectedFormId, eventId);
      setFormResponses(formResponse);
    } catch (err) {
      logger.error(`Failed to ${selectedFormId ? "attach" : "detach"} form: ${err}`);
      setError(`Failed to ${selectedFormId ? "attach" : "detach"} form`);
    } finally {
      setAttachingForm(false);
    }
  };

  useEffect(() => {
    const fetchResponses = async () => {
      try {
        setLoading(true);
        setError(null);

        let formId: FormId | null = null;

        const eventData: EventData = await getEventById(eventId);
        if (eventData.organiserId !== user.userId) {
          setError("You are not authorised to view this event");
          router.push("/organiser/dashboard");
          return EmptyEventData;
        }
        if (eventData.formId) {
          formId = eventData.formId as FormId;
          setFormId(eventData.formId);
          setLoading(false);
        }

        if (!formId) {
          // No formId found - this is okay, we'll show the FormSelector
          setFormId(null);
          setForm(null);
          setLoading(false);
          return;
        }

        // Fetch form details to get the title
        const form = await getForm(formId);
        setForm(form);
        const formResponse = await getFormResponsesForEvent(formId as FormId, eventId);
        setFormResponses(formResponse);
      } catch (err) {
        logger.error(`Failed to load form responses: ${err}`);
        setError("Failed to load form responses");
      } finally {
        setLoading(false);
      }
    };

    fetchResponses();
  }, [eventId]);

  if (loading) return <div>Loading form responses...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  // If no form is attached to the event, show the FormSelector
  if (!formId) {
    return (
      <div className="w-full md:w-[calc(100%-18rem)] my-2 p-2">
        <h1 className="text-2xl font-extrabold mb-6">Form Responses</h1>
        <div className="bg-core-hover rounded-lg p-6 mb-6">
          <p className="text-sm text-core-text">
            No registration form is currently attached to this event. Select a form below to start collecting
            participant registrations.
          </p>
        </div>
        {attachingForm ? (
          <div className="text-sm text-gray-600">Attaching form to event...</div>
        ) : (
          <FormSelector formId={formId} user={user} updateField={handleFormAttachment} />
        )}
      </div>
    );
  }

  if (formResponses.length === 0)
    return (
      <div className="w-full md:w-[calc(100%-18rem)] my-2 p-2">
        <h1 className="text-2xl font-extrabold mb-2">Form Responses</h1>
        {form && <p className="text-sm text-gray-400 mb-6 line-clamp-1">Form: {form.title}</p>}
        <div className="bg-core-hover rounded-lg p-6 mb-6">
          <p className="text-sm text-core-text">No responses submitted</p>
        </div>
        {attachingForm ? (
          <div className="text-sm text-gray-600">Attaching form to event...</div>
        ) : (
          <FormSelector formId={formId} user={user} updateField={handleFormAttachment} />
        )}
      </div>
    );

  // Generate CSV data for download
  const formResponseToPurchaser = createFormResponseToPurchaserMap(eventMetadata);
  const sortedFormResponses = [...formResponses].sort((a, b) => {
    const purchaserA = formResponseToPurchaser.get(a.formResponseId);
    const purchaserB = formResponseToPurchaser.get(b.formResponseId);
    if (!purchaserA && !purchaserB) return 0;
    if (!purchaserA) return 1;
    if (!purchaserB) return -1;
    const emailCompare = purchaserA.email.localeCompare(purchaserB.email);
    if (emailCompare !== 0) return emailCompare;
    return purchaserA.name.localeCompare(purchaserB.name);
  });

  // Collect all unique questions for CSV
  const allQuestionIdentifiers = new Set<string>();
  sortedFormResponses.forEach((response) => {
    const questionCounts = new Map<string, number>();
    Object.entries(response.responseMap).forEach(([_, section]) => {
      if (section.type !== FormSectionType.IMAGE) {
        const question = section.question.trim();
        const count = questionCounts.get(question) || 0;
        questionCounts.set(question, count + 1);
        const uniqueIdentifier = count === 0 ? question : `${question} ${count + 1}`;
        allQuestionIdentifiers.add(uniqueIdentifier);
      }
    });
  });

  const sortedQuestions = Array.from(allQuestionIdentifiers).sort((a, b) => a.localeCompare(b));

  const csvHeaders = [
    { label: "#", key: "index" },
    { label: "Purchaser Name", key: "purchaserName" },
    { label: "Purchaser Email", key: "purchaserEmail" },
    ...sortedQuestions.map((question) => ({ label: question, key: question })),
    { label: "Submission Time", key: "submissionTime" },
  ];

  const csvData = sortedFormResponses.map((response, idx) => {
    const row: Record<string, string> = { index: (idx + 1).toString() };
    const questionCounts = new Map<string, number>();
    const questionMapping = new Map<string, FormSection>();

    Object.entries(response.responseMap).forEach(([_, section]) => {
      if (section.type !== FormSectionType.IMAGE) {
        const question = section.question.trim();
        const count = questionCounts.get(question) || 0;
        questionCounts.set(question, count + 1);
        const uniqueIdentifier = count === 0 ? question : `${question} ${count + 1}`;
        questionMapping.set(uniqueIdentifier, section);
      }
    });

    sortedQuestions.forEach((questionId) => {
      const section = questionMapping.get(questionId);
      row[questionId] = section ? getAnswerDisplay(section) : "—";
    });

    const purchaserInfo = formResponseToPurchaser.get(response.formResponseId);
    row.purchaserName = purchaserInfo?.name || "—";
    row.purchaserEmail = purchaserInfo?.email || "—";
    row.submissionTime = formatTimestamp(response.submissionTime);

    return row;
  });

  return (
    <div className="w-full md:w-[calc(100%-18rem)] my-2">
      <div className="flex items-center justify-between mb-4 px-1 md:px-0">
        <div>
          <h1 className="text-2xl font-extrabold mb-1">Form Responses</h1>
          {form && <p className="text-sm text-gray-400 line-clamp-1">Form: {form.title}</p>}
        </div>
        <DownloadCsvButton data={csvData} headers={csvHeaders} filename={`FormResponses_${eventId}.csv`} />
      </div>

      <FormResponsesTable
        formResponses={formResponses}
        form={form!}
        formId={formId!}
        eventId={eventId}
        eventMetadata={eventMetadata}
        showPurchaserColumn={true}
      />
    </div>
  );
};

export default EventDrilldownFormsPage;
