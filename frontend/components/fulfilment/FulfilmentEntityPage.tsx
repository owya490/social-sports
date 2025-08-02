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

      {/* Navigation buttons positioned to match form width */}
      <div className="fixed bottom-16 left-1/2 transform -translate-x-1/2 pointer-events-none z-50">
        <div className="screen-width-primary md:px-32">
          <div className="flex justify-between gap-4">
            <div
              className={`pointer-events-auto flex-1 ${
                showPrevButton && onPrev ? "opacity-100" : "opacity-0 pointer-events-none"
              } transition-opacity duration-200`}
            >
              <BlackHighlightButton
                type="submit"
                text="Prev"
                className="border-1 px-3 bg-white w-full"
                onClick={onPrev || (() => {})}
              />
            </div>

            <div
              className={`pointer-events-auto flex-1 ${
                showNextButton && onNext ? "opacity-100" : "opacity-0 pointer-events-none"
              } transition-opacity duration-200`}
            >
              <BlackHighlightButton
                type="submit"
                text="Save & Next"
                className="border-1 px-3 bg-white w-full"
                onClick={onNext || (() => {})}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FulfilmentEntityPage;
