"use client";

import { GetFulfilmentSessionInfoResponse } from "@/interfaces/FulfilmentTypes";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { InvertedHighlightButton } from "../elements/HighlightButton";
import FulfilmentEntityStepper from "./FulfilmentEntityStepper";

interface FulfilmentEntityPageProps {
  children: ReactNode;
  onNext?: () => void;
  onPrev?: () => void;
  showNextButton?: boolean;
  showPrevButton?: boolean;
  fulfilmentSessionInfo: GetFulfilmentSessionInfoResponse | null;
  areAllRequiredFieldsFilled?: boolean;
  isSaving?: boolean;
}

const FulfilmentEntityPage = ({
  children,
  onNext,
  onPrev,
  showNextButton = true,
  showPrevButton = true,
  fulfilmentSessionInfo,
  areAllRequiredFieldsFilled = true,
  isSaving = false,
}: FulfilmentEntityPageProps) => {
  const [remainingMs, setRemainingMs] = useState<number | null>(null);

  useEffect(() => {
    setRemainingMs(null);
    if (!fulfilmentSessionInfo?.fulfilmentSessionStartTime) {
      return;
    }

    // Support Firestore Timestamp or ISO string-like fallback
    const startMs = (fulfilmentSessionInfo.fulfilmentSessionStartTime as any)?.toMillis
      ? (fulfilmentSessionInfo.fulfilmentSessionStartTime as any).toMillis()
      : new Date((fulfilmentSessionInfo!.fulfilmentSessionStartTime as unknown as string) ?? Date.now()).getTime();

    const expiryMs = startMs + 30 * 60 * 1000; // 30 minutes

    const update = () => {
      const now = Date.now();
      setRemainingMs(Math.max(0, expiryMs - now));
    };

    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [fulfilmentSessionInfo]);

  const formattedRemaining = useMemo(() => {
    if (remainingMs === null) return null;
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const mm = String(minutes).padStart(2, "0");
    const ss = String(seconds).padStart(2, "0");
    return `${mm}:${ss}`;
  }, [remainingMs]);

  return (
    <div className="relative min-h-screen bg-core-hover">
      <div className="w-full flex justify-center pb-8 md:pb-16">
        <div className="mt-20 screen-width-primary">
          <FulfilmentEntityStepper fulfilmentSessionInfo={fulfilmentSessionInfo} />
        </div>
      </div>
      <div className="w-full">{children}</div>

      {/* Navigation buttons positioned to match form width */}
      <div className="w-full flex justify-center pointer-events-none z-50 pb-20 pt-8">
        <div className="screen-width-primary md:px-32">
          <div className="flex items-center">
            <div
              className={`pointer-events-auto ${
                showPrevButton && onPrev && !isSaving ? "opacity-100" : "opacity-0 pointer-events-none"
              } transition-opacity duration-200`}
            >
              <InvertedHighlightButton
                type="submit"
                className={`border-1 px-4 ${isSaving ? "bg-gray-100 text-gray-400 cursor-not-allowed" : "bg-white"}`}
                onClick={!isSaving ? onPrev || (() => {}) : undefined}
                disabled={isSaving}
              >
                <span className="text-sm flex items-center gap-2">
                  <ChevronLeftIcon className="h-4 w-4" /> Prev
                </span>
              </InvertedHighlightButton>
            </div>

            {/* Centered countdown timer */}
            <div className="flex-1 flex justify-center">
              <span className="text-xs md:text-sm text-gray-600 select-none">
                Time Remaining: {formattedRemaining ?? ""}
              </span>
            </div>

            <div
              className={`pointer-events-auto ${
                showNextButton && onNext && !isSaving ? "opacity-100" : "opacity-0 pointer-events-none"
              } transition-opacity duration-200 ml-auto`}
            >
              <InvertedHighlightButton
                type="submit"
                className={`border-1 px-4 ${
                  areAllRequiredFieldsFilled && !isSaving ? "bg-white" : "bg-gray-100 text-gray-400 cursor-not-allowed"
                }`}
                onClick={areAllRequiredFieldsFilled && !isSaving ? onNext || (() => {}) : undefined}
                disabled={!areAllRequiredFieldsFilled || isSaving}
              >
                <span className="text-sm flex items-center gap-2">
                  Next <ChevronRightIcon className="h-4 w-4" />
                </span>
              </InvertedHighlightButton>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FulfilmentEntityPage;
