import { EventData, EventMetadata } from "@/interfaces/EventTypes";
import { Order, OrderAndTicketStatus } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import React, { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import InviteAttendeeDialog from "./AddAttendeeDialog";
import { ViewAttendeeFormResponsesDialog } from "./ViewAttendeeFormResponsesDialog";
import { ApprovedAttendeeTab } from "./tabs/ApprovedAttendeeTab";
import { PendingAttendeeTab } from "./tabs/PendingAttendeeTab";
import { Logger } from "@/observability/logger";

interface EventDrilldownManageAttendeesPageProps {
  eventMetadata: EventMetadata;
  eventId: string;
  eventData: EventData;
  setEventVacancy: Dispatch<SetStateAction<number>>;
  setEventMetadata: React.Dispatch<React.SetStateAction<EventMetadata>>;
  orderTicketsMap: Map<Order, Ticket[]>;
}

type TabType = "approved" | "pending";

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
  const [approvedOrders, setApprovedOrders] = useState<Order[]>([]);
  const [loadingApprovedOrders, setLoadingApprovedOrders] = useState<boolean>(false);
  const [pendingOrders, setPendingOrders] = useState<Order[]>([]);
  const [loadingPendingOrders, setLoadingPendingOrders] = useState<boolean>(false);
  const [selectedOrderForFormResponses, setSelectedOrderForFormResponses] = useState<Order | null>(null);
  const hasInitializedTabRef = useRef<boolean>(false);

  function closeModal() {
    setIsFilterModalOpen(false);
  }

  // Fetch pending orders
  useEffect(() => {
    const fetchPendingOrders = async () => {
      if (orderTicketsMap.size === 0) {
        setPendingOrders([]);
        if (!hasInitializedTabRef.current) {
          setActiveTab("approved");
          hasInitializedTabRef.current = true;
        }
        return;
      }

      setLoadingPendingOrders(true);
      try {
        const orders = Array.from(orderTicketsMap.keys());
        const pending = orders.filter((order) => order.status === OrderAndTicketStatus.PENDING);
        setPendingOrders(pending);

        // Set initial tab based on pending orders only on first load
        if (!hasInitializedTabRef.current) {
          setActiveTab(pending.length > 0 ? "pending" : "approved");
          hasInitializedTabRef.current = true;
        }
      } catch (error) {
        logger.error(`Error fetching pending orders: ${error}`);
        setPendingOrders([]);
        if (!hasInitializedTabRef.current) {
          setActiveTab("approved");
          hasInitializedTabRef.current = true;
        }
      } finally {
        setLoadingPendingOrders(false);
      }
    };

    const fetchApprovedOrders = async () => {
      if (orderTicketsMap.size === 0) {
        setApprovedOrders([]);
        return;
      }

      setLoadingApprovedOrders(true);
      try {
        const orders = Array.from(orderTicketsMap.keys());
        const approved = orders.filter((order) => order.status === OrderAndTicketStatus.APPROVED);
        setApprovedOrders(approved);
      } catch (error) {
        logger.error(`Error fetching approved orders: ${error}`);
        setApprovedOrders([]);
      } finally {
        setLoadingApprovedOrders(false);
      }
    };

    fetchPendingOrders();
    fetchApprovedOrders();
  }, [orderTicketsMap]);

  const pendingOrdersCount = pendingOrders.length;

  const handleApproveOrder = async (order: Order) => {};

  const handleRejectOrder = async (order: Order) => {};

  return (
    <div className="flex flex-col space-y-4 mb-6 w-full p-1 pt-3 md:p-0">
      {/* Tabs */}
      <div className="flex md:space-x-1 border-b border-gray-300">
        <button
          onClick={() => setActiveTab("approved")}
          className={`basis-1/2 md:basis-auto px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-colors relative text-center ${
            activeTab === "approved"
              ? "text-black border-b-2 border-black"
              : "text-organiser-title-gray-text hover:text-black"
          }`}
        >
          Approved
        </button>
        <button
          onClick={() => setActiveTab("pending")}
          className={`basis-1/2 md:basis-auto px-2 md:px-4 py-1.5 md:py-2 text-xs md:text-sm font-medium transition-colors relative text-center ${
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
      </div>

      {/* Attendees Tab Content */}
      {activeTab === "approved" && (
        <ApprovedAttendeeTab
          approvedOrders={approvedOrders}
          eventMetadata={eventMetadata}
          eventId={eventId}
          loadingApprovedOrders={loadingApprovedOrders}
          setEventVacancy={setEventVacancy}
          setEventMetadata={setEventMetadata}
          setIsFilterModalOpen={setIsFilterModalOpen}
          onViewFormResponses={(order: Order) => setSelectedOrderForFormResponses(order)}
        />
      )}

      {/* Pending Tab Content */}
      {activeTab === "pending" && (
        <PendingAttendeeTab
          eventMetadata={eventMetadata}
          eventId={eventId}
          pendingOrders={pendingOrders}
          loadingPendingOrders={loadingPendingOrders}
          onApproveOrder={handleApproveOrder}
          onRejectOrder={handleRejectOrder}
          setSelectedOrderForFormResponses={setSelectedOrderForFormResponses}
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
            attendeeName={selectedOrderForFormResponses?.fullName}
            attendeeEmail={selectedOrderForFormResponses?.email}
            eventData={eventData}
            eventMetadata={eventMetadata}
          />
        )}
      </div>
    </div>
  );
};
