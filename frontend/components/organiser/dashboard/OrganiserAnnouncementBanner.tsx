import { XMarkIcon } from "@heroicons/react/20/solid";
import { useRouter } from "next/navigation";
import { useState } from "react";

export const OrganiserAnnouncementBanner = () => {
  const router = useRouter();

  const [dismissed, setDismissed] = useState(false);
  return (
    !dismissed && (
      <div className="relative isolate flex items-center gap-x-6 overflow-hidden bg-gray-300 px-6 py-2.5 sm:px-3.5 sm:before:flex-1">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <p className="text-sm leading-6 text-black">
            <strong className="font-semibold">NEW FEATURE</strong>
            <svg viewBox="0 0 2 2" aria-hidden="true" className="mx-2 inline h-0.5 w-0.5 fill-current">
              <circle r={1} cx={1} cy={1} />
            </svg>
            Pass through Application Card Surcharges to customers.
          </p>
          <button
            onClick={() => {
              router.push("/event/create");
            }}
            className="flex-none rounded-full bg-black px-3.5 py-1 text-sm font-semibold text-white shadow-sm hover:bg-gray-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
          >
            Create Event <span aria-hidden="true">&rarr;</span>
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
            <XMarkIcon aria-hidden="true" className="h-5 w-5 text-gray-900" />
          </button>
        </div>
      </div>
    )
  );
};
