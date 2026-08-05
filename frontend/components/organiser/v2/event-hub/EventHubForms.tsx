"use client";

import DownloadCsvButton from "@/components/DownloadCsvButton";
import { FormSelector } from "@/components/events/create/forms/FormSelector";
import AddFormResponseDialog from "@/components/organiser/event/forms/AddFormResponseDialog";
import { FormResponsesTable } from "@/components/organiser/event/forms/FormResponsesTable";
import { useUser } from "@/components/utility/UserContext";
import { EventData, EventId } from "@/interfaces/EventTypes";
import { Form, FormId, FormResponse, FormSection, FormSectionType } from "@/interfaces/FormTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { Logger } from "@/observability/logger";
import { getEventById, updateEventById } from "@/services/src/events/eventsService";
import { getForm, getFormResponsesForEvent } from "@/services/src/forms/formsServices";
import {
  filterFormResponsesForApprovedOrders,
  getApprovedOrderTicketsMap,
  getFormSectionAnswerDisplay,
} from "@/services/src/forms/formsUtils/formsUtils";
import { PlusIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import {
  EventHubEmpty,
  EventHubPrimaryButton,
  EventHubStage,
  EventHubToolbar,
} from "./EventHubStage";

type EventHubFormsProps = {
  eventId: EventId;
  orderTicketsMap: Map<Order, Ticket[]>;
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

export function EventHubForms({ eventId, orderTicketsMap }: EventHubFormsProps) {
  const logger = useMemo(() => new Logger("EventHubForms"), []);
  const { user, userLoading } = useUser();
  const router = useRouter();
  const [formResponses, setFormResponses] = useState<FormResponse[]>([]);
  const unfilteredFormResponsesRef = useRef<FormResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formId, setFormId] = useState<FormId | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [attachingForm, setAttachingForm] = useState(false);
  const [isAddFormResponseDialogOpen, setIsAddFormResponseDialogOpen] = useState(false);
  const [organiserEmail, setOrganiserEmail] = useState("");
  const approvedOrderTicketsMap = useMemo(() => getApprovedOrderTicketsMap(orderTicketsMap), [orderTicketsMap]);

  const applyApprovedOrderFilter = useCallback(() => {
    setFormResponses(filterFormResponsesForApprovedOrders(unfilteredFormResponsesRef.current, orderTicketsMap));
  }, [orderTicketsMap]);

  useEffect(() => {
    applyApprovedOrderFilter();
  }, [applyApprovedOrderFilter]);

  const fetchResponses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const eventData: EventData = await getEventById(eventId);
      if (userLoading || !user.userId) return;

      const email = eventData.organiser?.publicContactInformation?.email || user.contactInformation?.email || "";
      setOrganiserEmail(email);

      if (eventData.organiserId !== user.userId) {
        setError("You are not authorised to view this event");
        router.push("/organiser/v2/dashboard");
        return;
      }

      if (!eventData.formId) {
        setFormId(null);
        setForm(null);
        setLoading(false);
        return;
      }

      const currentFormId = eventData.formId as FormId;
      setFormId(currentFormId);
      const nextForm = await getForm(currentFormId);
      setForm(nextForm);

      const fetched = await getFormResponsesForEvent(currentFormId, eventId);
      unfilteredFormResponsesRef.current = fetched;
      setFormResponses(filterFormResponsesForApprovedOrders(fetched, orderTicketsMap));
    } catch (err) {
      logger.error(`Failed to load form responses: ${err}`);
      setError("Failed to load form responses");
    } finally {
      setLoading(false);
    }
  }, [eventId, orderTicketsMap, user.userId, userLoading, router, logger]);

  const handleFormAttachment = async (selectedFormId: FormId | null) => {
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
      const nextForm = await getForm(selectedFormId);
      setForm(nextForm);
      const fetched = await getFormResponsesForEvent(selectedFormId, eventId);
      unfilteredFormResponsesRef.current = fetched;
      setFormResponses(filterFormResponsesForApprovedOrders(fetched, orderTicketsMap));
    } catch (err) {
      logger.error(`Failed to ${selectedFormId ? "attach" : "detach"} form: ${err}`);
      setError(`Failed to ${selectedFormId ? "attach" : "detach"} form`);
    } finally {
      setAttachingForm(false);
    }
  };

  useEffect(() => {
    void fetchResponses();
  }, [fetchResponses]);

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

  if (loading) {
    return (
      <EventHubStage>
        <EventHubToolbar meta="Forms" />
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
        <EventHubToolbar meta="No form attached" />
        <EventHubEmpty>
          Attach a registration form to collect answers with bookings. Pick one below.
        </EventHubEmpty>
        <div className="pt-2">
          {attachingForm ? (
            <p className="text-sm text-foreground-muted font-sans">Attaching form…</p>
          ) : (
            <FormSelector formId={formId} user={user} updateField={handleFormAttachment} />
          )}
        </div>
      </EventHubStage>
    );
  }

  return (
    <EventHubStage>
      <EventHubToolbar
        meta={
          <span className="block truncate">
            {formResponses.length} response{formResponses.length === 1 ? "" : "s"}
            {form?.title ? (
              <span className="text-foreground-muted"> · {form.title}</span>
            ) : null}
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            {formResponses.length > 0 ? (
              <DownloadCsvButton data={csvData} headers={csvHeaders} filename={`FormResponses_${eventId}.csv`} />
            ) : null}
            <EventHubPrimaryButton onClick={() => setIsAddFormResponseDialogOpen(true)}>
              <PlusIcon className="h-4 w-4" aria-hidden />
              <span className="hidden sm:inline">Add answers</span>
              <span className="sm:hidden">Add</span>
            </EventHubPrimaryButton>
          </div>
        }
      />

      {formResponses.length === 0 ? (
        <>
          <EventHubEmpty>No responses yet. Answers from approved bookings will show here.</EventHubEmpty>
          <div className="border-t border-border pt-4">
            <p className="text-xs font-medium text-foreground-muted font-sans mb-3">Change attached form</p>
            {attachingForm ? (
              <p className="text-sm text-foreground-muted font-sans">Updating…</p>
            ) : (
              <FormSelector formId={formId} user={user} updateField={handleFormAttachment} />
            )}
          </div>
        </>
      ) : (
        <div className="pt-2 -mx-1 overflow-x-auto">
          <FormResponsesTable
            formResponses={formResponses}
            form={form!}
            formId={formId}
            eventId={eventId}
            orderTicketsMap={approvedOrderTicketsMap}
            showPurchaserColumn={true}
            organiserEmail={organiserEmail}
            flush
          />
        </div>
      )}

      <AddFormResponseDialog
        isOpen={isAddFormResponseDialogOpen}
        onClose={() => setIsAddFormResponseDialogOpen(false)}
        formId={formId}
        eventId={eventId}
        refreshResponses={fetchResponses}
      />
    </EventHubStage>
  );
}
