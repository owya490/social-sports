import { EventData, EventMetadata } from "@/interfaces/EventTypes";
import { Order, OrderAndTicketStatus } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { Logger } from "@/observability/logger";
import { getEntryFromOrderTicketsMapByOrderId } from "@/services/src/tickets/ticketUtils/ticketUtils";
import React, { Dispatch, SetStateAction, useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import InviteAttendeeDialog from "./AddAttendeeDialog";
import { ViewAttendeeFormResponsesDialog } from "./ViewAttendeeFormResponsesDialog";
import { ApprovedAttendeeTab } from "./tabs/ApprovedAttendeeTab";

interface EventDrilldownManageAttendeesPageProps {
  eventMetadata: EventMetadata;
  eventId: string;
  eventData: EventData;
  setEventVacancy: Dispatch<SetStateAction<number>>;
  setEventMetadata: React.Dispatch<React.SetStateAction<EventMetadata>>;
  orderTicketsMap: Map<Order, Ticket[]>;
  setOrderTicketsMap: Dispatch<SetStateAction<Map<Order, Ticket[]>>>;
}

type TabType = "approved" | "pending" | "rejected";

export const EventDrilldownManageAttendeesPage = ({
  eventMetadata,
  eventId,
  eventData,
  setEventVacancy,
  setEventMetadata,
  orderTicketsMap,
  setOrderTicketsMap,
}: EventDrilldownManageAttendeesPageProps) => {
  const logger = new Logger("EventDrilldownManageAttendeesPage");
  const [isFilterModalOpen, setIsFilterModalOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>("approved");
  const [approvedOrderTicketsMap, setApprovedOrderTicketsMap] = useState<Map<Order, Ticket[]>>(new Map());
  const [loadingApprovedOrders, setLoadingApprovedOrders] = useState<boolean>(false);
  const [selectedOrderForFormResponses, setSelectedOrderForFormResponses] = useState<Order | null>(null);

  console.log(orderTicketsMap);
  console.log(Array.from(orderTicketsMap.keys())[0]);

  function closeModal() {
    setIsFilterModalOpen(false);
  }

  // Fetch pending orders
  useEffect(() => {
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
            approvedMap.set(
              order,
              tickets.filter((ticket) => ticket.status === OrderAndTicketStatus.APPROVED)
            );
          }
        });
        setApprovedOrderTicketsMap(approvedMap);
      } catch (error) {
        logger.error(`Error fetching approved orders: ${error}`);
        setApprovedOrderTicketsMap(new Map());
      } finally {
        setLoadingApprovedOrders(false);
      }
    };

    fetchApprovedOrders();
  }, [orderTicketsMap]);

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
      </div>

      {/* Attendees Tab Content */}
      {activeTab === "approved" && (
        <ApprovedAttendeeTab
          approvedOrderTicketsMap={approvedOrderTicketsMap}
          eventMetadata={eventMetadata}
          eventId={eventId}
          loadingApprovedOrders={loadingApprovedOrders}
          eventData={eventData}
          setEventVacancy={setEventVacancy}
          setOrderTicketsMap={setOrderTicketsMap}
          setIsFilterModalOpen={setIsFilterModalOpen}
          setSelectedOrderForFormResponses={(order: Order) => setSelectedOrderForFormResponses(order)}
        />
      )}

      <div className="grow">
        <InviteAttendeeDialog
          eventData={eventData}
          setIsFilterModalOpen={setIsFilterModalOpen}
          closeModal={closeModal}
          isFilterModalOpen={isFilterModalOpen}
          eventId={eventId}
          setOrderTicketsMap={setOrderTicketsMap}
          setEventVacancy={setEventVacancy}
        />
        {selectedOrderForFormResponses && (
          <ViewAttendeeFormResponsesDialog
            onClose={() => {
              setSelectedOrderForFormResponses(null);
            }}
            orderTicketsMap={
              new Map([getEntryFromOrderTicketsMapByOrderId(orderTicketsMap, selectedOrderForFormResponses.orderId)!])
            }
            eventData={eventData}
            eventMetadata={eventMetadata}
          />
        )}
      </div>
    </div>
  );
};
