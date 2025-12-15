import { useUser } from "@/components/utility/UserContext";
import { XMarkIcon } from "@heroicons/react/20/solid";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const OrganiserAnnouncementBanner = () => {
  const router = useRouter();
  const { user } = useUser();

  const [dismissed, setDismissed] = useState(false);

  const hasEvents = user.organiserEvents && user.organiserEvents.length > 0;

  if (dismissed) {
    return null;
  }

  // Show Wrapped banner if organiser has events
  if (hasEvents) {
    return (
      <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-sm leading-6 text-white">
            <strong className="font-semibold">🎁 YOUR 2025 WRAPPED IS HERE</strong>
            <svg viewBox="0 0 2 2" aria-hidden="true" className="mx-2 inline h-0.5 w-0.5 fill-current">
              <circle r={1} cx={1} cy={1} />
            </svg>
            See your year in review - events created, tickets sold, and more!
          </p>
          <button
            onClick={() => {
              router.push("/organiser/wrapped/2025");
            }}
            className="flex-none rounded-full bg-white px-3.5 py-1 text-sm font-semibold text-orange-600 shadow-sm hover:bg-orange-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            View Wrapped <span aria-hidden="true">&rarr;</span>
          </button>
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
            <XMarkIcon aria-hidden="true" className="h-5 w-5 text-white" />
          </button>
        </div>
      </div>
    );
  }

  // Show Event Collections banner if organiser has no events
  return (
    <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <p className="text-sm leading-6 text-white">
          <strong className="font-semibold">📚 NEW: EVENT COLLECTIONS</strong>
          <svg viewBox="0 0 2 2" aria-hidden="true" className="mx-2 inline h-0.5 w-0.5 fill-current">
            <circle r={1} cx={1} cy={1} />
          </svg>
          Group your events together and share them with a single link!
        </p>
        <button
          onClick={() => {
            router.push("/organiser/event/event-collection");
          }}
          className="flex-none rounded-full bg-white px-3.5 py-1 text-sm font-semibold text-blue-600 shadow-sm hover:bg-blue-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          View Collections <span aria-hidden="true">&rarr;</span>
        </button>
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
          <XMarkIcon aria-hidden="true" className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  );
};
