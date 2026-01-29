import DownloadCsvButton from "@/components/DownloadCsvButton";
import { FormSelector } from "@/components/events/create/forms/FormSelector";
import { useUser } from "@/components/utility/UserContext";
import { EventData, EventMetadata } from "@/interfaces/EventTypes";
import { Form, FormId, FormResponse, FormSection, FormSectionType } from "@/interfaces/FormTypes";
import { Logger } from "@/observability/logger";
import { getEventById, updateEventById } from "@/services/src/events/eventsService";
import { getForm, getFormResponsesForEvent } from "@/services/src/forms/formsServices";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AddFormResponseDialog from "./AddFormResponseDialog";
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
  const [isAddFormResponseDialogOpen, setIsAddFormResponseDialogOpen] = useState(false);
  const [organiserEmail, setOrganiserEmail] = useState<string>("");

  // useCallback is required here to prevent infinite loops in the useEffect below
  const fetchResponses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let currentFormId: FormId | null = null;

      const eventData: EventData = await getEventById(eventId);
      if (eventData.organiserId !== user.userId) {
        setError("You are not authorised to view this event");
        router.push("/organiser/dashboard");
        return;
      }
      // Get organiser email from event data, fallback to user's email since user is the organiser
      const email = eventData.organiser?.publicContactInformation?.email || user.contactInformation?.email || "";
      setOrganiserEmail(email);
      if (!email) {
        logger.warn(`Organiser email not found for event ${eventId}, organiserId: ${eventData.organiserId}`);
      }
      if (eventData.formId) {
        currentFormId = eventData.formId as FormId;
        setFormId(eventData.formId);
      } else {
        setFormId(null);
        setForm(null);
        setLoading(false);
        return;
      }

      // Fetch form details to get the title
      const form = await getForm(currentFormId);
      setForm(form);

      const formResponse = await getFormResponsesForEvent(currentFormId, eventId);
      setFormResponses(formResponse);
    } catch (err) {
      logger.error(`Failed to load form responses: ${err}`);
      setError("Failed to load form responses");
    } finally {
      setLoading(false);
    }
  }, [eventId, user.userId, router]);
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
    fetchResponses();
  }, [fetchResponses]);

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

  // Common Header logic
  const renderHeader = () => (
    <div className="flex items-center justify-between mb-4 px-1 md:px-0">
      <div>
        <h1 className="text-2xl font-extrabold mb-1">Form Responses</h1>
        {form && <p className="text-sm text-gray-400 line-clamp-1">Form: {form.title}</p>}
      </div>
      <div className="flex items-center gap-2">
        {formResponses.length > 0 && (
          <DownloadCsvButton data={csvData} headers={csvHeaders} filename={`FormResponses_${eventId}.csv`} />
        )}
        <button
          onClick={() => setIsAddFormResponseDialogOpen(true)}
          aria-label="Add Form Answers"
          className="inline-flex justify-center rounded-md bg-organiser-dark-gray-text px-2 md:px-4 py-1.5 md:py-2 text-sm font-medium text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 hover:cursor-pointer"
        >
          <PlusIcon className="md:mr-2 h-5 w-5" />
          <span className="hidden md:block">Add Form Answers</span>
        </button>
      </div>
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
    const manualSubmissionText = `manual submission for ${organiserEmail}`;
    row.purchaserName = purchaserInfo?.name || manualSubmissionText;
    row.purchaserEmail = purchaserInfo?.email || manualSubmissionText;
    row.submissionTime = formatTimestamp(response.submissionTime);

    return row;
  });

  if (formResponses.length === 0)
    return (
      <div className="w-full md:w-[calc(100%-18rem)] my-2 p-2">
        {renderHeader()}
        <div className="bg-core-hover rounded-lg p-6 mb-6">
          <p className="text-sm text-core-text">No responses submitted</p>
        </div>
        {attachingForm ? (
          <div className="text-sm text-gray-600">Attaching form to event...</div>
        ) : (
          <FormSelector formId={formId} user={user} updateField={handleFormAttachment} />
        )}
        <AddFormResponseDialog
          isOpen={isAddFormResponseDialogOpen}
          onClose={() => setIsAddFormResponseDialogOpen(false)}
          formId={formId}
          eventId={eventId}
          refreshResponses={fetchResponses}
        />
      </div>
    );

  return (
    <div className="w-full md:w-[calc(100%-18rem)] my-2">
      {renderHeader()}

      <FormResponsesTable
        formResponses={formResponses}
        form={form!}
        formId={formId!}
        eventId={eventId}
        eventMetadata={eventMetadata}
        showPurchaserColumn={true}
        organiserEmail={organiserEmail}
      />

      <AddFormResponseDialog
        isOpen={isAddFormResponseDialogOpen}
        onClose={() => setIsAddFormResponseDialogOpen(false)}
        formId={formId}
        eventId={eventId}
        refreshResponses={fetchResponses}
      />
    </div>
  );
};

export default EventDrilldownFormsPage;
