"use client";

import InviteAttendeeDialog from "@/components/organiser/event/attendee/AddAttendeeDialog";
import { EditAttendeeTicketsDialog } from "@/components/organiser/event/attendee/EditAttendeeTicketsDialog";
import RemoveAttendeeDialog from "@/components/organiser/event/attendee/RemoveAttendeeDialog";
import { ViewAttendeeFormResponsesDialog } from "@/components/organiser/event/attendee/ViewAttendeeFormResponsesDialog";
import { EventData, EventId, EventMetadata } from "@/interfaces/EventTypes";
import { Order, OrderAndTicketStatus } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { Logger } from "@/observability/logger";
import { approveBooking, rejectBooking } from "@/services/src/tickets/bookingApprovalsService";
import { getEntryFromOrderTicketsMapByOrderId } from "@/services/src/tickets/ticketUtils/ticketUtils";
import {
  ArrowPathIcon,
  CheckIcon,
  ChevronRightIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from "react";
import toast, { ErrorIcon, ToastBar, Toaster } from "react-hot-toast";
import Skeleton from "react-loading-skeleton";
import {
  EventHubEmpty,
  EventHubFilters,
  EventHubGhostButton,
  EventHubInitials,
  EventHubPrimaryButton,
  EventHubStage,
} from "./EventHubStage";

type TabType = "approved" | "pending" | "declined";

type EventHubAttendeesProps = {
  eventMetadata: EventMetadata;
  setEventMetadata: Dispatch<SetStateAction<EventMetadata>>;
  eventId: EventId;
  eventData: EventData;
  setEventVacancy: Dispatch<SetStateAction<number>>;
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

function handleFromEmail(email: string): string {
  const local = email.split("@")[0]?.trim();
  return local ? `@${local}` : email;
}

export function EventHubAttendees({
  eventMetadata,
  setEventMetadata,
  eventId,
  eventData,
  setEventVacancy,
  orderTicketsMap,
  setOrderTicketsMap,
}: EventHubAttendeesProps) {
  const logger = useMemo(() => new Logger("EventHubAttendees"), []);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("approved");
  const [approvedMap, setApprovedMap] = useState<Map<Order, Ticket[]>>(new Map());
  const [pendingMap, setPendingMap] = useState<Map<Order, Ticket[]>>(new Map());
  const [declinedMap, setDeclinedMap] = useState<Map<Order, Ticket[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [selectedOrderForFormResponses, setSelectedOrderForFormResponses] = useState<Order | null>(null);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [editTicketsOrder, setEditTicketsOrder] = useState<Order | null>(null);
  const [removeOrder, setRemoveOrder] = useState<Order | null>(null);
  const [editTicketsOpen, setEditTicketsOpen] = useState(false);
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

  const activeMap =
    activeTab === "approved" ? approvedMap : activeTab === "pending" ? pendingMap : declinedMap;

  const orders = useMemo(() => {
    return Array.from(activeMap.keys()).sort((a, b) => a.fullName.localeCompare(b.fullName));
  }, [activeMap]);

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

      <EventHubFilters
        activeId={activeTab}
        onChange={(id) => {
          setActiveTab(id as TabType);
          setExpandedOrderId(null);
        }}
        tabs={[
          { id: "approved", label: "Approved", count: approvedMap.size },
          { id: "pending", label: "Pending", count: pendingMap.size },
          { id: "declined", label: "Declined", count: declinedMap.size },
        ]}
        action={
          <EventHubPrimaryButton onClick={() => setIsAddOpen(true)}>
            <PlusIcon className="h-4 w-4" aria-hidden />
            Add attendee
          </EventHubPrimaryButton>
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
              ? "No approved attendees yet. Add someone, or wait for bookings to come in."
              : activeTab === "pending"
                ? "No pending bookings. New requests that need approval will show up here."
                : "No declined bookings."}
          </EventHubEmpty>
        ) : (
          <ul className="divide-y divide-border -mx-1">
            {orders.map((order) => {
              const tickets = activeMap.get(order) ?? [];
              const expanded = expandedOrderId === order.orderId;
              const ticketLabel =
                tickets.length > 0
                  ? `${tickets.length} ticket${tickets.length === 1 ? "" : "s"}`
                  : "";

              return (
                <li key={order.orderId} className="px-1">
                  <button
                    type="button"
                    className={`flex w-full min-w-0 items-center gap-3 py-3.5 text-left rounded-lg transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                      expanded ? "bg-surface-muted/70" : "hover:bg-surface-hover/60"
                    }`}
                    onClick={() => setExpandedOrderId(expanded ? null : order.orderId)}
                    aria-expanded={expanded}
                  >
                    <EventHubInitials name={order.fullName || "Attendee"} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground font-sans truncate">
                        {order.fullName || "Attendee"}
                      </p>
                      <p className="text-xs text-foreground-muted font-sans truncate">
                        {handleFromEmail(order.email)}
                      </p>
                    </div>
                    {ticketLabel ? (
                      <span className="text-xs text-foreground-muted font-sans tabular-nums shrink-0 hidden sm:inline">
                        {ticketLabel}
                      </span>
                    ) : null}
                    <ChevronRightIcon
                      className={`h-4 w-4 text-foreground-muted shrink-0 transition-transform duration-200 ease-out ${
                        expanded ? "rotate-90" : ""
                      }`}
                      aria-hidden
                    />
                  </button>

                  <div
                    className={`grid transition-[grid-template-rows,opacity] duration-200 ease-out ${
                      expanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`}
                  >
                    <div className="overflow-hidden">
                      {expanded ? (
                        <div className="pb-4 pt-1 pl-[3.25rem] space-y-3">
                          {ticketLabel ? (
                            <p className="text-xs text-foreground-muted font-sans sm:hidden">{ticketLabel}</p>
                          ) : null}

                          {activeTab === "pending" ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <EventHubPrimaryButton onClick={() => handleApproveOrder(order)}>
                                <CheckIcon className="h-3.5 w-3.5" aria-hidden />
                                Approve
                              </EventHubPrimaryButton>
                              <EventHubGhostButton onClick={() => handleRejectOrder(order)}>
                                <XMarkIcon className="h-3.5 w-3.5" aria-hidden />
                                Decline
                              </EventHubGhostButton>
                              <button
                                type="button"
                                onClick={() => setSelectedOrderForFormResponses(order)}
                                className="text-xs font-medium text-foreground-muted font-sans hover:text-foreground px-2 py-1.5 transition-colors"
                              >
                                Form responses
                              </button>
                            </div>
                          ) : null}

                          {activeTab === "approved" ? (
                            <div className="flex flex-wrap items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedOrderForFormResponses(order)}
                                className="text-xs font-medium text-foreground-secondary font-sans hover:text-foreground px-2 py-1.5 transition-colors"
                              >
                                Form responses
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditTicketsOrder(order);
                                  setEditTicketsOpen(true);
                                }}
                                className="text-xs font-medium text-foreground-secondary font-sans hover:text-foreground px-2 py-1.5 transition-colors"
                              >
                                Edit tickets
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRemoveOrder(order);
                                  setRemoveOpen(true);
                                }}
                                className="text-xs font-medium text-danger font-sans hover:underline px-2 py-1.5 transition-colors"
                              >
                                Remove
                              </button>
                            </div>
                          ) : null}

                          {activeTab === "declined" ? (
                            <button
                              type="button"
                              onClick={() => setSelectedOrderForFormResponses(order)}
                              className="text-xs font-medium text-foreground-muted font-sans hover:text-foreground px-1 py-1.5 transition-colors"
                            >
                              Form responses
                            </button>
                          ) : null}

                          <p className="text-xs text-foreground-muted font-sans truncate">{order.email}</p>
                        </div>
                      ) : null}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <InviteAttendeeDialog
        eventData={eventData}
        setEventMetadata={setEventMetadata}
        setIsFilterModalOpen={setIsAddOpen}
        closeModal={() => setIsAddOpen(false)}
        isFilterModalOpen={isAddOpen}
        eventId={eventId}
        setOrderTicketsMap={setOrderTicketsMap}
        setEventVacancy={setEventVacancy}
      />
      {selectedOrderForFormResponses ? (
        <ViewAttendeeFormResponsesDialog
          onClose={() => setSelectedOrderForFormResponses(null)}
          orderTicketsMap={
            new Map([getEntryFromOrderTicketsMapByOrderId(orderTicketsMap, selectedOrderForFormResponses.orderId)!])
          }
          eventData={eventData}
          eventMetadata={eventMetadata}
        />
      ) : null}
      {editTicketsOrder ? (
        <EditAttendeeTicketsDialog
          setIsEditAttendeeTicketsDialogModalOpen={setEditTicketsOpen}
          closeModal={() => {
            setEditTicketsOpen(false);
            setEditTicketsOrder(null);
          }}
          isEditAttendeeTicketsDialogModalOpen={editTicketsOpen}
          order={editTicketsOrder}
          tickets={
            Array.from(approvedMap.entries()).find(([o]) => o.orderId === editTicketsOrder.orderId)?.[1] ??
            Array.from(orderTicketsMap.entries()).find(([o]) => o.orderId === editTicketsOrder.orderId)?.[1] ??
            []
          }
          eventId={eventId}
          eventData={eventData}
          setEventMetadata={setEventMetadata}
          setEventVacancy={setEventVacancy}
          setOrderTicketsMap={setOrderTicketsMap}
        />
      ) : null}
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
