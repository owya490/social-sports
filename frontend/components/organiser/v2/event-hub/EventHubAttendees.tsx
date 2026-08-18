"use client";

import DownloadCsvButton from "@/components/DownloadCsvButton";
import Loading from "@/components/loading/Loading";
import RemoveAttendeeDialog from "@/components/organiser/event/attendee/RemoveAttendeeDialog";
import { FormResponsesTable } from "@/components/organiser/event/forms/FormResponsesTable";
import { EventData, EventId, EventMetadata, OrderId, TicketId } from "@/interfaces/EventTypes";
import { Form, FormId, FormResponse, FormResponseId } from "@/interfaces/FormTypes";
import { EMPTY_ORDER_DEFAULTS, Order, OrderAndTicketStatus, OrderAndTicketType } from "@/interfaces/OrderTypes";
import { EMPTY_TICKET, Ticket } from "@/interfaces/TicketTypes";
import { Logger } from "@/observability/logger";
import { ATTENDEE_CSV_HEADERS, buildAttendeeCsvData } from "@/services/src/attendee/attendeeCsvUtils";
import { addAttendee, setAttendeeTickets } from "@/services/src/attendee/attendeeService";
import { getEventById, getPurchaserEmailHash } from "@/services/src/events/eventsService";
import {
  getAttachedFormIdsForEvent,
  getSortedEventTicketTypes,
  hasEventTicketTypes,
  resolveCheckoutTicketTypeId,
  resolveEventInventory,
} from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import { clampTicketQuantity } from "@/services/src/events/eventsUtils/ticketLimits";
import { getForm, loadAttendeeFormResponse } from "@/services/src/forms/formsServices";
import {
  collectAttendeeFormResponseLookups,
  filterOrderTicketsMapByTicketType,
  ticketMatchesEventTicketType,
} from "@/services/src/forms/formsUtils/formsUtils";
import { approveBooking, rejectBooking } from "@/services/src/tickets/bookingApprovalsService";
import { getOrderById } from "@/services/src/tickets/orderService";
import { getTicketsByIds } from "@/services/src/tickets/ticketService";
import { getEntryFromOrderTicketsMapByOrderId } from "@/services/src/tickets/ticketUtils/ticketUtils";
import { getEventPriceDisplay } from "@/utilities/priceUtils";
import {
  ArrowPathIcon,
  CheckIcon,
  ChevronDownIcon,
  ExclamationCircleIcon,
  PlusIcon,
  TicketIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Timestamp } from "firebase/firestore";
