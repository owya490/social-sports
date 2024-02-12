import { ReactElement, useState } from "react";

export function useMultistepForm(steps: ReactElement[]) {
  const [currentStep, setCurrentStep] = useState(0);

  function next() {
    window.scrollTo(0, 0);
    setCurrentStep((i) => {
      if (i >= steps.length - 1) return i;
      return i + 1;
    });
  }

  function back() {
    window.scrollTo(0, 0);
    setCurrentStep((i) => {
      if (i <= 0) return i;
      return i - 1;
    });
  }

  function goTo(index: number) {
    setCurrentStep(index);
  }

  return {
    currentStep,
    step: steps[currentStep],
    goTo,
    next,
    back,
    isFirstStep: currentStep === 0,
    isLastStep: currentStep === steps.length - 1,
  };
}
