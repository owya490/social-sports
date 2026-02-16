import DownloadCsvButton from "@/components/DownloadCsvButton";
import { Order } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import { DocumentTextIcon, EllipsisVerticalIcon } from "@heroicons/react/24/outline";
import { Fragment } from "react";
import AttendeeListTable from "../AttendeeListTable";

interface RejectedAttendeeActionsProps {
  order: Order;
  setSelectedOrderForFormResponses: (order: Order) => void;
}

const RejectedAttendeeActions = ({
  order,
  setSelectedOrderForFormResponses,
}: RejectedAttendeeActionsProps) => {
  return (
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
                className="text-black group flex w-full items-center rounded-md px-2 py-2 text-sm hover:cursor-pointer hover:text-white hover:bg-black"
                onClick={() => setSelectedOrderForFormResponses(order)}
              >
                <DocumentTextIcon className="h-5 mr-2" />
                View form responses
              </div>
            </MenuItem>
          </div>
        </MenuItems>
      </Transition>
    </Menu>
  );
};

interface RejectedAttendeeTabProps {
  rejectedOrderTicketsMap: Map<Order, Ticket[]>;
  eventId: string;
  loadingRejectedOrders: boolean;
  setSelectedOrderForFormResponses: (order: Order) => void;
}

export const RejectedAttendeeTab = ({
  rejectedOrderTicketsMap,
  eventId,
  loadingRejectedOrders,
  setSelectedOrderForFormResponses,
}: RejectedAttendeeTabProps) => {
  const sortedOrders = Array.from(rejectedOrderTicketsMap.keys())
    .sort((a: Order, b: Order) => a.email.localeCompare(b.email));

  // Convert attendee entries to table data format
  const tableData = sortedOrders.map((order, index) => ({
    key: `${order.email}-${order.fullName}-${index}`,
    ticketCount: order.tickets.length,
    name: order.fullName,
    email: order.email,
    phone: order.phone ? `${order.phone}` : "N/A",
    order,
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
    const { order } = item;
    return (
      <RejectedAttendeeActions
        order={order}
        setSelectedOrderForFormResponses={setSelectedOrderForFormResponses}
      />
    );
  };

  return (
    <>
      <div className="flex justify-between">
        <div className="text-2xl md:text-4xl font-extrabold">Rejected Attendees</div>
        <div className="flex items-center space-x-4">
          <DownloadCsvButton data={allAttendeesCsvData} headers={csvHeaders} filename={`Rejected_Attendees_${eventId}.csv`} />
        </div>
      </div>
      <div className="flex flex-col">
        <AttendeeListTable
          data={tableData}
          loading={loadingRejectedOrders}
          emptyMessage="No rejected attendees"
          loadingMessage="Loading rejected attendees..."
          renderActions={renderActions}
        />
      </div>
    </>
  );
};

export default RejectedAttendeeTab;
