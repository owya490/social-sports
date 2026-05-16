"use client";

type Props = {
  onSkipAll: () => void | Promise<void>;
  disabled?: boolean;
  /** Omit when the primary flow already exposes the same action (e.g. organiser “Continue to create event”). */
  skipStep?: {
    label: string;
    onSkipStep: () => void | Promise<void>;
  };
};

export default function OnboardingFooterSkipActions({ skipStep, onSkipAll, disabled = false }: Props) {
  return (
    <div className="mt-12 border-t border-gray-200 pt-8">
      <p className="mb-4 text-sm text-gray-600">Prefer to move on?</p>
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {skipStep ? (
          <button
            type="button"
            disabled={disabled}
            className="text-left text-sm font-semibold text-gray-700 underline hover:text-gray-900 disabled:opacity-50"
            onClick={() => void Promise.resolve(skipStep.onSkipStep())}
          >
            {skipStep.label}
          </button>
        ) : null}
        <button
          type="button"
          disabled={disabled}
          className="text-left text-sm font-semibold text-gray-700 underline hover:text-gray-900 disabled:opacity-50"
          onClick={() => void Promise.resolve(onSkipAll())}
        >
          Skip onboarding
        </button>
      </div>
    </div>
  );
}
