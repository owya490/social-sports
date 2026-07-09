"use client";

import DownloadCsvButton from "@/components/DownloadCsvButton";
import { FormSelector } from "@/components/events/create/forms/FormSelector";
import { useUser } from "@/components/utility/UserContext";
import { EventData } from "@/interfaces/EventTypes";
import { EventId } from "@/interfaces/EventTypes";
import { EventTicketTypeId } from "@/interfaces/EventTicketTypeTypes";
import { Form, FormId, FormResponse, FormSection, FormSectionType } from "@/interfaces/FormTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { Logger } from "@/observability/logger";
import { getEventById, updateEventById } from "@/services/src/events/eventsService";
import {
  getSortedEventTicketTypes,
  hasEventTicketTypes,
} from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import { getForm, getFormResponsesForEvent } from "@/services/src/forms/formsServices";
import {
  filterFormResponsesForApprovedOrders,
  filterFormResponsesForTicketType,
  getApprovedOrderTicketsMap,
  getFormSectionAnswerDisplay,
} from "@/services/src/forms/formsUtils/formsUtils";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AddFormResponseDialog from "./AddFormResponseDialog";
import { FormResponsesTable } from "./FormResponsesTable";

interface EventDrilldownFormsPageProps {
  eventId: EventId;
  orderTicketsMap: Map<Order, Ticket[]>;
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

const createFormResponseMap = (orderTicketsMap: Map<Order, Ticket[]>): Map<string, PurchaserInfo> => {
  const formResponseToPurchaser = new Map<string, PurchaserInfo>();

  orderTicketsMap.forEach((tickets, order) => {
    tickets.forEach((ticket) => {
      if (ticket.formResponseId) {
        formResponseToPurchaser.set(ticket.formResponseId, {
          name: order.fullName,
          email: order.email,
        });
      }
    });
  });

  return formResponseToPurchaser;
};

export const EventDrilldownFormsPage = ({ eventId, orderTicketsMap }: EventDrilldownFormsPageProps) => {
  const logger = new Logger("EventDrilldownFormsPageLogger");
  const { user, userLoading } = useUser();
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<EventTicketTypeId | null>(null);
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const unfilteredFormResponsesRef = useRef<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formId, setFormId] = useState<FormId | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [attachingForm, setAttachingForm] = useState(false);
  const router = useRouter();
  const [isAddFormResponseDialogOpen, setIsAddFormResponseDialogOpen] = useState(false);
  const [organiserEmail, setOrganiserEmail] = useState<string>("");
  const approvedOrderTicketsMap = useMemo(() => getApprovedOrderTicketsMap(orderTicketsMap), [orderTicketsMap]);
  const usesTicketTypes = hasEventTicketTypes(eventData ?? {});
  const sortedTicketTypes = useMemo(
    () => getSortedEventTicketTypes(eventData?.eventTicketTypes),
    [eventData?.eventTicketTypes]
  );
  const selectedTicketType = sortedTicketTypes.find((t) => t.eventTicketTypeId === selectedTypeId);

  const applyResponseFilter = useCallback(
    (responses: FormResponse[]) => {
      if (usesTicketTypes && selectedTypeId) {
        return filterFormResponsesForTicketType(responses, orderTicketsMap, selectedTypeId);
      }
      return filterFormResponsesForApprovedOrders(responses, orderTicketsMap);
    },
    [usesTicketTypes, selectedTypeId, orderTicketsMap]
  );

  useEffect(() => {
    setFormResponses(applyResponseFilter(unfilteredFormResponsesRef.current));
  }, [applyResponseFilter]);

  const fetchEventAndLegacyForm = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const loadedEventData: EventData = await getEventById(eventId);
      setEventData(loadedEventData);

      if (userLoading || !user.userId) {
        return;
      }
      const email =
        loadedEventData.organiser?.publicContactInformation?.email || user.contactInformation?.email || "";
      setOrganiserEmail(email);

      if (loadedEventData.organiserId !== user.userId) {
        setError("You are not authorised to view this event");
        router.push("/organiser/dashboard");
        return;
      }

      if (hasEventTicketTypes(loadedEventData)) {
        const types = getSortedEventTicketTypes(loadedEventData.eventTicketTypes);
        if (!selectedTypeId && types[0]) {
          setSelectedTypeId(types[0].eventTicketTypeId);
        }
        setLoading(false);
        return;
      }

      const currentFormId = loadedEventData.formId as FormId | null;
      setFormId(currentFormId);

      if (!currentFormId) {
        setForm(null);
        unfilteredFormResponsesRef.current = [];
        setFormResponses([]);
        setLoading(false);
        return;
      }