import { Dispatch, FormEvent, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import toast, { ErrorIcon, ToastBar, Toaster } from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import { EventTicketTypeId } from "@/interfaces/EventTicketTypeTypes";
import { EventHubPanel } from "./EventHubPanel";
import {
  EventHubEmpty,
  EventHubFilters,
  EventHubGhostButton,
  EventHubInitials,
  EventHubPrimaryButton,
  EventHubStage,
} from "./EventHubStage";

type TabType = "approved" | "pending" | "declined";
type DeepPanel = "formResponses" | "editTickets" | null;

function countTicketsInOrderMap(
  orderTicketsMap: Map<Order, Ticket[]>,
  eventTicketTypeId?: EventTicketTypeId | null,
  ticketTypeName?: string | null
): number {
  let count = 0;
  orderTicketsMap.forEach((tickets) => {
    for (const ticket of tickets) {
      if (
        eventTicketTypeId &&
        !ticketMatchesEventTicketType(ticket, eventTicketTypeId, ticketTypeName)
      ) {
        continue;
      }
      count += 1;
    }
  });
  return count;
}

type EventHubAttendeesProps = {
  eventMetadata: EventMetadata;
  setEventMetadata: Dispatch<SetStateAction<EventMetadata>>;
  eventId: EventId;
  eventData: EventData;
  setEventVacancy: Dispatch<SetStateAction<number>>;
  /** Refresh hub inventory after attendee mutations that reload the event. */
  onEventRefresh?: (event: EventData) => void;
  orderTicketsMap: Map<Order, Ticket[]>;
  setOrderTicketsMap: Dispatch<SetStateAction<Map<Order, Ticket[]>>>;
};

const showFailureToastWithRefresh = (message: string, toastId: string) => {
  toast.custom(
    (t) => (
      <div className="flex flex-col gap-2 w-full pointer-events-auto rounded-xl border border-border bg-background text-foreground leading-snug p-4 max-w-md shadow-sm">
        <div className="flex items-center gap-3">
          <ErrorIcon />
          <span className="text-sm font-sans">{message}</span>
        </div>
        <button
          type="button"
          onClick={() => {
            toast.dismiss(t.id);
            window.location.reload();
          }}
          className="flex items-center gap-1 self-end px-2.5 py-1 text-xs font-medium rounded-lg bg-surface hover:bg-surface-hover transition-colors font-sans"
        >
          <ArrowPathIcon className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>
    ),
    { id: toastId, duration: 10000 }
  );
};

function AttendeeFormResponsesPanel({
  order,
  orderTicketsMap,
  eventData,
  eventMetadata,
}: {
  order: Order;
  orderTicketsMap: Map<Order, Ticket[]>;
  eventData: EventData;
  eventMetadata: EventMetadata;
}) {
  const logger = useMemo(() => new Logger("AttendeeFormResponsesPanel"), []);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groups, setGroups] = useState<
    { formId: FormId; form: Form; formResponses: FormResponse[] }[]
  >([]);

  const scopedMap = useMemo(() => {
    const entry = getEntryFromOrderTicketsMapByOrderId(orderTicketsMap, order.orderId);
    return entry ? new Map([entry]) : new Map<Order, Ticket[]>();
  }, [order.orderId, orderTicketsMap]);

  const lookups = useMemo(() => {
    const collected: ReturnType<typeof collectAttendeeFormResponseLookups> = [];
    const seen = new Set<FormResponseId>();
    scopedMap.forEach((tickets, scopedOrder) => {
      const legacyAttendee =
        eventMetadata.purchaserMap?.[getPurchaserEmailHash(scopedOrder.email)]?.attendees?.[
          scopedOrder.fullName
        ];
      const legacyIds = legacyAttendee?.formResponseIds ?? [];
      for (const lookup of collectAttendeeFormResponseLookups(eventData, tickets, legacyIds)) {
        if (seen.has(lookup.formResponseId)) {
          continue;
        }
        seen.add(lookup.formResponseId);
        collected.push(lookup);
      }
    });
    return collected;
  }, [eventData, eventMetadata.purchaserMap, scopedMap]);

  useEffect(() => {
    const fetchFormResponses = async () => {
      try {
        setLoading(true);
        setError(null);

        if (lookups.length === 0) {
          setGroups([]);
          setLoading(false);
          return;
        }

        const loaded = await Promise.all(
          lookups.map((lookup) =>
            loadAttendeeFormResponse(eventData, eventData.eventId, lookup.formResponseId, lookup.formId)
          )
        );

        const byFormId = new Map<FormId, FormResponse[]>();
        for (const item of loaded) {
          if (!item) {
            continue;
          }
          const existing = byFormId.get(item.formId) ?? [];
          existing.push(item.formResponse);
          byFormId.set(item.formId, existing);
        }

        const nextGroups: { formId: FormId; form: Form; formResponses: FormResponse[] }[] = [];
        for (const [formId, formResponses] of byFormId) {
          const form = await getForm(formId);
          nextGroups.push({ formId, form, formResponses });
        }
        setGroups(nextGroups);
      } catch (err) {
        logger.error(`Failed to load form responses: ${err}`);
        setError("Failed to load form responses");
      } finally {
        setLoading(false);
      }
    };

    void fetchFormResponses();
  }, [eventData, lookups, logger]);

  const hasAnyAttachedForm = getAttachedFormIdsForEvent(eventData).length > 0;

  if (loading) {
    return <p className="text-sm text-foreground-muted font-sans py-8 text-center">Loading form responses…</p>;
  }
  if (error) {
    return <p className="text-sm text-danger font-sans py-8 text-center">{error}</p>;
  }

  if (groups.length === 0) {
    return (
      <p className="text-sm text-foreground-muted font-sans py-8 text-center">
        {lookups.length === 0
          ? hasAnyAttachedForm
            ? "No form responses found for this attendee."
            : "No form is attached to this event."
          : "No form responses found for this attendee."}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-foreground-muted font-sans">{order.fullName || "Attendee"}</p>
      {groups.map((group) => (
        <div key={group.formId} className="space-y-2">
          {group.form.title ? (
            <p className="text-xs text-foreground-muted font-sans">Form: {group.form.title}</p>
          ) : null}
          <FormResponsesTable
            formResponses={group.formResponses}
            formId={group.formId}
            form={group.form}
            eventId={eventData.eventId}
            orderTicketsMap={scopedMap}
            showPurchaserColumn={false}
            flush
          />
        </div>
      ))}
    </div>
  );
}

function AttendeeEditTicketsPanel({
  order,
  tickets,
  eventId,
  eventData,
  setEventMetadata,
  setEventVacancy,
  onEventRefresh,
  setOrderTicketsMap,
  onClose,
}: {
  order: Order;
  tickets: Ticket[];
  eventId: EventId;
  eventData: EventData;
  setEventMetadata: Dispatch<SetStateAction<EventMetadata>>;
  setEventVacancy: Dispatch<SetStateAction<number>>;
  onEventRefresh?: (event: EventData) => void;
  setOrderTicketsMap: Dispatch<SetStateAction<Map<Order, Ticket[]>>>;
  onClose: () => void;
}) {
  const numTickets = tickets.length;
  const [newNumTickets, setNewNumTickets] = useState(String(numTickets));
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    setNewNumTickets(String(numTickets));
    setErrorMessage(null);
  }, [numTickets, order.orderId]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setErrorMessage(null);
      await setAttendeeTickets({
        eventId,
        orderId: order.orderId,
        numTickets: parseInt(newNumTickets, 10),
        eventTicketTypeId:
          tickets[0]?.eventTicketTypeId ?? resolveCheckoutTicketTypeId(eventData),
      });
      const updatedOrder = await getOrderById(order.orderId);
      const updatedTickets = await getTicketsByIds(updatedOrder.tickets);
      setOrderTicketsMap((prev) => {
        const next = new Map(prev);
        const [oldOrder] = Array.from(next.entries()).find(([o]) => o.orderId === order.orderId) ?? [];
        if (oldOrder) next.delete(oldOrder);
        next.set(updatedOrder, updatedTickets);
        return next;
      });
      const updatedEventData = await getEventById(eventId);
      if (onEventRefresh) {
        onEventRefresh(updatedEventData);
      } else {
        setEventVacancy(resolveEventInventory(updatedEventData).vacancy);
      }
      setEventMetadata((prev) => ({
        ...prev,
        completeTicketCount: prev.completeTicketCount - numTickets + parseInt(newNumTickets, 10),
      }));
      toast.success("Tickets updated");
      onClose();
    } catch (error) {
      setErrorMessage((error as Error).message || "Failed to edit tickets");
    } finally {
      setSaving(false);
    }
  };

  const ticketTypeId = tickets[0]?.eventTicketTypeId;
  const matchingTicketType =
    ticketTypeId != null ? eventData.eventTicketTypes?.[ticketTypeId] : undefined;
  const inventoryVacancy =
    matchingTicketType?.vacancy ?? resolveEventInventory(eventData).vacancy;

  return (
    <form id="event-hub-edit-tickets" className="space-y-4" onSubmit={handleSubmit}>
      {saving ? (
        <div className="flex justify-center py-10">
          <Loading inline={true} />
        </div>
      ) : (
        <>
          <p className="flex gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs text-foreground-secondary font-sans leading-relaxed">
            <ExclamationCircleIcon className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
            You’ll need to organise payment with this attendee separately to account for this change.
          </p>
          <p className="text-sm text-foreground-secondary font-sans">
            <span className="font-medium text-foreground">{order.email}</span> currently has{" "}
            <span className="font-medium text-foreground tabular-nums">{numTickets}</span> ticket
            {numTickets === 1 ? "" : "s"}.
          </p>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-foreground-muted font-sans">Number of tickets</span>
            <input
              type="number"
              required
              min={0}
              max={numTickets + inventoryVacancy}
              value={newNumTickets}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value)) {
                  setNewNumTickets(String(clampTicketQuantity(value, 0, numTickets + inventoryVacancy)));
                } else {
                  setNewNumTickets("0");
                }
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            />
          </label>
          {errorMessage ? <p className="text-sm text-danger font-sans">{errorMessage}</p> : null}
        </>
      )}
    </form>
  );
}

