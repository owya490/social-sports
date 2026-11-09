"use client";

import DownloadCsvButton from "@/components/DownloadCsvButton";
import { FormSelector } from "@/components/events/create/forms/FormSelector";
import FormResponder, { FormResponderRef } from "@/components/forms/FormResponder";
import { FormResponsesTable } from "@/components/organiser/event/forms/FormResponsesTable";
import { useUser } from "@/components/utility/UserContext";
import { EventTicketTypeId } from "@/interfaces/EventTicketTypeTypes";
import { EventData, EventId } from "@/interfaces/EventTypes";
import { Form, FormId, FormResponse, FormSection, FormSectionType } from "@/interfaces/FormTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { UserId } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import {
  getSortedEventTicketTypes,
  hasEventTicketTypes,
  resolveFormIdForTicketType,
} from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import { getForm, getFormResponsesForEvent, submitManualFormResponse } from "@/services/src/forms/formsServices";
import {
  filterFormResponsesForApprovedOrders,
  filterFormResponsesForTicketType,
  getApprovedOrderTicketsMap,
  getFormSectionAnswerDisplay,
} from "@/services/src/forms/formsUtils/formsUtils";
import { CheckIcon, PlusIcon, TicketIcon } from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { EventHubPanel } from "./EventHubPanel";
import { EventFormAttachmentController } from "./useEventFormAttachment";
import {
  EventHubEmpty,
  EventHubGhostButton,
  EventHubPrimaryButton,
  EventHubStage,
  EventHubToolbar,
} from "./EventHubStage";

