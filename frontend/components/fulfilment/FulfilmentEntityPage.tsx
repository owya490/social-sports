"use client";

import { ReactNode } from "react";
import { BlackHighlightButton } from "../elements/HighlightButton";

interface FulfilmentEntityPageProps {
  children: ReactNode;
  onNext?: () => void;
  onPrev?: () => void;
  showNextButton?: boolean;
  showPrevButton?: boolean;
}

const FulfilmentEntityPage = ({
  children,
  onNext,
  onPrev,
  showNextButton = true,
  showPrevButton = true,
}: FulfilmentEntityPageProps) => {
  return (
    <div className="relative min-h-screen">
      <div className="w-full h-full">{children}</div>

      {/* Navigation buttons positioned at bottom corners */}
      <div className="fixed bottom-6 left-0 right-0 pointer-events-none z-50">
        <div className="flex justify-between px-8 sm:px-12">
          <div
            className={`pointer-events-auto ${
              showPrevButton && onPrev ? "opacity-100" : "opacity-0 pointer-events-none"
            } transition-opacity duration-200`}
          >
            <BlackHighlightButton
              type="submit"
              text="Prev"
              className="border-1 px-3 bg-white ml-auto"
              onClick={onPrev || (() => {})}
            />
          </div>

          <div
            className={`pointer-events-auto ${
              showNextButton && onNext ? "opacity-100" : "opacity-0 pointer-events-none"
            } transition-opacity duration-200`}
          >
            <BlackHighlightButton
              type="submit"
              text="Next"
              className="border-1 px-3 bg-white ml-auto"
              onClick={onNext || (() => {})}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default FulfilmentEntityPage;
