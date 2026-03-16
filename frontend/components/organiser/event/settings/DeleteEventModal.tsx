"use client";

import { Order, OrderAndTicketStatus } from "@/interfaces/OrderTypes";
import { Ticket } from "@/interfaces/TicketTypes";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { Dialog, Transition, TransitionChild } from "@headlessui/react";
import { Spinner } from "@material-tailwind/react";
import { Timestamp } from "firebase/firestore";
import { Fragment, useMemo } from "react";
import { RedHighlightButton } from "../../../elements/HighlightButton";
import DeleteEventAttendeeCard from "./DeleteEventAttendeeCard";

interface ShareModalProps {
  eventName: string;
  eventStartDate: Timestamp;
  orderTicketsMap: Map<Order, Ticket[]>;
  modalOpen: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const DeleteEventModal = ({
  eventName,
  eventStartDate,
  orderTicketsMap,
  modalOpen,
  loading,
  onClose,
  onConfirm,
}: ShareModalProps) => {
  const attendeeRows = useMemo(
    () =>
      Array.from(orderTicketsMap.entries())
        .filter(([order]) => order.status === OrderAndTicketStatus.APPROVED && !!order.email)
        .map(([order, tickets]) => ({
          attendeeName: order.fullName?.trim() || order.email,
          attendeeEmail: order.email,
          ticketCount: tickets.filter((ticket) => ticket.status === OrderAndTicketStatus.APPROVED).length,
        }))
        .filter((row) => row.ticketCount > 0)
        .sort((row1, row2) => {
          const emailComparison = row1.attendeeEmail.localeCompare(row2.attendeeEmail);
          if (emailComparison !== 0) {
            return emailComparison;
          }
          return row1.attendeeName.localeCompare(row2.attendeeName);
        }),
    [orderTicketsMap]
  );

  const hasAttendees = attendeeRows.length > 0;

  return (
    <div className="relative px-4 sm:px-0">
      <Transition appear show={modalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={onClose}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-50" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto z-50">
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <div className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white px-4 py-6 text-left align-middle shadow-xl transition-all relative space-y-4">
                  <div className="flex justify-between items-center px-2">
                    <h3 className="text-lg font-medium leading-6 text-gray-900">
                      Are you sure you want to delete <span className="font-bold">{eventName}</span>?
                    </h3>

                    <button className="text-gray-500 hover:text-gray-700" onClick={onClose}>
                      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  <div className=" text-sm font-bold px-2">Date: {timestampToEventCardDateString(eventStartDate)}</div>
                  <div className="bg-organiser-light-gray rounded px-2 py-2 ">
                    {hasAttendees && (
                      <div>
                        <div className="font-bold mb-2">Attendees:</div>
                        <div className="grid grid-cols-7 gap-2 text-organiser-title-gray-text font-bold text-xs md:text-base">
                          <div className="col-span-1 pl-1 truncate">Tickets</div>
                          <div className="col-span-1 truncate">Name</div>
                          <div className="col-span-5 truncate">Email</div>
                        </div>
                        <div className="inline-block w-full h-0.5 my-0 md:my-2 self-stretch bg-organiser-title-gray-text"></div>
                        <div>
                          <div className="text-sm">
                            {attendeeRows.map((attendeeRow, index) => (
                              <DeleteEventAttendeeCard
                                key={`${attendeeRow.attendeeEmail}-${attendeeRow.attendeeName}-${index}`}
                                attendeeName={attendeeRow.attendeeName}
                                attendeeEmail={attendeeRow.attendeeEmail}
                                ticketCount={attendeeRow.ticketCount}
                              />
                            ))}
                          </div>
                          <div className="mt-4">
                            An email will be sent to each attendee notifying them. Please handle refunds immediately.
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mt-2 px-2 flex justify-between">
                    <RedHighlightButton
                      text="Delete Event"
                      onClick={() => {
                        onConfirm();
                      }}
                      className="mx-3 w-32 mt-3"
                    />
                    <div className="mt-4">{loading && <Spinner className="w-5" />}</div>
                  </div>
                </div>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default DeleteEventModal;
