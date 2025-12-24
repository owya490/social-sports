import { EventMetadata } from "@/interfaces/EventTypes";
import { Order } from "@/interfaces/OrderTypes";
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import { CheckIcon, DocumentTextIcon, EllipsisVerticalIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Dispatch, Fragment, SetStateAction } from "react";
import AttendeeListTable from "../AttendeeListTable";

interface PendingAttendeeTabProps {
  eventMetadata: EventMetadata;
  eventId: string;
  pendingOrders: Order[];
  loadingPendingOrders: boolean;
  onApproveOrder: (order: Order) => void;
  onRejectOrder: (order: Order) => void;
  setSelectedOrderForFormResponses: Dispatch<SetStateAction<Order | null>>;
}

export const PendingAttendeeTab = ({
  eventId,
  pendingOrders,
  loadingPendingOrders,
  onApproveOrder,
  onRejectOrder,
  setSelectedOrderForFormResponses,
}: PendingAttendeeTabProps) => {
  // Convert orders to table data format
  const tableData = pendingOrders.map((order) => ({
    key: order.orderId,
    ticketCount: order.tickets.length,
    name: order.fullName,
    email: order.email,
    phone: order.phone || null,
    order, // Keep reference to original order for actions
  }));

  const renderActions = (item: (typeof tableData)[0]) => {
    const order = item.order;
    return (
      <>
        {/* Desktop: Action buttons and menu */}
        <div className="hidden md:flex items-center justify-start space-x-1">
          <button
            onClick={() => onApproveOrder(order)}
            className="p-1 rounded-full bg-black text-white border border-black hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Approve"
          >
            <CheckIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => onRejectOrder(order)}
            className="p-1 rounded-full bg-white border border-black text-black hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Reject"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
          <Menu as="div" className="relative">
            <div className="flex justify-center">
              <MenuButton className="focus:outline-none">
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
              <MenuItems className="absolute right-0 mt-1 w-52 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[100]">
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
        </div>
        {/* Mobile: Ellipsis menu with all actions */}
        <div className="md:hidden flex justify-center">
          <Menu as="div" className="relative">
            <div className="flex justify-center">
              <MenuButton className="focus:outline-none">
                <div className="p-1.5 cursor-pointer rounded-full hover:bg-organiser-darker-light-gray hover:ease-in transition focus:outline-none">
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
              <MenuItems className="absolute right-0 mt-1 w-52 origin-top-right divide-y divide-gray-100 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-[100]">
                <div className="px-1 py-1">
                  <MenuItem>
                    <div
                      className="text-black group flex w-full items-center rounded-md px-2 py-2 text-sm hover:cursor-pointer hover:text-white hover:bg-black"
                      onClick={() => onApproveOrder(order)}
                    >
                      <CheckIcon className="h-5 mr-2" />
                      Approve
                    </div>
                  </MenuItem>
                  <MenuItem>
                    <div
                      className="text-black group flex w-full items-center rounded-md px-2 py-2 text-sm hover:cursor-pointer hover:text-white hover:bg-black"
                      onClick={() => onRejectOrder(order)}
                    >
                      <XMarkIcon className="h-5 mr-2" />
                      Reject
                    </div>
                  </MenuItem>
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
        </div>
      </>
    );
  };

  return (
    <>
      <div className="text-2xl md:text-4xl font-extrabold">Pending Attendees</div>
      <div className="flex flex-col">
        <AttendeeListTable
          data={tableData}
          loading={loadingPendingOrders}
          emptyMessage="No pending attendees"
          loadingMessage="Loading pending attendees..."
          renderActions={renderActions}
        />
      </div>
    </>
  );
};
