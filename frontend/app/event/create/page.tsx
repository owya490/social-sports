// CreateEvent.jsx
"use client";

import React, { useState } from "react";
import CreateEventTimeline from "@/components/events/create/CreateEventTimeline";
import { CreateEventPage1 } from "@/components/events/create/CreateEventPage1";
import { CreateEventPage2 } from "@/components/events/create/CreateEventPage2";
import CreateEventTimeslot from "@/components/events/create/CreateEventTimeslot";

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

            {currentStep === 1 && <CreateEventPage1 />}
            {currentStep === 2 && <CreateEventPage2 />}
            {currentStep === 3 && <CreateEventTimeslot />}

            <Button
                currentStep={currentStep}
                totalSteps={totalSteps}
                onPrev={handlePrev}
                onNext={handleNext}
            />
        </div>
    );
}