      const loadedForm = await getForm(currentFormId);
      setForm(loadedForm);
      const fetchedFormResponses = await getFormResponsesForEvent(currentFormId, eventId);
      unfilteredFormResponsesRef.current = fetchedFormResponses;
      setFormResponses(filterFormResponsesForApprovedOrders(fetchedFormResponses, orderTicketsMap));
    } catch (err) {
      logger.error(`Failed to load form responses: ${err}`);
      setError("Failed to load form responses");
    } finally {
      setLoading(false);
    }
  }, [eventId, orderTicketsMap, user.userId, userLoading, router, selectedTypeId, logger]);

  useEffect(() => {
    void fetchEventAndLegacyForm();
  }, [fetchEventAndLegacyForm]);

  useEffect(() => {
    if (!usesTicketTypes || !selectedTypeId) return;
    const typeFormId = selectedTicketType?.eventTicketType.formId;
    setFormId(typeFormId ?? null);

    if (!typeFormId) {
      setForm(null);
      unfilteredFormResponsesRef.current = [];
      setFormResponses([]);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const loadedForm = await getForm(typeFormId);
        if (cancelled) return;
        setForm(loadedForm);
        const fetched = await getFormResponsesForEvent(typeFormId, eventId);
        if (cancelled) return;
        unfilteredFormResponsesRef.current = fetched;
        setFormResponses(filterFormResponsesForTicketType(fetched, orderTicketsMap, selectedTypeId));
      } catch (err) {
        if (!cancelled) {
          logger.error(`Failed to load type form responses: ${err}`);
          setError("Failed to load form responses");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [usesTicketTypes, selectedTypeId, selectedTicketType?.eventTicketType.formId, eventId, orderTicketsMap, logger]);

  const fetchResponses = useCallback(async () => {
    if (usesTicketTypes && selectedTypeId && selectedTicketType?.eventTicketType.formId) {
      const fetched = await getFormResponsesForEvent(selectedTicketType.eventTicketType.formId, eventId);
      unfilteredFormResponsesRef.current = fetched;
      setFormResponses(filterFormResponsesForTicketType(fetched, orderTicketsMap, selectedTypeId));
      return;
    }
    await fetchEventAndLegacyForm();
  }, [
    usesTicketTypes,
    selectedTypeId,
    selectedTicketType,
    eventId,
    orderTicketsMap,
    fetchEventAndLegacyForm,
  ]);

  const handleFormAttachment = async (selectedFormId: FormId | null) => {
    if (usesTicketTypes) {
      return;
    }
    try {
      setAttachingForm(true);
      setError(null);

      await updateEventById(eventId, { formId: selectedFormId });

      if (!selectedFormId) {
        setFormId(null);
        setForm(null);
        unfilteredFormResponsesRef.current = [];
        setFormResponses([]);
        return;
      }

      setFormId(selectedFormId);
      const loadedForm = await getForm(selectedFormId);
      setForm(loadedForm);

      const fetchedFormResponses = await getFormResponsesForEvent(selectedFormId, eventId);
      unfilteredFormResponsesRef.current = fetchedFormResponses;
      setFormResponses(filterFormResponsesForApprovedOrders(fetchedFormResponses, orderTicketsMap));
    } catch (err) {
      logger.error(`Failed to ${selectedFormId ? "attach" : "detach"} form: ${err}`);
      setError(`Failed to ${selectedFormId ? "attach" : "detach"} form`);
    } finally {
      setAttachingForm(false);
    }
  };

  const handleTypeTabChange = (typeId: EventTicketTypeId) => {
    setSelectedTypeId(typeId);
  };

  if (loading) return <div>Loading form responses...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  const renderTypeTabs = () =>
    usesTicketTypes && sortedTicketTypes.length > 0 ? (
      <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-2">
        {sortedTicketTypes.map(({ eventTicketTypeId, eventTicketType }) => (
          <button
            key={eventTicketTypeId}
            type="button"
            onClick={() => handleTypeTabChange(eventTicketTypeId)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              selectedTypeId === eventTicketTypeId
                ? "bg-core-text text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {eventTicketType.name}
            {!eventTicketType.isActive && " (Inactive)"}
          </button>
        ))}
      </div>
    ) : null;

  if (!formId) {
    return (
      <div className="w-full md:w-[calc(100%-18rem)] my-2 p-2">
        <h1 className="text-2xl font-extrabold mb-6">Form Responses</h1>
        {renderTypeTabs()}
        <div className="bg-core-hover rounded-lg p-6 mb-6">
          <p className="text-sm text-core-text">
            {usesTicketTypes
              ? selectedTicketType
                ? `No registration form is attached to the "${selectedTicketType.eventTicketType.name}" ticket type. Attach a form in Settings → Ticket Types.`
                : "Select a ticket type to view form responses."
              : "No registration form is currently attached to this event. Select a form below to start collecting participant registrations."}
          </p>
        </div>
        {!usesTicketTypes &&
          (attachingForm ? (
            <div className="text-sm text-gray-600">Attaching form to event...</div>
          ) : (
            <FormSelector formId={formId} user={user} updateField={handleFormAttachment} />
          ))}
      </div>
    );
  }

  const renderHeader = () => (
    <div className="flex items-center justify-between mb-4 px-1 md:px-0">
      <div>
        <h1 className="text-2xl font-extrabold mb-1">Form Responses</h1>
        {form && <p className="text-sm text-gray-400 line-clamp-1">Form: {form.title}</p>}
        {usesTicketTypes && selectedTicketType && (
          <p className="text-sm text-gray-500">Ticket type: {selectedTicketType.eventTicketType.name}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        {formResponses.length > 0 && (
          <DownloadCsvButton
            data={csvData}
            headers={csvHeaders}
            filename={`FormResponses_${eventId}${selectedTypeId ? `_${selectedTypeId}` : ""}.csv`}
          />
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

  const formResponseToPurchaser = createFormResponseMap(approvedOrderTicketsMap);
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
      row[questionId] = section ? getFormSectionAnswerDisplay(section) : "—";
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
        {renderTypeTabs()}
        {renderHeader()}
        <div className="bg-core-hover rounded-lg p-6 mb-6">
          <p className="text-sm text-core-text">No responses submitted for this ticket type</p>
        </div>
        {!usesTicketTypes &&
          (attachingForm ? (
            <div className="text-sm text-gray-600">Attaching form to event...</div>
          ) : (
            <FormSelector formId={formId} user={user} updateField={handleFormAttachment} />
          ))}
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
      {renderTypeTabs()}
      {renderHeader()}

      <FormResponsesTable
        formResponses={formResponses}
        form={form!}
        formId={formId!}
        eventId={eventId}
        orderTicketsMap={approvedOrderTicketsMap}
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
