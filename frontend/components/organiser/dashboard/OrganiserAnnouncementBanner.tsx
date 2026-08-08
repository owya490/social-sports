import { XMarkIcon } from "@heroicons/react/20/solid";
import { useState } from "react";

export const OrganiserAnnouncementBanner = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) {
    return null;
  }

  return (
    <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-surface px-6 py-2.5 sm:px-3.5 sm:before:flex-1 rounded-none">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm leading-6 text-foreground font-sans">
          <strong className="font-semibold">Booking approval is available</strong>
          <svg viewBox="0 0 2 2" aria-hidden="true" className="mx-2 inline h-0.5 w-0.5 fill-current">
            <circle r={1} cx={1} cy={1} />
          </svg>
          Enable it in event Settings to review requests before confirming.
        </p>
      </div>
      <div className="flex flex-1 justify-end">
        <button
          type="button"
          className="-m-3 p-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          onClick={() => {
            setDismissed(true);
          }}
        >
          <span className="sr-only">Dismiss</span>
          <XMarkIcon aria-hidden="true" className="h-5 w-5 text-foreground" />
        </button>
      </div>
    </div>
  );
};
