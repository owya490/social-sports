"use client";
import { BasicForm } from "@/components/events/create/BasicForm";
import { DescriptionForm } from "@/components/events/create/DescriptionForm";
import { TagForm } from "@/components/events/create/TagForm";
import { useMultistepForm } from "@/components/events/create/useMultistepForm";
import { FormEvent, useState } from "react";

type FormData = {
  date: string;
  time: string;
  location: string;
  cost: number;
  people: number;
  name: string;
  description: string;
  image: string;
  // tags: [];
};

const INITIAL_DATA: FormData = {
  date: "",
  time: "",
  location: "",
  cost: 0,
  people: 0,
  name: "",
  description: "",
  image: "",
  // tags: [],
};
export default function CreateEvent() {
  const [data, setData] = useState(INITIAL_DATA);
  const { step, steps, currentStep, isFirstStep, isLastStep, back, next } =
    useMultistepForm([
      <BasicForm {...data} updateField={updateFields} />,
      <DescriptionForm {...data} updateField={updateFields} />,
      <TagForm {...data} updateField={updateFields} />,
    ]);

  function updateFields(fields: Partial<FormData>) {
    setData((prev) => {
      return { ...prev, ...fields };
    });
  }

  function submit(e: FormEvent) {
    e.preventDefault();

    if (!isLastStep) {
      next();
      return;
    }
    alert("Account Created!");
  }

  return (
    <div className="relative border border-black m-40 p-8 rounded-xl">
      <form onSubmit={submit}>
        <div className="absolute top-2 right-2">
          {currentStep + 1} / {steps.length}
        </div>
        {step}
        <div className="flex justify-end">
          {!isFirstStep && (
            <button
              type="button"
              className="border border-black p-2 rounded-lg mr-2"
              onClick={back}
            >
              Back
            </button>
          )}
          {!isLastStep && (
            <button
              type="submit"
              className="border border-black p-2 rounded-lg"
            >
              Next
            </button>
          )}
          {isLastStep && (
            <button
              type="submit"
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
