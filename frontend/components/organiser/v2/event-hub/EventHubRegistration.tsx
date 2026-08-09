"use client";

import DownloadCsvButton from "@/components/DownloadCsvButton";
import { FormSelector } from "@/components/events/create/forms/FormSelector";
import FormResponder, { FormResponderRef } from "@/components/forms/FormResponder";
import { FormResponsesTable } from "@/components/organiser/event/forms/FormResponsesTable";
import {
  EventTicketTypeFormDialog,
  EventTicketTypeFormValues,
} from "@/components/organiser/event/settings/EventTicketTypeFormDialog";
import { useUser } from "@/components/utility/UserContext";
import { EventTicketTypeId, EventTicketTypesMap } from "@/interfaces/EventTicketTypeTypes";
import { EventData, EventId } from "@/interfaces/EventTypes";
import { Form, FormId, FormResponse, FormSection, FormSectionType } from "@/interfaces/FormTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { Logger } from "@/observability/logger";
import { getEventById, updateEventById } from "@/services/src/events/eventsService";
import {
  applyCapacityChange,
  countSoldTicketsForType,
  createEventTicketType,
  getSortedEventTicketTypes,
  hasEventTicketTypes,
  resolveFormIdForTicketType,
  syncEventAggregatesFromTicketTypes,
} from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import { getForm, getFormResponsesForEvent, submitManualFormResponse } from "@/services/src/forms/formsServices";
import {
  filterFormResponsesForApprovedOrders,
  filterFormResponsesForTicketType,
  getApprovedOrderTicketsMap,
  getFormSectionAnswerDisplay,
} from "@/services/src/forms/formsUtils/formsUtils";
import { MIN_PRICE_AMOUNT_FOR_STRIPE_CHECKOUT_CENTS } from "@/services/src/stripe/stripeConstants";
import { centsToDollars, dollarsToCents, getEventPriceDisplay } from "@/utilities/priceUtils";
import { CheckIcon, PencilIcon, PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { EventHubPanel } from "./EventHubPanel";
import {
  EventHubEmpty,
  EventHubGhostButton,
  EventHubPrimaryButton,
  EventHubStage,
  EventHubToolbar,
} from "./EventHubStage";

type EventHubRegistrationProps = {
  eventId: EventId;
  orderTicketsMap: Map<Order, Ticket[]>;
  eventTicketTypes: EventTicketTypesMap | undefined;
  setEventTicketTypes: (types: EventTicketTypesMap | undefined) => void;
  setEventCapacity: (capacity: number) => void;
  setEventVacancy: (vacancy: number) => void;
  setEventPrice: (price: number) => void;
};

const formatTimestamp = (ts: Timestamp | null): string => {
  if (!ts) return "—";
  return ts.toDate().toLocaleString();
};

type PurchaserInfo = { name: string; email: string };

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

export function EventHubRegistration({
  eventId,
  orderTicketsMap,
  eventTicketTypes,
  setEventTicketTypes,
  setEventCapacity,
  setEventVacancy,
  setEventPrice,
}: EventHubRegistrationProps) {
  const logger = useMemo(() => new Logger("EventHubRegistration"), []);
  const { user, userLoading } = useUser();
  const router = useRouter();
  const [eventData, setEventData] = useState<EventData | null>(null);
  const [selectedTypeId, setSelectedTypeId] = useState<EventTicketTypeId | null>(null);
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const unfilteredFormResponsesRef = useRef<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ticketTypeError, setTicketTypeError] = useState<string | null>(null);
  const [formId, setFormId] = useState<FormId | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [attachingForm, setAttachingForm] = useState(false);
  const [isAddFormResponseDialogOpen, setIsAddFormResponseDialogOpen] = useState(false);
  const [isChangeFormPanelOpen, setIsChangeFormPanelOpen] = useState(false);
  const [ticketTypeDialogOpen, setTicketTypeDialogOpen] = useState(false);
  const [editingTicketTypeId, setEditingTicketTypeId] = useState<EventTicketTypeId | null>(null);
  const [organiserEmail, setOrganiserEmail] = useState("");
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const formResponderRef = useRef<FormResponderRef>(null);
  const approvedOrderTicketsMap = useMemo(() => getApprovedOrderTicketsMap(orderTicketsMap), [orderTicketsMap]);

  const resolvedTicketTypes = eventTicketTypes ?? eventData?.eventTicketTypes;
  const usesTicketTypes = hasEventTicketTypes({ eventTicketTypes: resolvedTicketTypes });
  const sortedTicketTypes = useMemo(
    () => getSortedEventTicketTypes(resolvedTicketTypes),
    [resolvedTicketTypes]
  );
  const selectedTicketType = sortedTicketTypes.find((t) => t.eventTicketTypeId === selectedTypeId);
  const editingTicketType =
    editingTicketTypeId && resolvedTicketTypes ? resolvedTicketTypes[editingTicketTypeId] : undefined;

  useEffect(() => {
    if (eventTicketTypes === undefined) return;
    setEventData((prev) => (prev ? { ...prev, eventTicketTypes } : prev));
  }, [eventTicketTypes]);

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

  const loadFormAndResponses = useCallback(
    async (resolvedFormId: FormId | null, typeIdForFilter: EventTicketTypeId | null) => {
      setFormId(resolvedFormId);
      if (!resolvedFormId) {
        setForm(null);
        unfilteredFormResponsesRef.current = [];
        setFormResponses([]);
        return;
      }

      const nextForm = await getForm(resolvedFormId);
      setForm(nextForm);
      const fetched = await getFormResponsesForEvent(resolvedFormId, eventId);
      unfilteredFormResponsesRef.current = fetched;
      if (typeIdForFilter) {
        setFormResponses(filterFormResponsesForTicketType(fetched, orderTicketsMap, typeIdForFilter));
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

      if (userLoading || !user.userId) return;

      const email =
        loadedEventData.organiser?.publicContactInformation?.email || user.contactInformation?.email || "";
      setOrganiserEmail(email);

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
        await loadFormAndResponses(resolvedFormId, selectedTypeId);
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
  }, [eventData, usesTicketTypes, selectedTypeId, loadFormAndResponses, logger]);

  const fetchResponses = useCallback(async () => {
    if (!eventData) {
      await fetchEvent();
      return;
    }

    try {
      if (usesTicketTypes && selectedTypeId) {
        const resolvedFormId = resolveFormIdForTicketType(eventData, selectedTypeId);
        await loadFormAndResponses(resolvedFormId, selectedTypeId);
        return;
      }
      await loadFormAndResponses((eventData.formId as FormId | null) ?? null, null);
    } catch (err) {
      logger.error(`Failed to refresh form responses: ${err}`);
      setError("Failed to load form responses");
    }
  }, [eventData, usesTicketTypes, selectedTypeId, loadFormAndResponses, fetchEvent, logger]);

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
        const syncEventFormId = Object.keys(types).length === 1;
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
        setEventTicketTypes(nextTypes);
        await loadFormAndResponses(resolveFormIdForTicketType(nextEventData, selectedTypeId), selectedTypeId);
        setIsChangeFormPanelOpen(false);
        return;
      }

      await updateEventById(eventId, { formId: selectedFormId });
      setEventData((prev) => (prev ? { ...prev, formId: selectedFormId } : prev));

      if (!selectedFormId) {
        setFormId(null);
        setForm(null);
        unfilteredFormResponsesRef.current = [];
        setFormResponses([]);
        setIsChangeFormPanelOpen(false);
        return;
      }

      await loadFormAndResponses(selectedFormId, null);
      setIsChangeFormPanelOpen(false);
    } catch (err) {
      logger.error(`Failed to ${selectedFormId ? "attach" : "detach"} form: ${err}`);
      setError(`Failed to ${selectedFormId ? "attach" : "detach"} form`);
    } finally {
      setAttachingForm(false);
    }
  };

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
    Object.entries(response.responseMap).forEach(([, section]) => {
      if (section.type !== FormSectionType.IMAGE) {
        const question = section.question.trim();
        const count = questionCounts.get(question) || 0;
        questionCounts.set(question, count + 1);
        allQuestionIdentifiers.add(count === 0 ? question : `${question} ${count + 1}`);
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

    Object.entries(response.responseMap).forEach(([, section]) => {
      if (section.type !== FormSectionType.IMAGE) {
        const question = section.question.trim();
        const count = questionCounts.get(question) || 0;
        questionCounts.set(question, count + 1);
        questionMapping.set(count === 0 ? question : `${question} ${count + 1}`, section);
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

  const persistTicketTypes = async (nextTypes: EventTicketTypesMap) => {
    setTicketTypeError(null);
    const aggregates = syncEventAggregatesFromTicketTypes(nextTypes);
    await updateEventById(eventId, {
      eventTicketTypes: nextTypes,
      price: aggregates.price,
      capacity: aggregates.capacity,
      vacancy: aggregates.vacancy,
    });
    setEventTicketTypes(nextTypes);
    setEventPrice(aggregates.price);
    setEventCapacity(aggregates.capacity);
    setEventVacancy(aggregates.vacancy);
    setEventData((prev) =>
      prev
        ? {
            ...prev,
            eventTicketTypes: nextTypes,
            price: aggregates.price,
            capacity: aggregates.capacity,
            vacancy: aggregates.vacancy,
          }
        : prev
    );
  };

  const handleSaveTicketType = async (values: EventTicketTypeFormValues) => {
    const price = values.priceDollars <= 0 ? 0 : dollarsToCents(values.priceDollars);
    const current = resolvedTicketTypes ?? {};

    if (editingTicketTypeId && current[editingTicketTypeId]) {
      const existing = current[editingTicketTypeId];
      const updatedType = applyCapacityChange(
        {
          ...existing,
          name: values.name,
          price,
          formId: values.formId,
        },
        values.capacity
      );
      await persistTicketTypes({
        ...current,
        [editingTicketTypeId]: updatedType,
      });
      setSelectedTypeId(editingTicketTypeId);
    } else {
      const eventTicketType = createEventTicketType({
        name: values.name,
        price,
        capacity: values.capacity,
        formId: values.formId,
      });
      await persistTicketTypes({
        ...current,
        [eventTicketType.id]: eventTicketType,
      });
      setSelectedTypeId(eventTicketType.id);
    }
    setTicketTypeDialogOpen(false);
    setEditingTicketTypeId(null);
  };

  const handleDeleteTicketType = async (id: EventTicketTypeId) => {
    if (!resolvedTicketTypes?.[id]) return;
    if (Object.keys(resolvedTicketTypes).length <= 1) {
      setTicketTypeError("Events must have at least one ticket type.");
      return;
    }
    const sold = countSoldTicketsForType(orderTicketsMap, id);
    if (sold > 0) {
      setTicketTypeError(
        `Cannot delete "${resolvedTicketTypes[id].name}" because ${sold} ticket(s) have already been sold.`
      );
      return;
    }
    const confirmed = window.confirm(`Delete ticket type "${resolvedTicketTypes[id].name}"? This cannot be undone.`);
    if (!confirmed) return;

    const { [id]: _removed, ...rest } = resolvedTicketTypes;
    await persistTicketTypes(rest);
    const remaining = getSortedEventTicketTypes(rest);
    setSelectedTypeId(remaining[0]?.eventTicketTypeId ?? null);
  };

  const renderTypeTabs = () =>
    usesTicketTypes && sortedTicketTypes.length > 0 ? (
      <div className="space-y-3 pb-3 mb-1 border-b border-border">
        <div className="flex flex-wrap items-center gap-2">
          {sortedTicketTypes.map(({ eventTicketTypeId, eventTicketType }) => {
            const selected = selectedTypeId === eventTicketTypeId;
            return (
              <button
                key={eventTicketTypeId}
                type="button"
                onClick={() => setSelectedTypeId(eventTicketTypeId)}
                className={`px-3 py-1.5 text-sm font-medium font-sans rounded-lg border border-border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                  selected
                    ? "bg-core-text text-white border-core-text"
                    : "bg-background text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
                }`}
              >
                {eventTicketType.name}
              </button>
            );
          })}
          <EventHubGhostButton
            onClick={() => {
              setEditingTicketTypeId(null);
              setTicketTypeDialogOpen(true);
            }}
          >
            <PlusIcon className="h-4 w-4" aria-hidden />
            Add type
          </EventHubGhostButton>
        </div>

        {selectedTicketType ? (
          <div className="rounded-xl border border-border bg-background px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground font-sans">
                {selectedTicketType.eventTicketType.name}
              </p>
              <p className="text-xs text-foreground-muted font-sans mt-0.5">
                {getEventPriceDisplay(selectedTicketType.eventTicketType.price, true)} ·{" "}
                {countSoldTicketsForType(orderTicketsMap, selectedTicketType.eventTicketTypeId)} sold ·{" "}
                {selectedTicketType.eventTicketType.vacancy} remaining of{" "}
                {selectedTicketType.eventTicketType.capacity}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <EventHubGhostButton
                onClick={() => {
                  setEditingTicketTypeId(selectedTicketType.eventTicketTypeId);
                  setTicketTypeDialogOpen(true);
                }}
              >
                <PencilIcon className="h-4 w-4" aria-hidden />
                Edit
              </EventHubGhostButton>
              <EventHubGhostButton
                onClick={() => void handleDeleteTicketType(selectedTicketType.eventTicketTypeId)}
              >
                <TrashIcon className="h-4 w-4" aria-hidden />
                Delete
              </EventHubGhostButton>
            </div>
          </div>
        ) : null}

        {ticketTypeError ? <p className="text-sm text-danger font-sans">{ticketTypeError}</p> : null}
      </div>
    ) : (
      <div className="rounded-xl border border-border bg-background px-4 py-4 mb-3 space-y-3">
        <div>
          <p className="text-sm font-semibold text-foreground font-sans">Ticket types</p>
          <p className="text-xs text-foreground-muted font-sans mt-1">
            Add ticket types to offer different prices, capacities, and registration forms.
          </p>
        </div>
        <EventHubPrimaryButton
          onClick={() => {
            setEditingTicketTypeId(null);
            setTicketTypeDialogOpen(true);
          }}
        >
          <PlusIcon className="h-4 w-4" aria-hidden />
          Add ticket type
        </EventHubPrimaryButton>
        {ticketTypeError ? <p className="text-sm text-danger font-sans">{ticketTypeError}</p> : null}
      </div>
    );

  if (loading || (usesTicketTypes && formLoading && !formId && formResponses.length === 0 && !error)) {
    return (
      <EventHubStage>
        <EventHubToolbar meta="Registration" />
        <div className="space-y-3 pt-2">
          <Skeleton height={28} width="40%" />
          <Skeleton height={52} />
          <Skeleton height={52} />
          <Skeleton height={52} />
        </div>
      </EventHubStage>
    );
  }

  if (error) {
    return (
      <EventHubStage>
        <EventHubEmpty>
          <span className="text-danger">{error}</span>
        </EventHubEmpty>
      </EventHubStage>
    );
  }

  if (!formId) {
    return (
      <EventHubStage>
        {renderTypeTabs()}
        <EventHubToolbar
          meta={
            usesTicketTypes && selectedTicketType
              ? `No form · ${selectedTicketType.eventTicketType.name}`
              : "No form attached"
          }
        />
        <EventHubEmpty>
          {usesTicketTypes && selectedTicketType
            ? `Attach a registration form for "${selectedTicketType.eventTicketType.name}" to collect answers with bookings.`
            : "Attach a registration form to collect answers with bookings. Pick one below."}
        </EventHubEmpty>
        <div className="pt-2">
          {attachingForm ? (
            <p className="text-sm text-foreground-muted font-sans">Attaching form…</p>
          ) : (
            <FormSelector formId={formId} user={user} updateField={handleFormAttachment} />
          )}
        </div>
        <EventTicketTypeFormDialog
          open={ticketTypeDialogOpen}
          onClose={() => {
            setTicketTypeDialogOpen(false);
            setEditingTicketTypeId(null);
          }}
          title={editingTicketTypeId ? "Edit Ticket Type" : "Add Ticket Type"}
          initialValues={
            editingTicketType
              ? {
                  name: editingTicketType.name,
                  priceDollars: centsToDollars(editingTicketType.price),
                  capacity: editingTicketType.capacity,
                  formId: editingTicketType.formId ?? null,
                }
              : {
                  name: "",
                  priceDollars: centsToDollars(MIN_PRICE_AMOUNT_FOR_STRIPE_CHECKOUT_CENTS),
                  capacity: 20,
                  formId: null,
                }
          }
          user={user}
          onSave={handleSaveTicketType}
        />
      </EventHubStage>
    );
  }

  return (
    <EventHubStage>
      {renderTypeTabs()}
      <EventHubToolbar
        meta={
          <span className="block truncate">
            {formResponses.length} response{formResponses.length === 1 ? "" : "s"}
            {form?.title ? <span className="text-foreground-muted"> · {form.title}</span> : null}
            {usesTicketTypes && selectedTicketType ? (
              <span className="text-foreground-muted"> · {selectedTicketType.eventTicketType.name}</span>
            ) : null}
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <EventHubGhostButton onClick={() => setIsChangeFormPanelOpen(true)}>
              <span className="hidden sm:inline">Change form</span>
              <span className="sm:hidden">Form</span>
            </EventHubGhostButton>
            {formResponses.length > 0 ? (
              <DownloadCsvButton
                data={csvData}
                headers={csvHeaders}
                filename={`FormResponses_${eventId}${selectedTypeId ? `_${selectedTypeId}` : ""}.csv`}
                className="!rounded-xl !bg-background !text-foreground border border-border hover:!bg-surface-hover !font-sans !font-medium px-3 py-2 focus-visible:!outline focus-visible:!outline-2 focus-visible:!outline-offset-2 focus-visible:!outline-focus focus-visible:!ring-0"
              />
            ) : null}
            <EventHubPrimaryButton onClick={() => setIsAddFormResponseDialogOpen(true)}>
              <PlusIcon className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Add answers</span>
              <span className="sm:hidden">Add</span>
            </EventHubPrimaryButton>
          </div>
        }
      />

      {formLoading ? (
        <div className="space-y-3 pt-2">
          <Skeleton height={52} />
          <Skeleton height={52} />
        </div>
      ) : formResponses.length === 0 ? (
        <EventHubEmpty>
          {usesTicketTypes
            ? "No responses yet for this ticket type. Answers from approved bookings will show here."
            : "No responses yet. Answers from approved bookings will show here."}
        </EventHubEmpty>
      ) : form ? (
        <FormResponsesTable
          formResponses={formResponses}
          form={form}
          formId={formId}
          eventId={eventId}
          orderTicketsMap={approvedOrderTicketsMap}
          showPurchaserColumn={true}
          organiserEmail={organiserEmail}
          flush
        />
      ) : null}

      <EventHubPanel
        open={isChangeFormPanelOpen}
        onClose={() => setIsChangeFormPanelOpen(false)}
        title={
          usesTicketTypes && selectedTicketType
            ? `Change form · ${selectedTicketType.eventTicketType.name}`
            : "Change attached form"
        }
        wide
      >
        {attachingForm ? (
          <p className="text-sm text-foreground-muted font-sans">Updating…</p>
        ) : (
          <FormSelector formId={formId} user={user} updateField={handleFormAttachment} />
        )}
      </EventHubPanel>

      <EventHubPanel
        open={isAddFormResponseDialogOpen}
        onClose={() => {
          setIsAddFormResponseDialogOpen(false);
          setAddError(null);
        }}
        title="Add answers"
        wide
        footer={
          <EventHubPrimaryButton
            disabled={addSaving}
            onClick={async () => {
              if (!formResponderRef.current || !formId) return;
              if (!formResponderRef.current.areAllRequiredFieldsFilled()) {
                setAddError("Please fill out all required fields.");
                return;
              }
              try {
                setAddSaving(true);
                setAddError(null);
                const savedId = await formResponderRef.current.save();
                await submitManualFormResponse(formId, eventId, savedId);
                await fetchResponses();
                setIsAddFormResponseDialogOpen(false);
              } catch (err: unknown) {
                logger.error(`Failed to save form response: ${err}`);
                setAddError(`Failed to save. ${err instanceof Error ? err.message : "Please try again."}`);
              } finally {
                setAddSaving(false);
              }
            }}
          >
            <CheckIcon className="h-4 w-4" aria-hidden />
            {addSaving ? "Saving…" : "Save response"}
          </EventHubPrimaryButton>
        }
      >
        <div className="space-y-3">
          {addError ? <p className="text-sm text-danger font-sans">{addError}</p> : null}
          <FormResponder
            ref={formResponderRef}
            formId={formId}
            eventId={eventId}
            formResponseId={null}
            canEditForm={true}
            isEmbedded={true}
            hideSaveButton={true}
          />
        </div>
      </EventHubPanel>

      <EventTicketTypeFormDialog
        open={ticketTypeDialogOpen}
        onClose={() => {
          setTicketTypeDialogOpen(false);
          setEditingTicketTypeId(null);
        }}
        title={editingTicketTypeId ? "Edit Ticket Type" : "Add Ticket Type"}
        initialValues={
          editingTicketType
            ? {
                name: editingTicketType.name,
                priceDollars: centsToDollars(editingTicketType.price),
                capacity: editingTicketType.capacity,
                formId: editingTicketType.formId ?? null,
              }
            : {
                name: "",
                priceDollars: centsToDollars(MIN_PRICE_AMOUNT_FOR_STRIPE_CHECKOUT_CENTS),
                capacity: 20,
                formId: null,
              }
        }
        user={user}
        onSave={handleSaveTicketType}
      />
    </EventHubStage>
  );
}
