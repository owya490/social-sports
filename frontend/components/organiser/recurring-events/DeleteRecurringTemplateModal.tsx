"use client";

import { RecurrenceTemplateInConflictError } from "@/interfaces/exceptions/RecurrenceTemplateInConflictError";
import { RecurrenceTemplateId } from "@/interfaces/RecurringEventTypes";
import { UserId } from "@/interfaces/UserTypes";
import { deleteRecurrenceTemplate } from "@/services/src/recurringEvents/recurringEventsService";
import { timestampToEventCardDateString } from "@/services/src/datetimeUtils";
import { Dialog, Transition, TransitionChild } from "@headlessui/react";
import { Spinner } from "@material-tailwind/react";
import Link from "next/link";
import { Timestamp } from "firebase/firestore";
import { Fragment, useEffect, useState } from "react";
import { RedHighlightButton } from "../../elements/HighlightButton";

type DeleteRecurringTemplateModalProps = {
  eventName: string;
  eventStartDate: Timestamp;
  recurrenceTemplateId: RecurrenceTemplateId;
  organiserId: UserId | null;
  modalOpen: boolean;
  onClose: () => void;
  onDeleted: () => void;
};

export default function DeleteRecurringTemplateModal({
  eventName,
  eventStartDate,
  recurrenceTemplateId,
  organiserId,
  modalOpen,
  onClose,
  onDeleted,
}: DeleteRecurringTemplateModalProps) {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"confirm" | "conflict">("confirm");
  const [blockingCollections, setBlockingCollections] = useState<string[]>([]);
  const [blockingCustomLinks, setBlockingCustomLinks] = useState<string[]>([]);
  const [genericError, setGenericError] = useState<string | null>(null);

  useEffect(() => {
    if (modalOpen) {
      setView("confirm");
      setBlockingCollections([]);
      setBlockingCustomLinks([]);
      setGenericError(null);
      setLoading(false);
    }
  }, [modalOpen]);

  const resetAndClose = () => {
    setView("confirm");
    setBlockingCollections([]);
    setBlockingCustomLinks([]);
    setGenericError(null);
    setLoading(false);
    onClose();
  };

  const handleConfirm = async () => {
    if (!organiserId) return;
    setLoading(true);
    setGenericError(null);
    try {
      await deleteRecurrenceTemplate(recurrenceTemplateId, organiserId);
      resetAndClose();
      onDeleted();
    } catch (e) {
      if (e instanceof RecurrenceTemplateInConflictError) {
        setBlockingCollections(e.blockingEventCollectionIds);
        setBlockingCustomLinks(e.blockingCustomEventLinkPaths);
        setView("conflict");
      } else {
        setGenericError(e instanceof Error ? e.message : "Could not delete. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative px-4 sm:px-0">
      <Transition appear show={modalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={resetAndClose}>
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
                  {view === "confirm" && (
                    <>
                      <div className="flex justify-between items-center px-2">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">
                          Are you sure you want to delete <span className="font-bold">{eventName}</span>?
                        </h3>
                        <button className="text-gray-500 hover:text-gray-700" onClick={resetAndClose}>
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-gray-600 px-2">
                        This removes the recurring event from your dashboard and archives its settings. Generated events
                        you already created are not deleted.
                      </p>
                      {genericError && (
                        <p className="text-sm text-red-600 px-2" role="alert">
                          {genericError}
                        </p>
                      )}
                      <div className="text-sm font-bold px-2">Starts: {timestampToEventCardDateString(eventStartDate)}</div>
                      <div className="mt-2 px-2 flex justify-between items-center">
                        <RedHighlightButton
                          text="Delete recurring event"
                          onClick={() => {
                            void handleConfirm();
                          }}
                          className="mx-3 w-44 mt-3"
                        />
                        <div className="mt-4">{loading && <Spinner className="w-5" />}</div>
                      </div>
                    </>
                  )}
                  {view === "conflict" && (
                    <>
                      <div className="flex justify-between items-center px-2">
                        <h3 className="text-lg font-medium leading-6 text-gray-900">Cannot delete yet</h3>
                        <button className="text-gray-500 hover:text-gray-700" onClick={resetAndClose}>
                          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                      <p className="text-sm text-gray-700 px-2">
                        Remove this recurring event from the following before deleting:
                      </p>
                      {blockingCollections.length > 0 && (
                        <div className="px-2 space-y-1">
                          <div className="font-semibold text-sm">Event collections</div>
                          <ul className="list-disc list-inside text-sm text-blue-700">
                            {blockingCollections.map((id) => (
                              <li key={id}>
                                <Link href={`/organiser/event/event-collection/${id}`} className="underline">
                                  Open collection {id}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {blockingCustomLinks.length > 0 && (
                        <div className="px-2 space-y-1">
                          <div className="font-semibold text-sm">Custom links</div>
                          <ul className="list-disc list-inside text-sm">
                            {blockingCustomLinks.map((slug) => (
                              <li key={slug}>
                                <span className="font-mono">{slug}</span> — manage on{" "}
                                <Link href="/organiser/event/custom-links" className="text-blue-700 underline">
                                  Custom links
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <div className="px-2 pt-2">
                        <button
                          type="button"
                          className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300"
                          onClick={resetAndClose}
                        >
                          Close
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}
