"use client";

import { HighlightButton } from "@/components/elements/HighlightButton";
import { ClockIcon, HomeIcon } from "@heroicons/react/24/outline";
import Link from "next/link";

const TimeoutPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-core-hover">
      <div className="screen-width-dashboard text-center px-4">
        {/* Timeout Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center">
            <ClockIcon className="h-12 w-12 text-red-500" />
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-md mx-auto mb-12">
          <h1 className="text-3xl font-bold text-core-text mb-4">Session Timed Out</h1>
          <p className="text-lg text-gray-600 mb-4 font-light">
            Your fulfilment session has expired. For security reasons, sessions are limited to 30 minutes.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/">
            <HighlightButton text="Go to Dashboard" className="flex items-center gap-2">
              <HomeIcon className="h-5 w-5" />
            </HighlightButton>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TimeoutPage;
