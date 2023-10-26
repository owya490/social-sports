import React from "react";

interface ButtonProps {
    currentStep: number;
    totalSteps: number;
    onPrev: () => void;
    onNext: () => void;
}

function Button({ currentStep, totalSteps, onPrev, onNext }: ButtonProps) {
    const isFirstStep = currentStep === 1;
    const isLastStep = currentStep === totalSteps;

    return (
        <div className="flex justify-between">
            <button
                onClick={onPrev}
                disabled={isFirstStep}
                className="bg-blue-900 text-white py-2 px-10 rounded-xl ml-60 mt-40"
            >
                Prev
            </button>
            <button
                onClick={onNext}
                disabled={isLastStep}
                className="bg-blue-900 text-white py-2 px-10 rounded-xl mr-60 mt-40"
            >
                Next
            </button>
        </div>
    );
}

export default Button;
