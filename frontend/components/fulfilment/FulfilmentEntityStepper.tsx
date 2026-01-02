import { FulfilmentEntityType, GetFulfilmentSessionInfoResponse } from "@/interfaces/FulfilmentTypes";
import { CreditCardIcon, DocumentTextIcon, StarIcon, UserIcon } from "@heroicons/react/24/outline";
import { Step, Stepper, Typography } from "@material-tailwind/react";

interface FulfilmentEntityStepperProps {
  fulfilmentSessionInfo: GetFulfilmentSessionInfoResponse | null;
}

export default function FulfilmentEntityStepper({ fulfilmentSessionInfo }: FulfilmentEntityStepperProps) {
  const activeStep = fulfilmentSessionInfo?.currentEntityIndex ?? -1;
  const stepLabels = fulfilmentSessionInfo?.fulfilmentEntityTypes.map((entityType) => entityType.toString()) ?? [];

  // Count total occurrences per entity type
  const countsByType: Record<string, number> = stepLabels.reduce((acc, type) => {
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Track the running occurrence index for each type while mapping
  const occurrenceByType: Record<string, number> = {};
  const totalSteps = stepLabels.length;

  return (
    <Stepper activeStep={activeStep}>
      {stepLabels.map((stepLabel, index) => {
        const icon = (() => {
          switch (stepLabel) {
            case FulfilmentEntityType.DELAYED_STRIPE:
              return <CreditCardIcon className="h-5 w-5" />;
            case FulfilmentEntityType.STRIPE:
              return <CreditCardIcon className="h-5 w-5" />;
            case FulfilmentEntityType.FORMS:
              return <DocumentTextIcon className="h-5 w-5" />;
            case FulfilmentEntityType.END:
              return <StarIcon className="h-5 w-5" />;
            default:
              return <UserIcon className="h-5 w-5" />;
          }
        })();

        const label = (() => {
          switch (stepLabel) {
            case FulfilmentEntityType.DELAYED_STRIPE:
              return "Payment";
            case FulfilmentEntityType.STRIPE:
              return "Payment";
            case FulfilmentEntityType.FORMS:
              return "Forms";
            case FulfilmentEntityType.END:
              return "End";
            default:
              return "Unknown";
          }
        })();

        // Increment occurrence for this type
        occurrenceByType[stepLabel] = (occurrenceByType[stepLabel] || 0) + 1;
        const showNumber = (countsByType[stepLabel] || 0) > 1;
        const displayLabel = `${label}${showNumber ? ` ${occurrenceByType[stepLabel]}` : ""}`;

        // Hide labels below md when there are more than 5 steps
        const labelVisibilityClass =
          totalSteps > 5 ? "hidden md:flex md:flex-col items-center" : "flex flex-col items-center";

        return (
          <Step key={index} onClick={() => {}}>
            {icon}
            <div className={`absolute -bottom-[2rem] w-max text-center ${labelVisibilityClass}`}>
              <Typography
                variant="h6"
                color={index === activeStep ? "blue-gray" : "gray"}
                className="text-sm md:text-base"
              >
                {displayLabel}
              </Typography>
            </div>
          </Step>
        );
      })}
    </Stepper>
  );
}
