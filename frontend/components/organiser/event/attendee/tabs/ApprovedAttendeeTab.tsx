import DownloadCsvButton from "@/components/DownloadCsvButton";
import { EventMetadata, Purchaser } from "@/interfaces/EventTypes";
import { EMPTY_ORDER, Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { getPurchaserEmailHash } from "@/services/src/events/eventsService";
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import {
  DocumentTextIcon,
  EllipsisVerticalIcon,
  PencilSquareIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Dispatch, Fragment, SetStateAction, useState } from "react";
import AttendeeListTable, { MANUAL_ORDER_ID_PREFIX } from "../AttendeeListTable";
import { EditAttendeeTicketsDialog } from "../EditAttendeeTicketsDialog";
import RemoveAttendeeDialog from "../RemoveAttendeeDialog";

interface ApprovedAttendeeActionsProps {
  order: Order;
  purchaser: Purchaser;
  eventId: string;
  setEventMetadata: React.Dispatch<React.SetStateAction<EventMetadata>>;
  setEventVacancy: Dispatch<SetStateAction<number>>;
  setSelectedOrderForFormResponses: (order: Order) => void;
}

export const ApprovedAttendeeActions = ({
  order,
  purchaser,
  eventId,
  setEventMetadata,
  setEventVacancy,
  setSelectedOrderForFormResponses,
}: ApprovedAttendeeActionsProps) => {
  const [isRemoveAttendeeModalOpen, setIsRemoveAttendeeModalOpen] = useState<boolean>(false);
  const [isEditAttendeeTicketsDialogModalOpen, setIsEditAttendeeTicketsDialogModalOpen] = useState<boolean>(false);

  function closeRemoveAttendeeModal() {
    setIsRemoveAttendeeModalOpen(false);
  }
  function closeEditAttendeeTicketsDialogModal() {
    setIsEditAttendeeTicketsDialogModalOpen(false);
  }

  return (
    <>
      <Menu as="div" className="relative ml-auto">
        <div className="flex justify-center">
          <MenuButton>
            <div className="p-1.5 cursor-pointer rounded-full hover:bg-organiser-darker-light-gray hover:ease-in transition">
              <EllipsisVerticalIcon className="w-6" />
            </div>
          </MenuButton>
        </div>
        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <MenuItems className="absolute right-0 mt-1 w-52 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
            <div className="px-1 py-1">
              <MenuItem>
                <div
                  className={`text-black group flex w-full items-center rounded-md px-2 py-2 text-sm hover:cursor-pointer hover:text-white hover:bg-black `}
                  onClick={() => setSelectedOrderForFormResponses(order)}
                >
                  <DocumentTextIcon className="h-5 mr-2" />
                  View form responses
                </div>
              </MenuItem>
              <MenuItem>
                <div
                  className={`text-black group flex w-full items-center rounded-md px-2 py-2 text-sm hover:cursor-pointer hover:text-white hover:bg-black `}
                  onClick={() => setIsEditAttendeeTicketsDialogModalOpen(true)}
                >
                  <PencilSquareIcon className="h-5 mr-2" />
                  Edit tickets
                </div>
              </MenuItem>
              <MenuItem>
                <div
                  className={`text-black group flex w-full items-center rounded-md px-2 py-2 text-sm hover:cursor-pointer hover:text-white hover:bg-black `}
                  onClick={() => setIsRemoveAttendeeModalOpen(true)}
                >
                  <XMarkIcon className="h-5 mr-2" />
                  Remove attendee
                </div>
              </MenuItem>
            </div>
          </MenuItems>
        </Transition>
      </Menu>
      <div className="grow">
        <EditAttendeeTicketsDialog
          setIsEditAttendeeTicketsDialogModalOpen={setIsEditAttendeeTicketsDialogModalOpen}
          closeModal={closeEditAttendeeTicketsDialogModal}
          isEditAttendeeTicketsDialogModalOpen={isEditAttendeeTicketsDialogModalOpen}
          email={purchaser.email}
          numTickets={order.tickets.length}
          purchaser={purchaser}
          attendeeName={order.fullName}
          eventId={eventId}
          setEventMetadata={setEventMetadata}
          setEventVacancy={setEventVacancy}
        />
      </div>
      <div className="grow">
        <RemoveAttendeeDialog
          setIsRemoveAttendeeModalOpen={setIsRemoveAttendeeModalOpen}
          closeModal={closeRemoveAttendeeModal}
          isRemoveAttendeeModalOpen={isRemoveAttendeeModalOpen}
          email={purchaser.email}
          purchaser={purchaser}
          attendeeName={order.fullName}
          eventId={eventId}
          setEventMetadata={setEventMetadata}
          setEventVacancy={setEventVacancy}
        />
      </div>
    </>
  );
};

interface ApprovedAttendeeTabProps {
  approvedOrderTicketsMap: Map<Order, Ticket[]>;
  eventMetadata: EventMetadata;
  eventId: string;
  loadingApprovedOrders: boolean;
  setEventVacancy: Dispatch<SetStateAction<number>>;
  setEventMetadata: React.Dispatch<React.SetStateAction<EventMetadata>>;
  setIsFilterModalOpen: Dispatch<SetStateAction<boolean>>;
  setSelectedOrderForFormResponses: (order: Order) => void;
}

export const ApprovedAttendeeTab = ({
  approvedOrderTicketsMap,
  eventMetadata,
  eventId,
  loadingApprovedOrders,
  setEventVacancy,
  setEventMetadata,
  setIsFilterModalOpen,
  setSelectedOrderForFormResponses,
}: ApprovedAttendeeTabProps) => {
  const allOrders = Array.from(approvedOrderTicketsMap.keys());

  // Sum ticket counts per email+name from approved orders
  const orderTicketCountByEmailName = new Map<string, number>();
  allOrders.forEach((order) => {
    const key = `${order.email}::${order.fullName}`;
    orderTicketCountByEmailName.set(key, (orderTicketCountByEmailName.get(key) ?? 0) + (order.tickets?.length ?? 0));
  });

  // Check eventMetadata for attendees that have more or fewer tickets than in orders
  const manualAdditionOrders: Order[] = [];
  const ticketsToRemoveByEmailName = new Map<string, number>();

  Object.entries(eventMetadata.purchaserMap).forEach(([, purchaser]) => {
    Object.entries(purchaser.attendees).forEach(([attendeeName, attendee]) => {
      const key = `${purchaser.email}::${attendeeName}`;
      const orderTicketCount = orderTicketCountByEmailName.get(key) ?? 0;
      const legacyTicketCount = attendee.ticketCount ?? 0;

      if (legacyTicketCount > orderTicketCount) {
        const manualCount = legacyTicketCount - orderTicketCount;
        manualAdditionOrders.push({
          ...EMPTY_ORDER,
          orderId: `${MANUAL_ORDER_ID_PREFIX}${purchaser.email}-${attendeeName}`,
          email: purchaser.email,
          fullName: `${attendeeName}`,
          phone: attendee.phone ?? "",
          tickets: Array(manualCount).fill("MANUAL_ADDITION"),
        });
      } else if (legacyTicketCount < orderTicketCount) {
        // Organiser manually removed tickets — cap to the legacy count
        ticketsToRemoveByEmailName.set(key, orderTicketCount - legacyTicketCount);
      }
    });
  });

  // Trim tickets from orders where the organiser manually removed some
  const adjustedOrders = allOrders.map((order) => {
    const key = `${order.email}::${order.fullName}`;
    const toRemove = ticketsToRemoveByEmailName.get(key);
    if (toRemove && toRemove > 0) {
      const trimAmount = Math.min(toRemove, order.tickets.length);
      ticketsToRemoveByEmailName.set(key, toRemove - trimAmount);
      return { ...order, tickets: order.tickets.slice(0, order.tickets.length - trimAmount) };
    }
    return order;
  });

  const sortedOrders = [...adjustedOrders, ...manualAdditionOrders]
    .filter((order) => order.tickets.length > 0)
    .sort((a: Order, b: Order) => a.email.localeCompare(b.email));

  // Convert attendee entries to table data format
  const tableData = sortedOrders.map((order, index) => ({
    key: `${order.email}-${order.fullName}-${index}`,
    ticketCount: order.tickets.length,
    name: order.fullName,
    email: order.email,
    phone: order.phone ? `${order.phone}` : "N/A",
    order,
    purchaser: eventMetadata.purchaserMap[getPurchaserEmailHash(order.email)],
  }));

  const allAttendeesCsvData = sortedOrders.flatMap((order) => {
    const rows = [
      {
        "Ticket Count": `${order.tickets.length}`,
        "Attendee Name": order.fullName,
        Email: order.email,
        "Phone Number": order.phone ? `${order.phone}` : "N/A",
      },
    ];

    // Add additional rows for tickets beyond the first one
    if (order.tickets.length > 1) {
      for (let i = 1; i < order.tickets.length; i++) {
        rows.push({
          "Ticket Count": "",
          "Attendee Name": `${order.fullName} +${i}`,
          Email: order.email,
          "Phone Number": order.phone ? `${order.phone}` : "N/A",
        });
      }
    }

    return rows;
  });

  const csvHeaders = [
    { label: "Ticket Count", key: "Ticket Count" },
    { label: "Attendee Name", key: "Attendee Name" },
    { label: "Email", key: "Email" },
    { label: "Phone Number", key: "Phone Number" },
  ];

  const renderActions = (item: (typeof tableData)[0]) => {
    const { order, purchaser } = item;
    return (
      <ApprovedAttendeeActions
        order={order}
        purchaser={purchaser}
        eventId={eventId}
        setEventMetadata={setEventMetadata}
        setEventVacancy={setEventVacancy}
        setSelectedOrderForFormResponses={setSelectedOrderForFormResponses}
      />
    );
  };
  return (
    <>
      <div className="flex justify-between">
        <div className="text-2xl md:text-4xl font-extrabold">Approved Attendees</div>
        <div className="flex items-center space-x-4">
          <DownloadCsvButton data={allAttendeesCsvData} headers={csvHeaders} filename={`Attendees_${eventId}.csv`} />
          <div
            className="inline-flex justify-center rounded-md bg-organiser-dark-gray-text px-2 md:px-4 py-1.5 md:py-2 text-sm font-medium text-white hover:bg-black/30 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/75 hover:cursor-pointer"
            onClick={() => setIsFilterModalOpen(true)}
          >
            <PlusIcon className="md:mr-2 h-5 w-5" />
            <span className="hidden md:block">Add Attendee</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col">
        <AttendeeListTable
          data={tableData}
          loading={loadingApprovedOrders}
          emptyMessage="No approved attendees"
          loadingMessage="Loading approved attendees..."
          renderActions={renderActions}
        />
      </div>
    </>
  );
};

export default ApprovedAttendeeTab;
