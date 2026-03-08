"use client";

import type { EventAttendeeNameAndTicketCount } from "@/services/src/attendee/attendeeService";
import { Dialog, Transition, TransitionChild } from "@headlessui/react";
import { Fragment } from "react";
import { getInitial } from "./EventAttendees";

interface ViewAllAttendeesModalProps {
  isOpen: boolean;
  onClose: () => void;
  attendees: EventAttendeeNameAndTicketCount[];
}

export function ViewAllAttendeesModal({ isOpen, onClose, attendees }: ViewAllAttendeesModalProps) {
  return (
    <Transition appear show={isOpen} as={Fragment}>
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
              <div className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all relative">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium leading-6 text-gray-900">Attendees</h3>
                  <button className="text-gray-500 hover:text-gray-800" onClick={onClose}>
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  <div className="flex flex-col gap-3">
                    {attendees.map((attendee, index) => (
                      <div
                        key={`${attendee.name}-${index}`}
                        className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 flex items-center gap-3"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-900 font-medium">
                          {getInitial(attendee.name)}
                        </div>
                        <span className="text-gray-900 truncate flex-1" title={attendee.name}>
                          {attendee.name}
                        </span>
                        {attendee.ticketCount > 1 && (
                          <span className="ml-auto shrink-0 text-xs text-gray-500">
                            +{attendee.ticketCount - 1} guest{attendee.ticketCount > 2 ? "s" : ""}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
