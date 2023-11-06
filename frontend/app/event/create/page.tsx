import React, { useState } from "react";
import CreateEventTimeline from "@/components/events/create/CreateEventTimeline";
import CreateEventCost from "@/components/events/create/CreateEventCost";
import TextField from "@/components/events/create/TextField";
import Button from "@/components/Button";

export default function CreateEvent() {
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 4;

    const handleNext = () => {
        if (currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handlePrev = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <div>
            <CreateEventTimeline
                currentStep={currentStep}
                totalSteps={totalSteps}
            />
            <CreateEventCost />
            {currentStep === 1 && (
                <TextField
                    label="Field 1 Label"
                    placeholder="Field 1 Placeholder"
                />
            )}
            {currentStep === 2 && (
                <TextField
                    label="Field 2 Label"
                    placeholder="Field 2 Placeholder"
                />
            )}
            <Button
                currentStep={currentStep}
                totalSteps={totalSteps}
                onPrev={handlePrev}
                onNext={handleNext}
            />
        </div>
    );
}
