"use client";

import { EventId } from "@/interfaces/EventTypes";
import { getUrlWithCurrentHostname } from "@/services/src/urlUtils";
import { Description, Dialog, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { ShareIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { Fragment, useEffect, useState } from "react";

type EventHubShareControlProps = {
  eventId: EventId;
};

export function EventHubShareControl({ eventId }: EventHubShareControlProps) {
  const [open, setOpen] = useState(false);
  const [eventURL, setEventURL] = useState("");

  useEffect(() => {
    setEventURL(getUrlWithCurrentHostname(`/event/${eventId}`));
  }, [eventId]);

  const copyURL = async () => {
    try {
      await navigator.clipboard.writeText(eventURL);
    } catch {
      // Clipboard may be unavailable; URL remains selectable in the dialog.
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground-muted font-sans hover:text-foreground transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded-lg px-1.5 py-1"
      >
        <ShareIcon className="h-3.5 w-3.5" aria-hidden />
        Share
      </button>

      <Transition appear show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setOpen(false)}>
          <TransitionChild
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-foreground/40" />
          </TransitionChild>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <TransitionChild
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <div className="w-full max-w-md transform overflow-hidden rounded-xl border border-border bg-background p-5 shadow-lg">
                  <div className="flex items-center justify-between gap-3">
                    <DialogTitle className="text-base font-semibold text-foreground font-sans">
                      Share event
                    </DialogTitle>
                    <button
                      type="button"
                      onClick={() => setOpen(false)}
                      className="rounded-lg p-1 text-foreground-muted hover:text-foreground hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                      aria-label="Close"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                  <Description className="mt-3 text-sm text-foreground-secondary font-sans break-all select-all">
                    {eventURL}
                  </Description>
                  <button
                    type="button"
                    onClick={copyURL}
                    className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
                  >
                    Copy link
                  </button>
                </div>
              </TransitionChild>
            </div>
          </div>
        </Dialog>
      </Transition>
    </>
  );
}
