"use client";
import { BasicForm, BasicInformation } from "@/components/events/create/BasicForm";
import { CostPage } from "@/components/events/create/CostPage";
import CreateEventStepper from "@/components/events/create/CreateEventStepper";
import { DescriptionForm } from "@/components/events/create/DescriptionForm";
import { TagForm } from "@/components/events/create/TagForm";
import { useMultistepForm } from "@/components/events/create/useMultistepForm";
import { EventData, NewEventData } from "@/interfaces/EventTypes";
import { createEvent } from "@/services/eventsService";
import { Timestamp } from "firebase/firestore";
import { FormEvent, useState } from "react";

type FormData = {
  date: string;
  time: string;
  location: string;
  sport: string; 
  cost: number;
  people: number;
  name: string;
  description: string;
  image: string;
  tags: string[];
};

const INITIAL_DATA: FormData = {
  date: "",
  time: "",
  location: "",
  sport:"",
  cost: 0,
  people: 0,
  name: "",
  description: "",
  image: "",
  tags: [],
};

export default function CreateEvent() {
  const [data, setData] = useState(INITIAL_DATA);
  const { step, steps, currentStep, isFirstStep, isLastStep, back, next } =
    useMultistepForm([
      <BasicInformation {...data} updateField={updateFields} />,
      <CostPage {...data} updateField={updateFields} />,
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
    try {
      // console.log(createEvent(convertFormDataToEventData(data)));
      console.log(data);
      console.log(convertFormDataToEventData(data));
    } catch (e) {
      console.log(e);
    }
  }

  function convertFormDataToEventData(formData: FormData): NewEventData {
    // TODO
    // Fix end date
    // Consider a User's ability to select their event image from their uploaded images
    // Fix organiserId
    return {
      startDate: convertToTimestamp(formData.date, formData.time),
      endDate: convertToTimestamp(formData.date, formData.time),
      location: formData.location,
      capacity: formData.people,
      vacancy: formData.people,
      price: formData.cost,
      name: formData.name,
      description: formData.description,
      image:
        "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fstv%2F364809572_6651230408261559_5428994326794147594_n.png.jpeg?alt=media&token=9020aa75-976a-430f-a96e-d763f5b4bada",
      eventTags: [],
      isActive: true,
      attendees: [],
      accessCount: 0,
      organiserId: "g9s1a1t3b7LJi8bswkd0",
      registrationDeadline: Timestamp.now(),
    };
  }

  function convertToTimestamp(date: string, time: string): Timestamp {
    let tmp = new Date(date);
    const timeArr = time.split(":");
    tmp.setHours(parseInt(timeArr[0]));
    tmp.setMinutes(parseInt(timeArr[1]));
    return Timestamp.fromDate(tmp);
  }

  return (
    <div className="relative border border-black m-40 p-8 rounded-xl">
      <form onSubmit={submit}>
        <CreateEventStepper currentStep={currentStep + 1} totalSteps={3}/>
        <div className="absolute top-2 right-2">
          {/* {currentStep + 1} / {steps.length} */}
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
