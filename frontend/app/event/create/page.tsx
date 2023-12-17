"use client";
import { useMultistepForm } from "@/components/events/create/useMultistepForm";

export default function CreateEvent() {
  const { step, steps, currentStep, isFirstStep, isLastStep, back, next } =
    useMultistepForm([<div>One</div>, <div>Two</div>, <div>Three</div>]);
  return (
    <div className="relative border border-black mt-40 m-4 p-8 rounded-xl">
      <form>
        <div className="absolute top-2 right-2">
          {currentStep + 1} / {steps.length}
        </div>
        {step}
        <div className="flex justify-end">
          {!isFirstStep && (
            <button
              type="button"
              className="border border-black p-2 rounded-lg"
              onClick={back}
            >
              Back
            </button>
          )}
          {!isLastStep && (
            <button
              type="button"
              className="border border-black p-2 rounded-lg"
              onClick={next}
            >
              Next
            </button>
          )}
          {isLastStep && (
            <button
              type="button"
              className="border border-black p-2 rounded-lg"
            >
              Finish
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
