import { EventData, EventMetadata } from "@/interfaces/EventTypes";
import { Order, OrderAndTicketStatus } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { Logger } from "@/observability/logger";
import { approveBooking, rejectBooking } from "@/services/src/tickets/bookingApprovalService";
import { getEntryFromOrderTicketsMapByOrderId } from "@/services/src/tickets/ticketUtils/ticketUtils";
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import InviteAttendeeDialog from "./AddAttendeeDialog";
import { ViewAttendeeFormResponsesDialog } from "./ViewAttendeeFormResponsesDialog";
import { ApprovedAttendeeTab } from "./tabs/ApprovedAttendeeTab";
import { PendingAttendeeTab } from "./tabs/PendingAttendeeTab";
import { RejectedAttendeeTab } from "./tabs/RejectedAttendeeTab";

interface EventDrilldownManageAttendeesPageProps {
  eventMetadata: EventMetadata;
  eventId: string;
  eventData: EventData;
  setEventVacancy: Dispatch<SetStateAction<number>>;
  setEventMetadata: React.Dispatch<React.SetStateAction<EventMetadata>>;
  orderTicketsMap: Map<Order, Ticket[]>;
}

type TabType = "approved" | "pending" | "rejected";

export const EventDrilldownManageAttendeesPage = ({
  eventMetadata,
  eventId,
  eventData,
  setEventVacancy,
  setEventMetadata,
  orderTicketsMap,
}: EventDrilldownManageAttendeesPageProps) => {
  const logger = new Logger("EventDrilldownManageAttendeesPage");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>("approved");
  const [approvedOrderTicketsMap, setApprovedOrderTicketsMap] = useState<Map<Order, Ticket[]>>(new Map());
  const [loadingApprovedOrders, setLoadingApprovedOrders] = useState<boolean>(false);
  const [pendingOrderTicketsMap, setPendingOrderTicketsMap] = useState<Map<Order, Ticket[]>>(new Map());
  const [loadingPendingOrders, setLoadingPendingOrders] = useState<boolean>(false);
  const [rejectedOrderTicketsMap, setRejectedOrderTicketsMap] = useState<Map<Order, Ticket[]>>(new Map());
  const [loadingRejectedOrders, setLoadingRejectedOrders] = useState<boolean>(false);
  const [selectedOrderForFormResponses, setSelectedOrderForFormResponses] = useState<Order | null>(null);
  const hasInitializedTabRef = useRef<boolean>(false);

  console.log(orderTicketsMap)
  console.log(Array.from(orderTicketsMap.keys())[0])

  function closeModal() {
    setIsFilterModalOpen(false);
  }

  // Fetch pending orders
  useEffect(() => {
    const fetchPendingOrders = () => {
      if (orderTicketsMap.size === 0) {
        setPendingOrderTicketsMap(new Map());
        if (!hasInitializedTabRef.current) {
          setActiveTab("approved");
          hasInitializedTabRef.current = true;
        }
        return;
      }

      setLoadingPendingOrders(true);
      try {
        const pendingMap = new Map<Order, Ticket[]>();
        orderTicketsMap.forEach((tickets, order) => {
          if (order.status === OrderAndTicketStatus.PENDING) {
            pendingMap.set(order, tickets);
          }
        });

        setPendingOrderTicketsMap(pendingMap);

        // Set initial tab based on pending orders only on first load
        if (!hasInitializedTabRef.current) {
          setActiveTab(pendingMap.size > 0 ? "pending" : "approved");
          hasInitializedTabRef.current = true;
        }
      } catch (error) {
        logger.error(`Error fetching pending orders: ${error}`);
        setPendingOrderTicketsMap(new Map());
        if (!hasInitializedTabRef.current) {
          setActiveTab("approved");
          hasInitializedTabRef.current = true;
        }
      } finally {
        setLoadingPendingOrders(false);
      }
    };

    const fetchApprovedOrders = () => {
      if (orderTicketsMap.size === 0) {
        setApprovedOrderTicketsMap(new Map());
        return;
      }

      setLoadingApprovedOrders(true);
      try {
        const approvedMap = new Map<Order, Ticket[]>();
        orderTicketsMap.forEach((tickets, order) => {
          if (order.status === OrderAndTicketStatus.APPROVED) {
            approvedMap.set(order, tickets);
          }
        });
        console.log("approvedMap", approvedMap);
        setApprovedOrderTicketsMap(approvedMap);
      } catch (error) {
        logger.error(`Error fetching approved orders: ${error}`);
        setApprovedOrderTicketsMap(new Map());
      } finally {
        setLoadingApprovedOrders(false);
      }
    };

    const fetchRejectedOrders = () => {
      if (orderTicketsMap.size === 0) {
        setRejectedOrderTicketsMap(new Map());
        return;
      }

      setLoadingRejectedOrders(true);
      try {
        const rejectedMap = new Map<Order, Ticket[]>();
        orderTicketsMap.forEach((tickets, order) => {
          if (order.status === OrderAndTicketStatus.REJECTED) {
            rejectedMap.set(order, tickets);
          }
        });

        setRejectedOrderTicketsMap(rejectedMap);
      } catch (error) {
        logger.error(`Error fetching rejected orders: ${error}`);
        setRejectedOrderTicketsMap(new Map());
      } finally {
        setLoadingRejectedOrders(false);
      }
    };

    fetchPendingOrders();
    fetchApprovedOrders();
    fetchRejectedOrders();
  }, [orderTicketsMap]);

  const pendingOrdersCount = pendingOrderTicketsMap.size;

  const moveOrderFromPending = (order: Order, tickets: Ticket[], targetStatus: OrderAndTicketStatus) => {
    // Remove from pending
    const newPendingMap = new Map(pendingOrderTicketsMap);
    newPendingMap.delete(order);
    setPendingOrderTicketsMap(newPendingMap);

    // Add to target map with updated status
    const updatedOrder: Order = { ...order, status: targetStatus };
    if (targetStatus === OrderAndTicketStatus.APPROVED) {
      const newApprovedMap = new Map(approvedOrderTicketsMap);
      newApprovedMap.set(updatedOrder, tickets);
      setApprovedOrderTicketsMap(newApprovedMap);
    } else if (targetStatus === OrderAndTicketStatus.REJECTED) {
      const newRejectedMap = new Map(rejectedOrderTicketsMap);
      newRejectedMap.set(updatedOrder, tickets);
      setRejectedOrderTicketsMap(newRejectedMap);
    }
  };

  const handleApproveOrder = async (order: Order) => {
    logger.info(`Approving order: ${order.orderId}`);
    const toastId = toast.loading("Approving order...");
    try {
      const response = await approveBooking(eventId, eventData.organiserId, order.orderId);
      const tickets = pendingOrderTicketsMap.get(order) ?? [];

      if (response.success) {
        moveOrderFromPending(order, tickets, OrderAndTicketStatus.APPROVED);
        toast.success("Order approved successfully", { id: toastId });
      } else {
        // Backend returned 200 but the order could not be approved as expected
        // e.g. PaymentIntent expired → order was automatically rejected
        moveOrderFromPending(order, tickets, OrderAndTicketStatus.REJECTED);
        toast.error(
          response.message || "Order could not be approved and has been moved to rejected.",
          { id: toastId }
        );
      }

      logger.info(`Approve order response: ${JSON.stringify(response)}`);
    } catch (error) {
      logger.error(`Failed to approve order ${order.orderId}: ${error}`);
      toast.error("Failed to approve order. Please try again and contact SPORTSHUB support if the problem persists.", { id: toastId });
    }
  };

  const handleRejectOrder = async (order: Order) => {
    logger.info(`Rejecting order: ${order.orderId}`);
    const toastId = toast.loading("Rejecting order...");
    try {
      const response = await rejectBooking(eventId, eventData.organiserId, order.orderId);
      const tickets = pendingOrderTicketsMap.get(order) ?? [];

      if (response.success) {
        moveOrderFromPending(order, tickets, OrderAndTicketStatus.REJECTED);
        toast.success("Order rejected successfully", { id: toastId });
      } else {
        // Backend returned 200 but the payment had already expired/been canceled
        // The order was still moved to rejected, which is the intended outcome
        moveOrderFromPending(order, tickets, OrderAndTicketStatus.REJECTED);
        toast(
          response.message || "Order was already rejected due to payment expiry.",
          { id: toastId, icon: "⚠️" }
        );
      }

      logger.info(`Reject order response: ${JSON.stringify(response)}`);
    } catch (error) {
      logger.error(`Failed to reject order ${order.orderId}: ${error}`);
      toast.error("Failed to reject order. Please try again and contact SPORTSHUB support if the problem persists.", { id: toastId });
    }
  };

  return (
    <div className="flex flex-col space-y-4 mb-6 w-full p-1 pt-3 md:p-0">
      <Toaster
        position="bottom-left"
        toastOptions={{
          duration: 10000,
          style: {
            fontSize: "16px",
            maxWidth: "500px",
            padding: "16px 20px",
          },
        }}
      />
      {/* Tabs */}
      <div className="flex md:space-x-1 border-b border-gray-300">
        <button
          onClick={() => setActiveTab("approved")}
          className={`basis-1/3 md:basis-auto px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-colors relative text-center ${
            activeTab === "approved"
              ? "text-black border-b-2 border-black"
              : "text-organiser-title-gray-text hover:text-black"
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`basis-1/3 md:basis-auto px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-colors relative text-center ${
            activeTab === "pending"
              ? "text-black border-b-2 border-black"
              : "text-organiser-title-gray-text hover:text-black"
          }`}
        >
          Pending
          {pendingOrdersCount > 0 && (
            <span className="ml-1 md:ml-2 inline-flex items-center justify-center w-4 h-4 md:w-5 md:h-5 text-[10px] md:text-xs font-bold text-white bg-black rounded-full">
              {pendingOrdersCount}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("rejected")}
          className={`basis-1/3 md:basis-auto px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-colors relative text-center ${
            activeTab === "rejected"
              ? "text-black border-b-2 border-black"
              : "text-organiser-title-gray-text hover:text-black"
          }`}
        >
          Rejected
        </button>
      </div>

      {/* Attendees Tab Content */}
      {activeTab === "approved" && (
        <ApprovedAttendeeTab
          approvedOrderTicketsMap={approvedOrderTicketsMap}
          eventMetadata={eventMetadata}
          eventId={eventId}
          loadingApprovedOrders={loadingApprovedOrders}
          setEventVacancy={setEventVacancy}
          setEventMetadata={setEventMetadata}
          setIsFilterModalOpen={setIsFilterModalOpen}
          setSelectedOrderForFormResponses={(order: Order) => setSelectedOrderForFormResponses(order)}
        />
      )}

      {/* Pending Tab Content */}
      {activeTab === "pending" && (
        <PendingAttendeeTab
          pendingOrderTicketsMap={pendingOrderTicketsMap}
          loadingPendingOrders={loadingPendingOrders}
          onApproveOrder={handleApproveOrder}
          onRejectOrder={handleRejectOrder}
          setSelectedOrderForFormResponses={(order: Order) => setSelectedOrderForFormResponses(order)}
        />
      )}

      {/* Rejected Tab Content */}
      {activeTab === "rejected" && (
        <RejectedAttendeeTab
          rejectedOrderTicketsMap={rejectedOrderTicketsMap}
          eventId={eventId}
          loadingRejectedOrders={loadingRejectedOrders}
          setSelectedOrderForFormResponses={(order: Order) => setSelectedOrderForFormResponses(order)}
        />
      )}
      <div className="grow">
        <InviteAttendeeDialog
          setIsFilterModalOpen={setIsFilterModalOpen}
          closeModal={closeModal}
          isFilterModalOpen={isFilterModalOpen}
          eventId={eventId}
          setEventMetadata={setEventMetadata}
          setEventVacancy={setEventVacancy}
        />
        {selectedOrderForFormResponses && (
          <ViewAttendeeFormResponsesDialog
            onClose={() => {
              setSelectedOrderForFormResponses(null);
            }}
            orderTicketsMap={new Map([getEntryFromOrderTicketsMapByOrderId(orderTicketsMap, selectedOrderForFormResponses.orderId)!])}
            eventData={eventData}
            eventMetadata={eventMetadata}
          />
        )}
      </div>
    </div>
  );
};