type EventHubRegistrationProps = {
  eventId: EventId;
  eventData: EventData;
  loading: boolean;
  orderTicketsMap: Map<Order, Ticket[]>;
  attachment: EventFormAttachmentController;
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

export function EventHubRegistration(props: EventHubRegistrationProps) {
  const { auth, user } = useUser();
  return <EventHubRegistrationContent key={`${props.eventId}:${auth.currentUser?.uid ?? ""}:${user.userId}`} {...props} />;
}

function EventHubRegistrationContent({
  eventId,
  eventData,
  loading,
  orderTicketsMap,
  attachment,
}: EventHubRegistrationProps) {
  const logger = useMemo(() => new Logger("EventHubRegistration"), []);
  const { auth, user, userLoading } = useUser();
  const [ownerUserId] = useState(user.userId);
  const {
    selectedTypeId,
    selectType,
    panelOpen: isChangeFormPanelOpen,
    showPanel: setIsChangeFormPanelOpen,
    isSaving: attachingForm,
    isReloadingTargets,
    targetRecovery,
    reloadTargets,
    intent: attachmentIntent,
    error: attachmentError,
    savedResult,
    revision: attachmentRevision,
    save: saveAttachment,
  } = attachment;
  const [responseData, setResponseData] = useState<{
    request: number; identity: string; accountId: UserId; form: Form | null; responses: FormResponse[];
    status: "loading" | "loaded" | "unknown" | "error"; error: string | null;
  }>({
    request: 0, identity: "", accountId: ownerUserId, form: null, responses: [], status: "unknown", error: null,
  });
  const [isAddFormResponseDialogOpen, setIsAddFormResponseDialogOpen] = useState(false);
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const formResponderRef = useRef<FormResponderRef>(null);
  const mountedRef = useRef(false);
  const readRequestRef = useRef({ request: 0, identity: "", revision: -1 });
  const approvedOrderTicketsMap = useMemo(() => getApprovedOrderTicketsMap(orderTicketsMap), [orderTicketsMap]);

  const resolvedTicketTypes = eventData.eventTicketTypes;
  const usesTicketTypes = hasEventTicketTypes({ eventTicketTypes: resolvedTicketTypes });
  const sortedTicketTypes = useMemo(
    () => getSortedEventTicketTypes(resolvedTicketTypes),
    [resolvedTicketTypes]
  );
  const selectedTicketType = sortedTicketTypes.find((t) => t.eventTicketTypeId === selectedTypeId);
  const selectedTypeName = selectedTicketType?.eventTicketType.name;
  const formId = usesTicketTypes
    ? selectedTicketType ? resolveFormIdForTicketType(eventData, selectedTypeId) : null
    : eventData.formId ?? null;
  const readIdentity = JSON.stringify([eventId, usesTicketTypes ? "ticketType" : "legacyEvent", usesTicketTypes ? selectedTypeId : null, formId]);
  const savedReadIdentity = savedResult ? JSON.stringify([eventId, savedResult.target.kind,
    savedResult.target.kind === "ticketType" ? savedResult.target.eventTicketTypeId : null, savedResult.formId]) : null;
  const savedReadIdentityRef = useRef(savedReadIdentity);
  const accountMatches = !!ownerUserId && user.userId === ownerUserId && auth.currentUser?.uid === ownerUserId;
  const ownsRead = accountMatches &&
    eventData.eventId === eventId && eventData.organiserId === ownerUserId && (!usesTicketTypes || !!selectedTicketType);
  const canRead = !loading && !userLoading && ownsRead;
  const currentReadRef = useRef({ identity: readIdentity, formId, canRead, ownsRead, auth, accountId: user.userId, revision: attachmentRevision });
  useLayoutEffect(() => {
    savedReadIdentityRef.current = savedReadIdentity;
    currentReadRef.current = { identity: readIdentity, formId, canRead, ownsRead, auth, accountId: user.userId, revision: attachmentRevision };
  }, [savedReadIdentity, readIdentity, formId, canRead, ownsRead, auth, user.userId, attachmentRevision]);
  const currentResponseData = ownsRead && responseData.accountId === ownerUserId && responseData.identity === readIdentity ? responseData : null;
  const formLoading = responseData.identity === readIdentity && responseData.status === "loading";
  const responseError = currentResponseData?.status === "unknown"
    ? "Responses have not been loaded. Retry loading responses."
    : currentResponseData?.error ?? null;
  const form = currentResponseData?.form ?? null;

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      readRequestRef.current = { request: readRequestRef.current.request + 1, identity: "", revision: -1 };
    };
  }, []);

  const formResponses = useMemo(() => {
    const responses = currentResponseData?.responses ?? [];
    return usesTicketTypes && selectedTypeId
      ? filterFormResponsesForTicketType(responses, orderTicketsMap, selectedTypeId, selectedTypeName)
      : filterFormResponsesForApprovedOrders(responses, orderTicketsMap);
  }, [currentResponseData, orderTicketsMap, usesTicketTypes, selectedTypeId, selectedTypeName]);

  useEffect(() => {
    if (usesTicketTypes && !selectedTypeId && !targetRecovery) {
      selectType(sortedTicketTypes[0]?.eventTicketTypeId ?? null);
    }
  }, [usesTicketTypes, selectedTypeId, sortedTicketTypes, selectType, targetRecovery]);

  const fetchResponses = useCallback(async () => {
    const requestIdentity = currentReadRef.current;
    const isCurrentAccount = () => !!requestIdentity.accountId && requestIdentity.accountId === ownerUserId &&
      currentReadRef.current.accountId === requestIdentity.accountId && currentReadRef.current.auth.currentUser?.uid === requestIdentity.accountId;
    if (!mountedRef.current || !requestIdentity.canRead || !isCurrentAccount()) return;
    const request = readRequestRef.current.request + 1;
    readRequestRef.current = { request, identity: requestIdentity.identity, revision: requestIdentity.revision };
    const isActive = () => mountedRef.current && readRequestRef.current.request === request;
    const isCurrent = () => isActive() && currentReadRef.current.ownsRead && currentReadRef.current.identity === requestIdentity.identity && isCurrentAccount();
    setResponseData({ request, identity: requestIdentity.identity, accountId: requestIdentity.accountId, form: null, responses: [],
      status: requestIdentity.formId ? "loading" : "loaded", error: null });
    if (!requestIdentity.formId) return;
    try {
      const [nextForm, responses] = await Promise.all([
        getForm(requestIdentity.formId),
        getFormResponsesForEvent(requestIdentity.formId, eventId),
      ]);
      if (isCurrent()) setResponseData({ request, identity: requestIdentity.identity, accountId: requestIdentity.accountId,
        form: nextForm, responses, status: "loaded", error: null });
    } catch (err) {
      if (isCurrent()) {
        logger.error(`Failed to load form responses: ${err}`);
        const error = savedReadIdentityRef.current === requestIdentity.identity
          ? "Form saved, but responses could not be loaded. Retry loading responses."
          : "Responses could not be loaded. Retry loading responses.";
        setResponseData({ request, identity: requestIdentity.identity, accountId: requestIdentity.accountId,
          form: null, responses: [], status: "error", error });
      }
    } finally {
      if (isActive()) setResponseData((current) => current.request === request && current.status === "loading" ? { ...current, status: "unknown" } : current);
    }
  }, [eventId, logger, ownerUserId]);

  useEffect(() => {
    if (!canRead) return;
    if (readRequestRef.current.identity === readIdentity && readRequestRef.current.revision === attachmentRevision) return;
    void fetchResponses();
  }, [readIdentity, canRead, attachmentRevision, fetchResponses]);

  const handleFormAttachment = (selectedFormId: FormId | null) => {
    if (attachingForm || isReloadingTargets || targetRecovery === "reload" || targetRecovery === "choose" || (usesTicketTypes && !selectedTicketType)) return;
    void saveAttachment({
      eventId,
      target: usesTicketTypes && selectedTypeId
        ? { kind: "ticketType", eventTicketTypeId: selectedTypeId }
        : { kind: "legacyEvent" },
      formId: selectedFormId,
    });
  };

  const formResponseToPurchaser = createFormResponseMap(approvedOrderTicketsMap);
  const sortedFormResponses = [...formResponses].sort((a, b) => {
    const purchaserA = formResponseToPurchaser.get(a.formResponseId);
    const purchaserB = formResponseToPurchaser.get(b.formResponseId);
    if (!purchaserA && !purchaserB) return 0;
    if (!purchaserA) return 1;
    if (!purchaserB) return -1;
    const nameCompare = purchaserA.name.localeCompare(purchaserB.name);
    if (nameCompare !== 0) return nameCompare;
    return purchaserA.email.localeCompare(purchaserB.email);
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
    row.purchaserName = purchaserInfo?.name || "Form submission";
    row.purchaserEmail = purchaserInfo?.email || "Form submission";
    row.submissionTime = formatTimestamp(response.submissionTime);
    return row;
  });

  const renderAttachmentFeedback = () => (
    <>
      {attachingForm ? <p role="status" className="text-sm text-foreground-muted font-sans">Saving form...</p> : null}
      {isReloadingTargets ? <p role="status" className="text-sm text-foreground-muted font-sans">Loading ticket types...</p> : null}
      {savedResult ? <p role="status" className="text-sm text-foreground-secondary font-sans">Form saved</p> : null}
      {attachmentError && attachmentIntent ? (
        <div role="alert" className="flex flex-wrap items-center gap-2 text-sm text-danger font-sans">
          <p>{attachmentError}</p>
          <EventHubGhostButton disabled={attachingForm || isReloadingTargets} onClick={() => {
            if (targetRecovery === "reload") void reloadTargets();
            else void saveAttachment(attachmentIntent);
          }}>
            {targetRecovery === "reload" ? "Reload ticket types" : attachmentIntent.formId ? "Retry attachment" : "Retry detachment"}
          </EventHubGhostButton>
        </div>
      ) : null}
      {targetRecovery === "choose" || targetRecovery === "apply" ? (
        <div className="space-y-2 text-sm text-foreground-secondary font-sans">
          <p>Choose a current target, then apply your kept form choice.</p>
          <EventHubGhostButton disabled={targetRecovery !== "apply" || attachingForm || isReloadingTargets} onClick={() => {
            if (attachmentIntent) void saveAttachment(attachmentIntent);
          }}>
            {attachmentIntent?.formId ? "Apply form" : "Apply detachment"}
          </EventHubGhostButton>
        </div>
      ) : null}
    </>
  );

  const renderFormSelector = () => (
    <div className="space-y-3">
      {targetRecovery ? renderTypeSelector() : null}
      {renderAttachmentFeedback()}
      <FormSelector
        formId={attachmentIntent ? attachmentIntent.formId : formId}
        user={user}
        disabled={attachingForm || isReloadingTargets || targetRecovery === "reload" || targetRecovery === "choose" || (usesTicketTypes && !selectedTicketType)}
        updateField={handleFormAttachment}
      />
    </div>
  );

  const renderTypeSelector = () =>
    usesTicketTypes && sortedTicketTypes.length > 0 ? (
      <div className="pb-3 mb-1 border-b border-border">
        <label className="block space-y-1.5 max-w-sm">
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-muted font-sans">
            <TicketIcon className="h-4 w-4" aria-hidden />
            Ticket type
          </span>
          <select
            value={selectedTypeId ?? ""}
            disabled={attachingForm || isReloadingTargets || targetRecovery === "reload"}
            onChange={(e) => {
              if (attachingForm || isReloadingTargets || targetRecovery === "reload") return;
              if (!e.target.value) return;
              selectType(e.target.value as EventTicketTypeId);
            }}
            className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground font-sans disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          >
            {!selectedTypeId ? <option value="" disabled>Choose a ticket type</option> : null}
            {selectedTypeId && !selectedTicketType ? <option value={selectedTypeId} disabled>Ticket type no longer available</option> : null}
            {sortedTicketTypes.map(({ eventTicketTypeId, eventTicketType }) => (
              <option key={eventTicketTypeId} value={eventTicketTypeId}>
                {eventTicketType.name}
              </option>
            ))}
          </select>
        </label>
      </div>
    ) : targetRecovery === "choose" || targetRecovery === "apply" ? (
      <label className="block space-y-1.5 max-w-sm">
        <span className="text-xs font-medium text-foreground-muted font-sans">Form target</span>
        <select
          value={targetRecovery === "choose" ? "" : "legacyEvent"}
          disabled={attachingForm || isReloadingTargets}
          onChange={(e) => { if (e.target.value === "legacyEvent") selectType(null); }}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        >
          <option value="" disabled>Choose a form target</option>
          <option value="legacyEvent">Event registration form</option>
        </select>
      </label>
    ) : (
      <div className="rounded-xl border border-border bg-background px-4 py-4 mb-3 space-y-1">
        <div className="flex items-center gap-2">
          <TicketIcon className="h-4 w-4 text-foreground-muted" aria-hidden />
          <p className="text-sm font-semibold text-foreground font-sans">No ticket types</p>
        </div>
        <p className="text-xs text-foreground-muted font-sans">
          Add ticket types in Edit details to attach a form per type.
        </p>
      </div>
    );

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

  if (!formId) {
    return (
      <EventHubStage>
        {!targetRecovery ? renderTypeSelector() : null}
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
        <div className="pt-2">{renderFormSelector()}</div>
      </EventHubStage>
    );
  }

  return (
    <EventHubStage>
      {!(targetRecovery && isChangeFormPanelOpen) ? renderTypeSelector() : null}
      {!isChangeFormPanelOpen ? renderAttachmentFeedback() : null}
      {responseError ? (
        <div role="alert" className="mb-3 flex flex-wrap items-center gap-2 text-sm text-danger font-sans">
          <p>{responseError}</p>
          <EventHubGhostButton disabled={formLoading} onClick={() => void fetchResponses()}>
            Retry loading responses
          </EventHubGhostButton>
        </div>
      ) : null}
      <EventHubToolbar
        meta={
          <span className="block truncate">
            {currentResponseData?.status === "loaded"
              ? `${formResponses.length} response${formResponses.length === 1 ? "" : "s"}`
              : formLoading ? "Loading responses..." : "Responses not loaded"}
            {form?.title ? <span className="text-foreground-muted"> · {form.title}</span> : null}
            {selectedTicketType ? (
              <span className="text-foreground-muted"> · {selectedTicketType.eventTicketType.name}</span>
            ) : null}
          </span>
        }
        action={
          <div className="flex items-center gap-2">
            <EventHubGhostButton disabled={attachingForm || isReloadingTargets} onClick={() => setIsChangeFormPanelOpen(true)}>
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
            <EventHubPrimaryButton disabled={attachingForm || formLoading || !form} onClick={() => setIsAddFormResponseDialogOpen(true)}>
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
      ) : responseError || !currentResponseData ? null : formResponses.length === 0 ? (
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
          flush
        />
      ) : null}

      <EventHubPanel
        open={isChangeFormPanelOpen}
        onClose={() => {
          setIsChangeFormPanelOpen(false);
        }}
        title={
          selectedTicketType
            ? `Change form · ${selectedTicketType.eventTicketType.name}`
            : "Change attached form"
        }
        wide
        saving={attachingForm || isReloadingTargets}
      >
        {renderFormSelector()}
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
            variant="compact"
          />
        </div>
      </EventHubPanel>
    </EventHubStage>
  );
}
