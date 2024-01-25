"use client";
import { BasicInformation } from "@/components/events/create/BasicForm";
import CreateEventStepper from "@/components/events/create/CreateEventStepper";
import { DescriptionImageForm } from "@/components/events/create/DescriptionImageForm";
import { PreviewForm } from "@/components/events/create/PreviewForm";
import { TagForm } from "@/components/events/create/TagForm";
import { useMultistepForm } from "@/components/events/create/useMultistepForm";
import { NewEventData } from "@/interfaces/EventTypes";
import { Timestamp } from "firebase/firestore";
import { FormEvent, useState } from "react";

export type FormData = {
  date: string;
  time: string;
  location: string;
  sport: string;
  cost: number;
  people: number;
  name: string;
  description: string;
  image: File | undefined;
  tags: string[];
  startTime: string;
  endTime: string;
};

const INITIAL_DATA: FormData = {
  date: new Date().toISOString().slice(0, 10),
  time: "",
  location: "",
  sport: "",
  cost: 15,
  people: 0,
  name: "",
  description: "",
  image: undefined,
  tags: [],
  startTime: "10:00",
  endTime: "18:00",
};

export default function CreateEvent() {
  const [data, setData] = useState(INITIAL_DATA);
  const { step, steps, currentStep, isFirstStep, isLastStep, back, next } =
    useMultistepForm([
      <BasicInformation {...data} updateField={updateFields} />,
      <TagForm {...data} updateField={updateFields} />,
      <DescriptionImageForm {...data} updateField={updateFields} />,
      <PreviewForm form={data} updateField={updateFields} />,
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
      locationLatLng: {
        lat: 0,
        lng: 0,
      },
      sport: "volleyball",
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
    <div className="w-screen flex justify-center">
      <div className="screen-width-primary my-32">
        <form onSubmit={submit}>
          <div className="px-12">
            <CreateEventStepper activeStep={currentStep} />
          </div>
          <div className="absolute top-2 right-2">
            {/* {currentStep + 1} / {steps.length} */}
          </div>
          {step}

          <div className="flex mt-8">
            {!isFirstStep && (
              <button
                type="button"
                className="border border-black py-1.5 px-7 rounded-lg mr-2"
                onClick={back}
              >
                Back
              </button>
            )}
            {!isLastStep && (
              <button
                type="submit"
                className="border border-black py-1.5 px-7 rounded-lg ml-auto"
              >
                Next
              </button>
            )}
            {isLastStep && (
              <button
                type="submit"
                className="border border-black py-1.5 px-7 rounded-lg ml-auto"
              >
                Create Event
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
