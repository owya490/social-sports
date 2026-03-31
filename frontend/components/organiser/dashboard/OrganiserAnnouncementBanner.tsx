import { XMarkIcon } from "@heroicons/react/20/solid";
import { useState } from "react";

export const OrganiserAnnouncementBanner = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-gradient-to-r from-[#f8f8f8] to-[#f8f8f8] px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm leading-6 text-black">
          <strong className="font-semibold">New: Order page</strong>
          <svg viewBox="0 0 2 2" aria-hidden="true" className="mx-2 inline h-0.5 w-0.5 fill-current">
            <circle r={1} cx={1} cy={1} />
          </svg>
          You can now review full order details in one place. Open an event, go to the{" "}
          <strong className="font-semibold">Attendees</strong> table, and click the{" "}
          <strong className="font-semibold">order ID</strong> under each attendee&apos;s email (the linked value beside{" "}
          <span className="whitespace-nowrap">Id:</span>). It opens in a new tab so your dashboard stays open.
        </p>
      </div>
      <div className="flex flex-1 justify-end">
        <button
          type="button"
          className="-m-3 p-3 focus-visible:outline-offset-[-4px]"
          onClick={() => {
            setDismissed(true);
          }}
        >
          <span className="sr-only">Dismiss</span>
          <XMarkIcon aria-hidden="true" className="h-5 w-5 text-black" />
        </button>
      </div>
    </div>
  );
};
