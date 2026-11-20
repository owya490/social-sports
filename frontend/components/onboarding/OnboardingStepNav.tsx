"use client";

import { HighlightButton } from "@/components/elements/HighlightButton";

type OnboardingStepNavProps = {
  onBack: () => void;
  primaryLabel: string;
  primaryType?: "button" | "submit";
  onPrimary?: () => void;
  disabled?: boolean;
  primaryDisabled?: boolean;
  skip?: {
    busy?: boolean;
    onSkip: () => void;
  };
};

/** Back on the left, continue or finish on the right. Shared by every onboarding step. */
export default function OnboardingStepNav({
  onBack,
  primaryLabel,
  primaryType = "button",
  onPrimary,
  disabled = false,
  primaryDisabled = false,
  skip,
}: OnboardingStepNavProps) {
  return (
    <div className="flex w-full items-center justify-between gap-4 pt-2">
      <HighlightButton
        type="button"
        className="border border-core-outline bg-transparent disabled:opacity-50"
        disabled={disabled}
        onClick={onBack}
      >
        Back
      </HighlightButton>
      <div className="flex flex-col items-end gap-2">
        <HighlightButton
          type={primaryType}
          className="bg-core-text text-white hover:bg-black disabled:opacity-50"
          disabled={disabled || primaryDisabled}
          onClick={onPrimary}
        >
          {primaryLabel}
        </HighlightButton>
        {skip ? (
          <button
            type="button"
            disabled={disabled}
            className="text-xs text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-gray-800 disabled:opacity-50"
            onClick={() => void skip.onSkip()}
          >
            {skip.busy ? "Working…" : "Skip"}
          </button>
        ) : null}
      </div>
    </div>
  );
}
