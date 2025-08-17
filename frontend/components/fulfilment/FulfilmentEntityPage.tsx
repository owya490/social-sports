"use client";

import { GetFulfilmentSessionInfoResponse } from "@/interfaces/FulfilmentTypes";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";
import { Tooltip } from "@material-tailwind/react";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { InvertedHighlightButton } from "../elements/HighlightButton";
import FulfilmentEntityStepper from "./FulfilmentEntityStepper";
import TimeoutWarningModal from "./TimeoutWarningModal";

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
  const router = useRouter();
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [sessionExtended, setSessionExtended] = useState(false);

  // Mobile tooltip state (for disabled button clicks)
  const [showMobileTooltip, setShowMobileTooltip] = useState<"prev" | "next" | null>(null);

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

  // Handle timeout redirect and warning
  useEffect(() => {
    if (remainingMs === null) return;

    // Show warning when 30 seconds remain (and haven't extended session)
    if (remainingMs <= 30 * 1000 && remainingMs > 0 && !sessionExtended && !showTimeoutWarning) {
      setShowTimeoutWarning(true);
    }

    // Redirect when time is up
    if (remainingMs <= 0) {
      // Small delay to ensure the timer shows 00:00 before redirecting
      const timeoutId = setTimeout(() => {
        router.push("/timeout");
      }, 100);

      return () => clearTimeout(timeoutId);
    }
  }, [remainingMs, router, sessionExtended, showTimeoutWarning]);

  const handleStayActive = () => {
    setShowTimeoutWarning(false);
    setSessionExtended(true);
  };

  // Get tooltip messages based on disabled reasons
  const getPrevTooltipMessage = () => {
    if (!showPrevButton) return "No previous step available";
    if (isSaving) return "Please wait while saving...";
    return "";
  };

  const getNextTooltipMessage = () => {
    if (!showNextButton) return "No next step available";
    if (!areAllRequiredFieldsFilled) return "Please fill out all required sections before continuing";
    if (isSaving) return "Please wait while saving...";
    return "";
  };

  // Handle disabled button clicks for mobile
  const handleDisabledPrevClick = () => {
    if (!showPrevButton || !onPrev || isSaving) {
      setShowMobileTooltip("prev");
      setTimeout(() => setShowMobileTooltip(null), 3000);
    }
  };

  const handleDisabledNextClick = () => {
    if (!showNextButton || !areAllRequiredFieldsFilled || isSaving) {
      setShowMobileTooltip("next");
      setTimeout(() => setShowMobileTooltip(null), 3000);
    }
  };

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
            <div className="pointer-events-auto relative">
              {getPrevTooltipMessage() ? (
                <Tooltip
                  content={getPrevTooltipMessage()}
                  placement="top"
                  className="bg-gray-800 text-white text-xs"
                  animate={{
                    mount: { scale: 1, y: 0 },
                    unmount: { scale: 0, y: 25 },
                  }}
                  open={showMobileTooltip === "prev" ? true : undefined}
                >
                  <div>
                    <InvertedHighlightButton
                      type="submit"
                      className={`border-1 px-4 ${
                        !showPrevButton || !onPrev || isSaving
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white"
                      }`}
                      onClick={showPrevButton && onPrev && !isSaving ? onPrev : handleDisabledPrevClick}
                      disabled={!showPrevButton || !onPrev || isSaving}
                    >
                      <span className="text-sm flex items-center gap-2">
                        <ChevronLeftIcon className="h-4 w-4" /> Prev
                      </span>
                    </InvertedHighlightButton>
                  </div>
                </Tooltip>
              ) : (
                <Tooltip
                  content={getPrevTooltipMessage()}
                  placement="top"
                  className="bg-gray-800 text-white text-xs"
                  animate={{
                    mount: { scale: 1, y: 0 },
                    unmount: { scale: 0, y: 25 },
                  }}
                  open={showMobileTooltip === "prev" ? true : false}
                >
                  <div>
                    <InvertedHighlightButton
                      type="submit"
                      className={`border-1 px-4 ${
                        !showPrevButton || !onPrev || isSaving
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-white"
                      }`}
                      onClick={showPrevButton && onPrev && !isSaving ? onPrev : handleDisabledPrevClick}
                      disabled={!showPrevButton || !onPrev || isSaving}
                    >
                      <span className="text-sm flex items-center gap-2">
                        <ChevronLeftIcon className="h-4 w-4" /> Prev
                      </span>
                    </InvertedHighlightButton>
                  </div>
                </Tooltip>
              )}
            </div>

            {/* Centered countdown timer */}
            <div className="flex-1 flex justify-center">
              <span
                className={`text-xs md:text-sm select-none transition-colors duration-300 ${
                  remainingMs !== null && remainingMs <= 5 * 60 * 1000 ? "text-red-600 font-semibold" : "text-gray-600"
                }`}
              >
                Time Remaining: {formattedRemaining ?? ""}
              </span>
            </div>

            <div className="pointer-events-auto ml-auto relative">
              {getNextTooltipMessage() ? (
                <Tooltip
                  content={getNextTooltipMessage()}
                  placement="top"
                  className="bg-gray-800 text-white text-xs"
                  animate={{
                    mount: { scale: 1, y: 0 },
                    unmount: { scale: 0, y: 25 },
                  }}
                  open={showMobileTooltip === "next" ? true : undefined}
                >
                  <div>
                    <InvertedHighlightButton
                      type="submit"
                      className={`border-1 px-4 ${
                        showNextButton && areAllRequiredFieldsFilled && !isSaving
                          ? "bg-white"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                      onClick={
                        showNextButton && areAllRequiredFieldsFilled && !isSaving ? onNext : handleDisabledNextClick
                      }
                      disabled={!showNextButton || !areAllRequiredFieldsFilled || isSaving}
                    >
                      <span className="text-sm flex items-center gap-2">
                        Next <ChevronRightIcon className="h-4 w-4" />
                      </span>
                    </InvertedHighlightButton>
                  </div>
                </Tooltip>
              ) : (
                <Tooltip
                  content={getNextTooltipMessage()}
                  placement="top"
                  className="bg-gray-800 text-white text-xs"
                  animate={{
                    mount: { scale: 1, y: 0 },
                    unmount: { scale: 0, y: 25 },
                  }}
                  open={showMobileTooltip === "next" ? true : false}
                >
                  <div>
                    <InvertedHighlightButton
                      type="submit"
                      className={`border-1 px-4 ${
                        showNextButton && areAllRequiredFieldsFilled && !isSaving
                          ? "bg-white"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                      onClick={
                        showNextButton && areAllRequiredFieldsFilled && !isSaving ? onNext : handleDisabledNextClick
                      }
                      disabled={!showNextButton || !areAllRequiredFieldsFilled || isSaving}
                    >
                      <span className="text-sm flex items-center gap-2">
                        Next <ChevronRightIcon className="h-4 w-4" />
                      </span>
                    </InvertedHighlightButton>
                  </div>
                </Tooltip>
              )}
            </div>
          </div>
        </div>
      </div>
      <TimeoutWarningModal
        isOpen={showTimeoutWarning}
        remainingSeconds={Math.max(0, Math.floor((remainingMs || 0) / 1000))}
        onStayActive={handleStayActive}
      />
    </div>
  );
};

export default FulfilmentEntityPage;