export function EventHubAttendees({
  eventMetadata,
  setEventMetadata,
  eventId,
  eventData,
  setEventVacancy,
  onEventRefresh,
  orderTicketsMap,
  setOrderTicketsMap,
}: EventHubAttendeesProps) {
  const logger = useMemo(() => new Logger("EventHubAttendees"), []);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addEmail, setAddEmail] = useState("");
  const [addName, setAddName] = useState("");
  const [addPhone, setAddPhone] = useState("");
  const [addTickets, setAddTickets] = useState("1");
  const [addSaving, setAddSaving] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);
  const ticketTypes = useMemo(
    () => getSortedEventTicketTypes(eventData.eventTicketTypes),
    [eventData.eventTicketTypes]
  );
  const eventInventory = useMemo(() => resolveEventInventory(eventData), [eventData]);
  const usesTicketTypes = hasEventTicketTypes(eventData);
  const showTypeSelector = usesTicketTypes && ticketTypes.length > 1;
  const showListTypeFilter = usesTicketTypes && ticketTypes.length > 1;
  const availableTicketTypes = useMemo(
    () => ticketTypes.filter((t) => t.eventTicketType.vacancy > 0),
    [ticketTypes]
  );
  const [addTicketTypeId, setAddTicketTypeId] = useState<EventTicketTypeId | null>(null);
  /** null = All ticket types */
  const [listTicketTypeId, setListTicketTypeId] = useState<EventTicketTypeId | null>(null);

  useEffect(() => {
    if (!showTypeSelector) {
      setAddTicketTypeId(null);
      return;
    }
    setAddTicketTypeId((prev) => {
      if (prev && availableTicketTypes.some((t) => t.eventTicketTypeId === prev)) {
        return prev;
      }
      return availableTicketTypes[0]?.eventTicketTypeId ?? null;
    });
  }, [showTypeSelector, availableTicketTypes]);

  useEffect(() => {
    if (!listTicketTypeId) {
      return;
    }
    if (!ticketTypes.some((t) => t.eventTicketTypeId === listTicketTypeId)) {
      setListTicketTypeId(null);
    }
  }, [listTicketTypeId, ticketTypes]);

  const selectedListTicketType = ticketTypes.find((t) => t.eventTicketTypeId === listTicketTypeId);

  const addTypeVacancy = showTypeSelector
    ? ticketTypes.find((t) => t.eventTicketTypeId === addTicketTypeId)?.eventTicketType.vacancy ?? 0
    : eventInventory.vacancy;
  const canAddAttendee = addTypeVacancy > 0;

  useEffect(() => {
    if (!canAddAttendee) {
      setAddTickets("0");
      return;
    }
    setAddTickets((prev) => {
      const current = parseInt(prev, 10);
      if (isNaN(current) || current < 1) return "1";
      return String(clampTicketQuantity(current, 1, addTypeVacancy));
    });
  }, [canAddAttendee, addTypeVacancy]);

  const [activeTab, setActiveTab] = useState<TabType>("pending");
  const [approvedMap, setApprovedMap] = useState<Map<Order, Ticket[]>>(new Map());
  const [pendingMap, setPendingMap] = useState<Map<Order, Ticket[]>>(new Map());
  const [declinedMap, setDeclinedMap] = useState<Map<Order, Ticket[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [expandedOrderId, setExpandedOrderId] = useState<OrderId | null>(null);
  const [deepPanel, setDeepPanel] = useState<DeepPanel>(null);
  const [panelOrder, setPanelOrder] = useState<Order | null>(null);
  const [removeOrder, setRemoveOrder] = useState<Order | null>(null);
  const [removeOpen, setRemoveOpen] = useState(false);
  const hasInitializedTabRef = useRef(false);

  useEffect(() => {
    setLoading(true);
    const approved = new Map<Order, Ticket[]>();
    const pending = new Map<Order, Ticket[]>();
    const declined = new Map<Order, Ticket[]>();

    orderTicketsMap.forEach((tickets, order) => {
      if (order.status === OrderAndTicketStatus.PENDING) {
        pending.set(order, tickets);
      } else if (order.status === OrderAndTicketStatus.REJECTED) {
        declined.set(order, tickets);
      } else if (order.status === OrderAndTicketStatus.APPROVED) {
        approved.set(
          order,
          tickets.filter((ticket) => ticket.status === OrderAndTicketStatus.APPROVED)
        );
      }
    });

    setApprovedMap(approved);
    setPendingMap(pending);
    setDeclinedMap(declined);
    setLoading(false);

    if (!hasInitializedTabRef.current) {
      setActiveTab(pending.size > 0 ? "pending" : "approved");
      hasInitializedTabRef.current = true;
    }
  }, [orderTicketsMap]);

  const deleteFromMapByOrderId = (map: Map<Order, Ticket[]>, orderId: string) => {
    const next = new Map(map);
    for (const [key] of next) {
      if (key.orderId === orderId) {
        next.delete(key);
        break;
      }
    }
    return next;
  };

  const moveOrderFromPending = (order: Order, tickets: Ticket[], targetStatus: OrderAndTicketStatus) => {
    setPendingMap((prev) => deleteFromMapByOrderId(prev, order.orderId));
    const updatedOrder: Order = { ...order, status: targetStatus };
    const ticketsWithStatus = tickets.map((t) => ({ ...t, status: targetStatus }));

    if (targetStatus === OrderAndTicketStatus.APPROVED) {
      setApprovedMap((prev) => {
        const next = new Map(prev);
        next.set(updatedOrder, ticketsWithStatus);
        return next;
      });
    } else if (targetStatus === OrderAndTicketStatus.REJECTED) {
      setDeclinedMap((prev) => {
        const next = new Map(prev);
        next.set(updatedOrder, ticketsWithStatus);
        return next;
      });
      setEventVacancy((prev) => prev + order.tickets.length);
    }

    setOrderTicketsMap((prev) => {
      const next = deleteFromMapByOrderId(prev, order.orderId);
      next.set(updatedOrder, ticketsWithStatus);
      return next;
    });
  };

  const handleApproveOrder = async (order: Order) => {
    const toastId = toast.loading("Approving order...");
    try {
      const response = await approveBooking(eventId, eventData.organiserId, order.orderId);
      const tickets = pendingMap.get(order) ?? [];
      if (response.success) {
        moveOrderFromPending(order, tickets, OrderAndTicketStatus.APPROVED);
        toast.success("Order approved", { id: toastId });
      } else {
        moveOrderFromPending(order, tickets, OrderAndTicketStatus.REJECTED);
        showFailureToastWithRefresh(
          response.message || "Order could not be approved and was declined.",
          toastId
        );
      }
    } catch (error) {
      logger.error(`Failed to approve order ${order.orderId}: ${error}`);
      showFailureToastWithRefresh("Failed to approve order. Try again or contact SPORTSHUB support.", toastId);
    }
  };

  const handleRejectOrder = async (order: Order) => {
    const toastId = toast.loading("Declining order...");
    try {
      const response = await rejectBooking(eventId, eventData.organiserId, order.orderId);
      const tickets = pendingMap.get(order) ?? [];
      moveOrderFromPending(order, tickets, OrderAndTicketStatus.REJECTED);
      if (response.success) {
        toast.success("Order declined", { id: toastId });
      } else {
        toast(response.message || "Order was already declined.", { id: toastId, icon: "⚠️" });
      }
    } catch (error) {
      logger.error(`Failed to decline order ${order.orderId}: ${error}`);
      showFailureToastWithRefresh("Failed to decline order. Try again or contact SPORTSHUB support.", toastId);
    }
  };

  const resetAddForm = () => {
    setAddEmail("");
    setAddName("");
    setAddPhone("");
    setAddTickets("1");
    setAddError(null);
    if (showTypeSelector) {
      setAddTicketTypeId(availableTicketTypes[0]?.eventTicketTypeId ?? null);
    }
  };

  const closeAddPanel = () => {
    setIsAddOpen(false);
    resetAddForm();
  };

  const closeDeepPanel = () => {
    setDeepPanel(null);
    setPanelOrder(null);
  };

  const handleAddAttendee = async (e: FormEvent) => {
    e.preventDefault();
    setAddSaving(true);
    setAddError(null);
    try {
      const qty = parseInt(addTickets, 10) || 0;
      if (addTypeVacancy <= 0 || qty <= 0 || qty > addTypeVacancy) {
        setAddError("No tickets available for the selected type");
        return;
      }
      const eventTicketTypeId =
        showTypeSelector && addTicketTypeId
          ? addTicketTypeId
          : resolveCheckoutTicketTypeId(eventData);
      const { orderId, ticketIds } = await addAttendee({
        eventId,
        email: addEmail,
        fullName: addName,
        phone: addPhone,
        numTickets: qty,
        price: 0,
        eventTicketTypeId,
      });
      const now = Timestamp.now();
      const newOrder: Order = {
        ...EMPTY_ORDER_DEFAULTS,
        orderId: orderId as OrderId,
        email: addEmail,
        fullName: addName,
        phone: addPhone,
        tickets: ticketIds as TicketId[],
        datePurchased: now,
        status: OrderAndTicketStatus.APPROVED,
        type: OrderAndTicketType.MANUAL,
      };
      const newTickets: Ticket[] = ticketIds.map((ticketId) => ({
        ...EMPTY_TICKET,
        ticketId: ticketId as TicketId,
        eventId,
        orderId: orderId as OrderId,
        purchaseDate: now,
        status: OrderAndTicketStatus.APPROVED,
        type: OrderAndTicketType.MANUAL,
        eventTicketTypeId,
      }));
      setOrderTicketsMap((prev) => new Map(prev).set(newOrder, newTickets));
      try {
        const updatedEventData = await getEventById(eventId);
        if (onEventRefresh) {
          onEventRefresh(updatedEventData);
        } else {
          setEventVacancy(resolveEventInventory(updatedEventData).vacancy);
        }
      } catch {
        setEventVacancy((prev) => Math.max(0, prev - qty));
      }
      setEventMetadata((prev) => ({
        ...prev,
        completeTicketCount: prev.completeTicketCount + qty,
      }));
      toast.success("Attendee added");
      closeAddPanel();
    } catch (error) {
      setAddError((error as Error).message || "Failed to add attendee");
    } finally {
      setAddSaving(false);
    }
  };

  const filteredApprovedMap = useMemo(() => {
    if (!usesTicketTypes || !listTicketTypeId) return approvedMap;
    return filterOrderTicketsMapByTicketType(
      approvedMap,
      listTicketTypeId,
      selectedListTicketType?.eventTicketType.name
    );
  }, [approvedMap, listTicketTypeId, selectedListTicketType, usesTicketTypes]);

  const filteredPendingMap = useMemo(() => {
    if (!usesTicketTypes || !listTicketTypeId) return pendingMap;
    return filterOrderTicketsMapByTicketType(
      pendingMap,
      listTicketTypeId,
      selectedListTicketType?.eventTicketType.name
    );
  }, [listTicketTypeId, pendingMap, selectedListTicketType, usesTicketTypes]);

  const filteredDeclinedMap = useMemo(() => {
    if (!usesTicketTypes || !listTicketTypeId) return declinedMap;
    return filterOrderTicketsMapByTicketType(
      declinedMap,
      listTicketTypeId,
      selectedListTicketType?.eventTicketType.name
    );
  }, [declinedMap, listTicketTypeId, selectedListTicketType, usesTicketTypes]);

  const activeMap =
    activeTab === "approved"
      ? filteredApprovedMap
      : activeTab === "pending"
        ? filteredPendingMap
        : filteredDeclinedMap;

  const orders = useMemo(() => {
    return Array.from(activeMap.keys()).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [activeMap]);

  const panelTickets = panelOrder
    ? Array.from(approvedMap.entries()).find(([o]) => o.orderId === panelOrder.orderId)?.[1] ??
      Array.from(orderTicketsMap.entries()).find(([o]) => o.orderId === panelOrder.orderId)?.[1] ??
      []
    : [];

  const approvedTicketCount = useMemo(
    () =>
      countTicketsInOrderMap(
        filteredApprovedMap,
        listTicketTypeId,
        selectedListTicketType?.eventTicketType.name
      ),
    [filteredApprovedMap, listTicketTypeId, selectedListTicketType]
  );
  const pendingTicketCount = useMemo(
    () =>
      countTicketsInOrderMap(
        filteredPendingMap,
        listTicketTypeId,
        selectedListTicketType?.eventTicketType.name
      ),
    [filteredPendingMap, listTicketTypeId, selectedListTicketType]
  );
  const declinedTicketCount = useMemo(
    () =>
      countTicketsInOrderMap(
        filteredDeclinedMap,
        listTicketTypeId,
        selectedListTicketType?.eventTicketType.name
      ),
    [filteredDeclinedMap, listTicketTypeId, selectedListTicketType]
  );

  const capacity = selectedListTicketType
    ? selectedListTicketType.eventTicketType.capacity
    : eventInventory.capacity;
  // Match the Approved tab — capacity−vacancy also counts pending holds and can drift across types.
  const goingCount = approvedTicketCount;
  const fillPercent = capacity > 0 ? Math.min(100, Math.round((goingCount / capacity) * 100)) : 0;
  const statusLabel =
    activeTab === "approved" ? "Going" : activeTab === "pending" ? "Pending" : "Declined";
  const approvedAttendeesCsvData = useMemo(
    () => buildAttendeeCsvData(filteredApprovedMap),
    [filteredApprovedMap]
  );

  return (
    <EventHubStage>
      <Toaster position="bottom-left">
        {(toastItem) => (
          <ToastBar toast={toastItem}>
            {({ icon, message }) => (
              <>
                <div className="shrink-0 flex items-center justify-center w-5 h-5">{icon}</div>
                {message}
              </>
            )}
          </ToastBar>
        )}
      </Toaster>

      <div className="pb-4 space-y-2">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground font-sans tabular-nums">
            {goingCount} Going
            {capacity > 0 ? (
              <span className="text-foreground-muted font-normal">
                {" "}
                · {capacity} capacity
                {selectedListTicketType ? ` · ${selectedListTicketType.eventTicketType.name}` : ""}
              </span>
            ) : null}
          </p>
          <DownloadCsvButton
            compact
            data={approvedAttendeesCsvData}
            headers={ATTENDEE_CSV_HEADERS}
            filename={`Attendees_${eventId}.csv`}
          />
        </div>
        <div
          className="h-1 w-full rounded-full bg-surface-muted overflow-hidden"
          role="progressbar"
          aria-valuenow={fillPercent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${goingCount} of ${capacity || "?"} going`}
        >
          <div
            className="h-full rounded-full bg-foreground-secondary transition-[width] duration-300 ease-out"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
      </div>

      <EventHubFilters
        activeId={activeTab}
        onChange={(id) => {
          setActiveTab(id as TabType);
          setExpandedOrderId(null);
        }}
        tabs={[
          { id: "approved", label: "Approved", count: approvedTicketCount },
          { id: "pending", label: "Pending", count: pendingTicketCount },
          { id: "declined", label: "Declined", count: declinedTicketCount },
        ]}
        action={
          <div className="flex items-center gap-2">
            {showListTypeFilter ? (
              <label className="relative inline-flex items-center">
                <span className="sr-only">Filter by ticket type</span>
                <TicketIcon
                  className="pointer-events-none absolute left-2.5 h-4 w-4 text-foreground-muted"
                  aria-hidden
                />
                <select
                  value={listTicketTypeId ?? ""}
                  onChange={(e) => {
                    const next = e.target.value;
                    setListTicketTypeId(next ? (next as EventTicketTypeId) : null);
                    setExpandedOrderId(null);
                  }}
                  className="max-w-[10.5rem] appearance-none rounded-xl border border-border bg-background py-2 pl-8 pr-7 text-sm text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                >
                  <option value="">All</option>
                  {ticketTypes.map(({ eventTicketTypeId, eventTicketType }) => (
                    <option key={eventTicketTypeId} value={eventTicketTypeId}>
                      {eventTicketType.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : null}
            <EventHubPrimaryButton onClick={() => setIsAddOpen(true)}>
              <PlusIcon className="h-4 w-4" aria-hidden />
              Add attendee
            </EventHubPrimaryButton>
          </div>
        }
      />

      <div className="pt-1">
        {loading ? (
          <div className="space-y-0 divide-y divide-border">
            {[0, 1, 2].map((i) => (
              <div key={i} className="py-3">
                <Skeleton height={44} className="rounded-lg" />
              </div>
            ))}
          </div>
        ) : orders.length === 0 ? (
          <EventHubEmpty>
            {activeTab === "approved"
              ? selectedListTicketType
                ? `No approved attendees for "${selectedListTicketType.eventTicketType.name}" yet.`
                : "No approved attendees yet. Add someone, or wait for bookings to come in."
              : activeTab === "pending"
                ? selectedListTicketType
                  ? `No pending bookings for "${selectedListTicketType.eventTicketType.name}".`
                  : "No pending bookings. New requests that need approval will show up here."
                : selectedListTicketType
                  ? `No declined bookings for "${selectedListTicketType.eventTicketType.name}".`
                  : "No declined bookings."}
          </EventHubEmpty>
        ) : (
          <ul className="divide-y divide-border -mx-1">
            {orders.map((order) => {
              const tickets = activeMap.get(order) ?? [];
              const expanded = expandedOrderId === order.orderId;
              const detailId = `attendee-detail-${order.orderId}`;
              const ticketLabel =
                tickets.length > 0
                  ? `${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`
                  : "";
              const ticketIds = tickets.length > 0 ? tickets.map((t) => t.ticketId) : order.tickets;

              return (
                <li key={order.orderId} className={`px-1 ${expanded ? "bg-surface-muted/50" : ""}`}>
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={detailId}
                    className={`flex w-full min-w-0 items-center gap-3 py-3.5 text-left rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                      expanded ? "" : "hover:bg-surface-hover/60"
                    }`}
                    onClick={() =>
                      setExpandedOrderId((prev) => (prev === order.orderId ? null : order.orderId))
                    }
                  >
                    <EventHubInitials name={order.fullName || "Attendee"} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground font-sans truncate">
                        {order.fullName || "Attendee"}
                      </p>
                      {order.type === OrderAndTicketType.MANUAL ? (
                        <p className="text-[10px] text-foreground-muted font-sans leading-tight">
                          Direct Addition
                        </p>
                      ) : null}
                      <p className="text-xs text-foreground-muted font-sans truncate">
                        {order.email || "—"}
                      </p>
                    </div>
                    {ticketLabel ? (
                      <span className="text-xs text-foreground-muted font-sans tabular-nums shrink-0 hidden sm:inline">
                        {ticketLabel}
                      </span>
                    ) : null}
                    <span
                      className={`text-xs font-medium font-sans shrink-0 rounded-full px-2 py-0.5 border ${
                        activeTab === "approved"
                          ? "border-border bg-surface text-foreground-secondary"
                          : activeTab === "pending"
                            ? "border-border bg-surface-muted text-foreground-secondary"
                            : "border-border bg-surface text-foreground-muted"
                      }`}
                    >
                      {statusLabel}
                    </span>
                    <ChevronDownIcon
                      className={`h-4 w-4 text-foreground-muted shrink-0 transition-transform duration-200 ease-out ${
                        expanded ? "rotate-180" : ""
                      }`}
                      aria-hidden
                    />
                  </button>

                  {expanded ? (
                    <div id={detailId} className="pb-3.5 pl-14 pr-1 space-y-3">
                      <dl className="space-y-2">
                        <div className="min-w-0">
                          <dt className="text-xs font-medium text-foreground-muted font-sans">Order ID</dt>
                          <dd className="mt-0.5 text-xs text-foreground font-mono break-all">
                            {!order.orderId.startsWith("legacy-") && !order.orderId.startsWith("manual-") ? (
                              <a
                                href={`/order/${order.orderId}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {order.orderId}
                              </a>
                            ) : (
                              order.orderId
                            )}
                          </dd>
                        </div>
                        <div className="min-w-0">
                          <dt className="text-xs font-medium text-foreground-muted font-sans">
                            Ticket ID{ticketIds.length === 1 ? "" : "s"}
                          </dt>
                          <dd className="mt-0.5 space-y-0.5">
                            {ticketIds.length > 0 ? (
                              ticketIds.map((id) => (
                                <p key={id} className="text-xs text-foreground font-mono break-all">
                                  {id}
                                </p>
                              ))
                            ) : (
                              <p className="text-xs text-foreground-muted font-sans">None</p>
                            )}
                          </dd>
                        </div>
                      </dl>

                      {activeTab === "pending" ? (
                        <div className="flex flex-wrap gap-2">
                          <EventHubPrimaryButton
                            onClick={() => {
                              void handleApproveOrder(order);
                              setExpandedOrderId(null);
                            }}
                          >
                            <CheckIcon className="h-3.5 w-3.5" aria-hidden />
                            Approve
                          </EventHubPrimaryButton>
                          <EventHubGhostButton
                            onClick={() => {
                              void handleRejectOrder(order);
                              setExpandedOrderId(null);
                            }}
                          >
                            <XMarkIcon className="h-3.5 w-3.5" aria-hidden />
                            Decline
                          </EventHubGhostButton>
                        </div>
                      ) : null}

                      <div className="flex items-center gap-x-2 border-t border-border pt-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setPanelOrder(order);
                            setDeepPanel("formResponses");
                          }}
                          className="shrink-0 text-xs font-medium text-foreground-secondary font-sans transition-colors hover:text-foreground"
                        >
                          View responses
                        </button>
                        {activeTab === "approved" ? (
                          <>
                            <span className="shrink-0 text-xs text-foreground-muted select-none" aria-hidden>
                              ·
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setPanelOrder(order);
                                setDeepPanel("editTickets");
                              }}
                              className="shrink-0 text-xs font-medium text-foreground-secondary font-sans transition-colors hover:text-foreground"
                            >
                              Edit tickets
                            </button>
                            <span className="min-w-2 flex-1" aria-hidden />
                            <button
                              type="button"
                              onClick={() => {
                                setRemoveOrder(order);
                                setRemoveOpen(true);
                              }}
                              className="shrink-0 text-xs font-medium text-danger font-sans transition-colors hover:underline"
                            >
                              Remove attendee
                            </button>
                          </>
                        ) : null}
                      </div>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <EventHubPanel
        open={deepPanel === "formResponses" && Boolean(panelOrder)}
        onClose={closeDeepPanel}
        title="Form responses"
        wide
      >
        {panelOrder && deepPanel === "formResponses" ? (
          <AttendeeFormResponsesPanel
            order={panelOrder}
            orderTicketsMap={orderTicketsMap}
            eventData={eventData}
            eventMetadata={eventMetadata}
          />
        ) : null}
      </EventHubPanel>

      <EventHubPanel
        open={deepPanel === "editTickets" && Boolean(panelOrder)}
        onClose={closeDeepPanel}
        title="Edit tickets"
        footer={
          <EventHubPrimaryButton type="submit" form="event-hub-edit-tickets">
            <CheckIcon className="h-4 w-4" aria-hidden />
            Save tickets
          </EventHubPrimaryButton>
        }
      >
        {panelOrder && deepPanel === "editTickets" ? (
          <AttendeeEditTicketsPanel
            order={panelOrder}
            tickets={panelTickets}
            eventId={eventId}
            eventData={eventData}
            setEventMetadata={setEventMetadata}
            setEventVacancy={setEventVacancy}
            onEventRefresh={onEventRefresh}
            setOrderTicketsMap={setOrderTicketsMap}
            onClose={closeDeepPanel}
          />
        ) : null}
      </EventHubPanel>

      <EventHubPanel
        open={isAddOpen}
        onClose={closeAddPanel}
        title="Add attendee"
        footer={
          <EventHubPrimaryButton
            type="submit"
            form="event-hub-add-attendee"
            disabled={addSaving || !canAddAttendee}
          >
            <CheckIcon className="h-4 w-4" aria-hidden />
            {addSaving ? "Adding…" : "Add attendee"}
          </EventHubPrimaryButton>
        }
      >
        <form id="event-hub-add-attendee" className="space-y-4" onSubmit={handleAddAttendee}>
          <p className="flex gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-xs text-foreground-secondary font-sans leading-relaxed">
            <ExclamationCircleIcon className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
            You’ll need to organise payment with this attendee separately — this adds them as approved at no charge.
          </p>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-foreground-muted font-sans">Email</span>
            <input
              type="email"
              required
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-foreground-muted font-sans">Name</span>
            <input
              type="text"
              required
              value={addName}
              onChange={(e) => setAddName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            />
          </label>
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-foreground-muted font-sans">Mobile (04…)</span>
            <input
              type="tel"
              pattern="04[0-9]{8}"
              value={addPhone}
              onChange={(e) => setAddPhone(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            />
          </label>
          {showTypeSelector && (
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-foreground-muted font-sans">Ticket type</span>
              <select
                required
                value={addTicketTypeId ?? ""}
                disabled={availableTicketTypes.length === 0}
                onChange={(e) => setAddTicketTypeId(e.target.value as EventTicketTypeId)}
                className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50"
              >
                {availableTicketTypes.length === 0 ? (
                  <option value="">No tickets available</option>
                ) : (
                  availableTicketTypes.map(({ eventTicketTypeId, eventTicketType }) => (
                    <option key={eventTicketTypeId} value={eventTicketTypeId}>
                      {eventTicketType.name} — {getEventPriceDisplay(eventTicketType.price)} ·{" "}
                      {eventTicketType.vacancy} left
                    </option>
                  ))
                )}
              </select>
            </label>
          )}
          {!canAddAttendee ? (
            <p className="text-sm text-danger font-sans">No tickets available to add.</p>
          ) : null}
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-foreground-muted font-sans">Tickets</span>
            <input
              type="number"
              required
              min={1}
              max={addTypeVacancy}
              value={addTickets}
              disabled={!canAddAttendee}
              onChange={(e) => {
                const value = parseInt(e.target.value, 10);
                if (!isNaN(value) && addTypeVacancy > 0) {
                  setAddTickets(String(clampTicketQuantity(value, 1, addTypeVacancy)));
                } else {
                  setAddTickets(canAddAttendee ? "1" : "0");
                }
              }}
              className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:opacity-50"
            />
          </label>
          {addError ? <p className="text-sm text-danger font-sans">{addError}</p> : null}
        </form>
      </EventHubPanel>

      {removeOrder ? (
        <RemoveAttendeeDialog
          setIsRemoveAttendeeModalOpen={setRemoveOpen}
          closeModal={() => {
            setRemoveOpen(false);
            setRemoveOrder(null);
          }}
          isRemoveAttendeeModalOpen={removeOpen}
          order={removeOrder}
          tickets={
            Array.from(approvedMap.entries()).find(([o]) => o.orderId === removeOrder.orderId)?.[1] ??
            Array.from(orderTicketsMap.entries()).find(([o]) => o.orderId === removeOrder.orderId)?.[1] ??
            []
          }
          eventId={eventId}
          eventData={eventData}
          setEventMetadata={setEventMetadata}
          setEventVacancy={setEventVacancy}
          setOrderTicketsMap={setOrderTicketsMap}
        />
      ) : null}
    </EventHubStage>
  );
}
