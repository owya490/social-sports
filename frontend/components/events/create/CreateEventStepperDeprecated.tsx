import React from "react";

interface CreateEventTimelineProps {
  currentStep: number;
  totalSteps: number;
}

function CreateEventStepperDeprecated({ currentStep, totalSteps }: CreateEventTimelineProps) {
  const stepLabels = [
    "Basic Information",
    "Relevant Tags",
    "Description and Image",
    "Create the Event",
  ];

  return (
    <div className="mt-36 relative"> {/* Adjusted the margin-top */}
      <ol className="flex items-center w-full text-sm font-medium text-center text-gray-500 dark:text-gray-400 sm:text-base">
        {stepLabels.map((label, index) => (
          <li
            key={index}
            className={`flex md:w-full items-center flex-col relative ${
              currentStep === index + 1
                ? "text-black"
                : "text-gray-500 dark:text-gray-400"
            }`}
          >
            <span
              className={`flex items-center justify-center border border-black after:content-['/'] sm:after:hidden after:mx-2 after:text-gray-200 dark:after:text-gray-500 rounded-full w-8 h-8 ${
                currentStep === index + 1
                  ? "bg-blue-600 dark:bg-blue-500"
                  : "bg-gray-300 dark:bg-gray-400"
              } text-black`}
            >
              {index + 1}
            </span>
            <span
              className={
                currentStep === index + 1
                  ? "text-black"
                  : "text-gray-500 dark:text-gray-400"
              }
            >
              {label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default CreateEventStepper;
