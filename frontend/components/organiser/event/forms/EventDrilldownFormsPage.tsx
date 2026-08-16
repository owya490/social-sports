"use client";

import DownloadCsvButton from "@/components/DownloadCsvButton";
import { FormSelector } from "@/components/events/create/forms/FormSelector";
import { useUser } from "@/components/utility/UserContext";
import { EventTicketTypeId } from "@/interfaces/EventTicketTypeTypes";
import { EventData, EventId } from "@/interfaces/EventTypes";
import { Form, FormId, FormResponse, FormSection, FormSectionType } from "@/interfaces/FormTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { Logger } from "@/observability/logger";
import { getEventById, updateEventById } from "@/services/src/events/eventsService";
import {
  getSortedEventTicketTypes,
  hasEventTicketTypes,
  GENERAL_TICKET_TYPE_NAME,
  resolveFormIdForTicketType,
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
  const logger = useMemo(() => new Logger("EventDrilldownFormsPageLogger"), []);
  const { user, userLoading } = useUser();
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<EventTicketTypeId | null>(null);
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const unfilteredFormResponsesRef = useRef<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formId, setFormId] = useState<FormId | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [attachingForm, setAttachingForm] = useState(false);
  const router = useRouter();
  const [isAddFormResponseDialogOpen, setIsAddFormResponseDialogOpen] = useState(false);
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
        return filterFormResponsesForTicketType(
          responses,
          orderTicketsMap,
          selectedTypeId,
          selectedTicketType?.eventTicketType.name
        );
      }
      return filterFormResponsesForApprovedOrders(responses, orderTicketsMap);
    },
    [usesTicketTypes, selectedTypeId, selectedTicketType, orderTicketsMap]
  );

  useEffect(() => {
    setFormResponses(applyResponseFilter(unfilteredFormResponsesRef.current));
  }, [applyResponseFilter]);

  const loadFormAndResponses = useCallback(
    async (
      resolvedFormId: FormId | null,
      typeIdForFilter: EventTicketTypeId | null,
      typeNameForFilter?: string | null
    ) => {
      setFormId(resolvedFormId);
      if (!resolvedFormId) {
        setForm(null);
        unfilteredFormResponsesRef.current = [];
        setFormResponses([]);
        return;
      }

      const loadedForm = await getForm(resolvedFormId);
      setForm(loadedForm);
      const fetched = await getFormResponsesForEvent(resolvedFormId, eventId);
      unfilteredFormResponsesRef.current = fetched;
      if (typeIdForFilter) {
        setFormResponses(
          filterFormResponsesForTicketType(fetched, orderTicketsMap, typeIdForFilter, typeNameForFilter)
        );
      } else {
        setFormResponses(filterFormResponsesForApprovedOrders(fetched, orderTicketsMap));
      }
    },
    [eventId, orderTicketsMap]
  );

  const fetchEvent = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const loadedEventData: EventData = await getEventById(eventId);
      setEventData(loadedEventData);

      if (userLoading || !user.userId) {
        return;
      }

      if (loadedEventData.organiserId !== user.userId) {
        setError("You are not authorised to view this event");
        router.push("/organiser/v2/dashboard");
        return;
      }

      if (hasEventTicketTypes(loadedEventData)) {
        const types = getSortedEventTicketTypes(loadedEventData.eventTicketTypes);
        setFormLoading(true);
        setSelectedTypeId((prev) => prev ?? types[0]?.eventTicketTypeId ?? null);
        return;
      }

      await loadFormAndResponses((loadedEventData.formId as FormId | null) ?? null, null);
    } catch (err) {
      logger.error(`Failed to load form responses: ${err}`);
      setError("Failed to load form responses");
    } finally {
      setLoading(false);
    }
  }, [eventId, user.userId, userLoading, router, loadFormAndResponses, logger]);

  useEffect(() => {
    void fetchEvent();
  }, [fetchEvent]);

  useEffect(() => {
    if (!eventData || !usesTicketTypes || !selectedTypeId) return;

    let cancelled = false;
    setFormLoading(true);
    void (async () => {
      try {
        const resolvedFormId = resolveFormIdForTicketType(eventData, selectedTypeId);
        if (cancelled) return;
        await loadFormAndResponses(
          resolvedFormId,
          selectedTypeId,
          selectedTicketType?.eventTicketType.name
        );
      } catch (err) {
        if (!cancelled) {
          logger.error(`Failed to load type form responses: ${err}`);
          setError("Failed to load form responses");
        }
      } finally {
        if (!cancelled) setFormLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [eventData, usesTicketTypes, selectedTypeId, selectedTicketType, loadFormAndResponses, logger]);

  const fetchResponses = useCallback(async () => {
    if (!eventData) {
      await fetchEvent();
      return;
    }

    try {
      if (usesTicketTypes && selectedTypeId) {
        const resolvedFormId = resolveFormIdForTicketType(eventData, selectedTypeId);
        await loadFormAndResponses(
          resolvedFormId,
          selectedTypeId,
          selectedTicketType?.eventTicketType.name
        );
        return;
      }
      await loadFormAndResponses((eventData.formId as FormId | null) ?? null, null);
    } catch (err) {
      logger.error(`Failed to refresh form responses: ${err}`);
      setError("Failed to load form responses");
    }
  }, [
    eventData,
    usesTicketTypes,
    selectedTypeId,
    selectedTicketType,
    loadFormAndResponses,
    fetchEvent,
    logger,
  ]);

  const handleFormAttachment = async (selectedFormId: FormId | null) => {
    try {
      setAttachingForm(true);
      setError(null);

      if (usesTicketTypes && selectedTypeId && eventData?.eventTicketTypes) {
        const types = eventData.eventTicketTypes;
        const existing = types[selectedTypeId];
        if (!existing) {
          throw new Error("Selected ticket type not found");
        }

        const nextTypes = {
          ...types,
          [selectedTypeId]: { ...existing, formId: selectedFormId },
        };
        const syncEventFormId = existing.name === GENERAL_TICKET_TYPE_NAME;
        await updateEventById(eventId, {
          eventTicketTypes: nextTypes,
          ...(syncEventFormId ? { formId: selectedFormId } : {}),
        });

        const nextEventData: EventData = {
          ...eventData,
          eventTicketTypes: nextTypes,
          ...(syncEventFormId ? { formId: selectedFormId } : {}),
        };
        setEventData(nextEventData);
        await loadFormAndResponses(
          resolveFormIdForTicketType(nextEventData, selectedTypeId),
          selectedTypeId,
          existing.name
        );
        return;
      }

      await updateEventById(eventId, { formId: selectedFormId });
      setEventData((prev) => (prev ? { ...prev, formId: selectedFormId } : prev));
      await loadFormAndResponses(selectedFormId, null);
    } catch (err) {
      logger.error(`Failed to ${selectedFormId ? "attach" : "detach"} form: ${err}`);
      setError(`Failed to ${selectedFormId ? "attach" : "detach"} form`);
    } finally {
      setAttachingForm(false);
    }
  };

  if (loading || (usesTicketTypes && formLoading && !formId && formResponses.length === 0 && !error)) {
    return <div>Loading form responses...</div>;
  }
  if (error) return <div className="text-red-600">{error}</div>;

  const renderTypeTabs = () =>
    usesTicketTypes && sortedTicketTypes.length > 0 ? (
      <div className="flex flex-wrap gap-2 mb-4 border-b border-gray-200 pb-2">
        {sortedTicketTypes.map(({ eventTicketTypeId, eventTicketType }) => (
          <button
            key={eventTicketTypeId}
            type="button"
            onClick={() => setSelectedTypeId(eventTicketTypeId)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              selectedTypeId === eventTicketTypeId
                ? "bg-core-text text-white"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            {eventTicketType.name}
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
            {usesTicketTypes && selectedTicketType
              ? `No registration form is currently attached to the "${selectedTicketType.eventTicketType.name}" ticket type. Select a form below to start collecting participant registrations.`
              : "No registration form is currently attached to this event. Select a form below to start collecting participant registrations."}
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
    row.purchaserName = purchaserInfo?.name || "Form submission";
    row.purchaserEmail = purchaserInfo?.email || "Form submission";
    row.submissionTime = formatTimestamp(response.submissionTime);

    return row;
  });

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

  if (formResponses.length === 0)
    return (
      <div className="w-full md:w-[calc(100%-18rem)] my-2 p-2">
        {renderTypeTabs()}
        {renderHeader()}
        <div className="bg-core-hover rounded-lg p-6 mb-6">
          <p className="text-sm text-core-text">
            {usesTicketTypes ? "No responses submitted for this ticket type" : "No responses submitted"}
          </p>
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
      {renderTypeTabs()}
      {renderHeader()}

      <FormResponsesTable
        formResponses={formResponses}
        form={form!}
        formId={formId!}
        eventId={eventId}
        orderTicketsMap={approvedOrderTicketsMap}
        showPurchaserColumn={true}
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
