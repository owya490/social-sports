"use client";
import CreateEventStepper from "@/components/events/create/CreateEventStepper";
import { DescriptionImageForm } from "@/components/events/create/DescriptionImageForm";
import { BasicInformation } from "@/components/events/create/forms/BasicForm";
import { PreviewForm } from "@/components/events/create/forms/PreviewForm";
import { TagForm } from "@/components/events/create/forms/TagForm";
import { useMultistepForm } from "@/components/events/create/forms/useMultistepForm";
import Loading from "@/components/loading/Loading";
import { useUser } from "@/components/utility/UserContext";
import { EventId, NewEventData } from "@/interfaces/EventTypes";
import { UserData } from "@/interfaces/UserTypes";
import { createEvent } from "@/services/src/events/eventsService";
import { uploadUserImage } from "@/services/src/imageService";
import { getLocationCoordinates } from "@/services/src/locationUtils";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export type FormData = {
  date: string;
  location: string;
  sport: string;
  price: number;
  capacity: number;
  name: string;
  description: string;
  image: File | undefined;
  tags: string[];
  isPrivate: boolean;
  startTime: string;
  endTime: string;
  paymentsActive: boolean;
};

const INITIAL_DATA: FormData = {
  date: new Date().toISOString().slice(0, 10),
  location: "",
  sport: "volleyball",
  price: 15,
  capacity: 20,
  name: "",
  description: "",
  image: undefined,
  tags: [],
  isPrivate: false,
  startTime: "10:00",
  endTime: "18:00",
  paymentsActive: false,
};

export default function CreateEvent() {
  const { user } = useUser();
  const router = useRouter();
  const showForm = user.userId !== "";

  const [loading, setLoading] = useState(false);

  const [data, setData] = useState(INITIAL_DATA);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const { step, currentStep, isFirstStep, isLastStep, back, next } = useMultistepForm([
    <BasicInformation key="basic-form" {...data} updateField={updateFields} user={user} setLoading={setLoading} />,
    <TagForm key="tag-form" {...data} updateField={updateFields} />,
    <DescriptionImageForm
      key="description-image-form"
      {...data}
      imagePreviewUrl={imagePreviewUrl}
      setImagePreviewUrl={setImagePreviewUrl}
      updateField={updateFields}
    />,
    <PreviewForm
      key="preview-form"
      form={data}
      user={user}
      imagePreviewUrl={imagePreviewUrl}
      updateField={updateFields}
    />,
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

      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      createEventWorkflow(data, user).then((eventId) => {
        router.push(`/event/${eventId}`);
      });
    } catch (e) {
      console.log(e);
    }
    window.scrollTo({ top: 0, behavior: "smooth" }); // You can use 'auto' instead of 'smooth' for instant scrolling
  }

  async function createEventWorkflow(formData: FormData, user: UserData): Promise<EventId> {
    setLoading(true);
    var imageUrl =
      "https://firebasestorage.googleapis.com/v0/b/socialsports-44162.appspot.com/o/users%2Fgeneric%2Fgeneric-sports.jpeg?alt=media&token=045e6ecd-8ca7-4c18-a136-71e4aab7aaa5";

    if (formData.image !== undefined) {
      imageUrl = await uploadUserImage(user.userId, formData.image);
    }
    const newEventData = await convertFormDataToEventData(formData, user, imageUrl);
    let newEventId = "";
    try {
      newEventId = await createEvent(newEventData);
    } catch (error) {
      router.push("/error");
    }
    return newEventId;
  }

  async function convertFormDataToEventData(
    formData: FormData,
    user: UserData,
    imageUrl: string
  ): Promise<NewEventData> {
    // TODO
    // Fix end date
    // Consider a User's ability to select their event image from their uploaded images
    // Fix organiserId
    const lngLat = await getLocationCoordinates(formData.location);
    const calculateDifference = (startDate: Timestamp, endDate: Timestamp): { hrs: number; mins: number } => {
      const startMillis = startDate.toMillis();
      const endMillis = endDate.toMillis();

      const differenceMillis = endMillis - startMillis;

      // Convert milliseconds to hours and minutes
      const differenceHours = Math.floor(differenceMillis / (1000 * 60 * 60));
      const differenceMinutes = Math.floor((differenceMillis % (1000 * 60 * 60)) / (1000 * 60));

      return { hrs: differenceHours, mins: differenceMinutes };
    };

    return {
      startDate: convertDateAndTimeStringToTimestamp(formData.date, formData.startTime),
      endDate: convertDateAndTimeStringToTimestamp(formData.date, formData.endTime),
      location: formData.location,
      capacity: formData.capacity,
      vacancy: formData.capacity,
      price: formData.price,
      name: formData.name,
      description: formData.description,
      image: imageUrl,
      eventTags: formData.tags,
      isActive: true,
      isPrivate: false,
      attendees: {},
      attendeesMetadata: {},
      accessCount: 0,
      organiserId: user.userId,
      registrationDeadline: convertDateAndTimeStringToTimestamp(formData.date, formData.startTime),
      locationLatLng: {
        lat: lngLat.lat,
        lng: lngLat.lng,
      },
      sport: formData.sport,
      paymentsActive: formData.paymentsActive,
    };
  }

  function convertDateAndTimeStringToTimestamp(date: string, time: string): Timestamp {
    let dateObject = new Date(date);
    const timeArr = time.split(":");
    dateObject.setHours(parseInt(timeArr[0]));
    dateObject.setMinutes(parseInt(timeArr[1]));
    return Timestamp.fromDate(dateObject);
  }

  return loading ? (
    <Loading />
  ) : (
    <div className="flex justify-center">
      {!showForm ? (
        <div className="h-screen w-full flex justify-center items-center">Please Login/ Register to Access</div>
      ) : (
        <div className="screen-width-primary my-32">
          <form onSubmit={submit}>
            <div className="px-6 lg:px-12">
              <CreateEventStepper activeStep={currentStep} />
            </div>
            <div className="absolute top-2 right-2">{/* {currentStep + 1} / {steps.length} */}</div>
            {step}

            <div className="flex mt-8 w-11/12 lg:w-2/3 xl:w-full m-auto">
              {!isFirstStep && (
                <button type="button" className="border border-black py-1.5 px-7 rounded-lg mr-2" onClick={back}>
                  Back
                </button>
              )}
              {!isLastStep && (
                <button type="submit" className="border border-black py-1.5 px-7 rounded-lg ml-auto lg:mr-2">
                  Next
                </button>
              )}
              {isLastStep && (
                <button type="submit" className="border border-black py-1.5 px-7 rounded-lg ml-auto">
                  Create Event
                </button>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
