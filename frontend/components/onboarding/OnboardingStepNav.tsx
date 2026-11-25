"use client";

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
    <div className="space-y-3 pt-2">
      <div className="flex w-full items-center justify-between gap-3">
        <button
          type="button"
          disabled={disabled}
          onClick={onBack}
          className="inline-flex items-center justify-center rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50"
        >
          Back
        </button>
        <button
          type={primaryType}
          disabled={disabled || primaryDisabled}
          onClick={onPrimary}
          className="inline-flex items-center justify-center rounded-xl bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50"
        >
          {primaryLabel}
        </button>
      </div>
      {skip ? (
        <div className="flex justify-end">
          <button
            type="button"
            disabled={disabled}
            onClick={() => void skip.onSkip()}
            className="text-xs font-medium text-foreground-muted underline decoration-border underline-offset-2 transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50"
          >
            {skip.busy ? "Working…" : "Skip for now"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
