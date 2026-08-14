import { FulfilmentEntityType, GetFulfilmentSessionInfoResponse } from "@/interfaces/FulfilmentTypes";
import { CreditCardIcon, DocumentTextIcon, StarIcon, UserIcon } from "@heroicons/react/24/outline";
import { CheckIcon } from "@heroicons/react/24/solid";
import { ReactNode } from "react";

interface FulfilmentEntityStepperProps {
  fulfilmentSessionInfo: GetFulfilmentSessionInfoResponse | null;
}

const STEP_META: Record<string, { label: string; icon: ReactNode }> = {
  [FulfilmentEntityType.DELAYED_STRIPE]: {
    label: "Payment",
    icon: <CreditCardIcon className="h-3.5 w-3.5" />,
  },
  [FulfilmentEntityType.STRIPE]: {
    label: "Payment",
    icon: <CreditCardIcon className="h-3.5 w-3.5" />,
  },
  [FulfilmentEntityType.FORMS]: {
    label: "Forms",
    icon: <DocumentTextIcon className="h-3.5 w-3.5" />,
  },
  [FulfilmentEntityType.END]: {
    label: "End",
    icon: <StarIcon className="h-3.5 w-3.5" />,
  },
};

const FALLBACK_META = { label: "Unknown", icon: <UserIcon className="h-3.5 w-3.5" /> };

export default function FulfilmentEntityStepper({ fulfilmentSessionInfo }: FulfilmentEntityStepperProps) {
  const activeStep = fulfilmentSessionInfo?.currentEntityIndex ?? -1;
  const stepLabels = fulfilmentSessionInfo?.fulfilmentEntityTypes.map((entityType) => entityType.toString()) ?? [];

  const countsByType: Record<string, number> = stepLabels.reduce(
    (acc, type) => {
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const occurrenceByType: Record<string, number> = {};
  const totalSteps = stepLabels.length;

  return (
    <nav aria-label="Checkout progress">
      <ol className="flex w-full">
        {stepLabels.map((stepLabel, index) => {
          const { label, icon } = STEP_META[stepLabel] ?? FALLBACK_META;
          occurrenceByType[stepLabel] = (occurrenceByType[stepLabel] || 0) + 1;
          const displayLabel = `${label}${countsByType[stepLabel] > 1 ? ` ${occurrenceByType[stepLabel]}` : ""}`;

          const isCompleted = index < activeStep;
          const isActive = index === activeStep;
          const isReached = isCompleted || isActive;
          const isLast = index === totalSteps - 1;
          const labelVisibilityClass = totalSteps > 5 ? "hidden md:block" : "block";

          return (
            <li
              key={index}
              aria-current={isActive ? "step" : undefined}
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <div className="flex w-full items-center">
                <span className={`h-px flex-1 ${index === 0 ? "bg-transparent" : isReached ? "bg-foreground" : "bg-border"}`} />
                <span
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                    isReached
                      ? "bg-foreground text-background"
                      : "border border-border bg-background text-foreground-muted"
                  }`}
                >
                  {isCompleted ? <CheckIcon className="h-3.5 w-3.5" /> : icon}
                </span>
                <span className={`h-px flex-1 ${isLast ? "bg-transparent" : isCompleted ? "bg-foreground" : "bg-border"}`} />
              </div>
              <span
                className={`${labelVisibilityClass} whitespace-nowrap text-center text-xs font-medium ${
                  isReached ? "text-foreground" : "text-foreground-muted"
                }`}
              >
                {displayLabel}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
