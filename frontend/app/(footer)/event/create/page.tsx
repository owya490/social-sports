"use client";
import { InvertedHighlightButton } from "@/components/elements/HighlightButton";
import CreateEventStepper from "@/components/events/create/CreateEventStepper";
import { BasicInformation } from "@/components/events/create/forms/BasicForm";
import { DescriptionForm } from "@/components/events/create/forms/DescriptionForm";
import { FormWrapper } from "@/components/events/create/forms/FormWrapper";
import { ImageForm } from "@/components/events/create/forms/ImageForm";
import { PreviewForm } from "@/components/events/create/forms/PreviewForm";
import { useMultistepForm } from "@/components/events/create/forms/useMultistepForm";
import Loading from "@/components/loading/Loading";
import { useUser } from "@/components/utility/UserContext";
import { EventId, NewEventData } from "@/interfaces/EventTypes";
import { DEFAULT_RECURRENCE_FORM_DATA, NewRecurrenceFormData } from "@/interfaces/RecurringEventTypes";
import { UserData } from "@/interfaces/UserTypes";
import { createEvent } from "@/services/src/events/eventsService";
import {
  getUsersEventImagesUrls,
  getUsersEventThumbnailsUrls,
  uploadAndGetImageAndThumbnailUrls,
} from "@/services/src/imageService";
import { createRecurrenceTemplate } from "@/services/src/recurringEvents/recurringEventsService";
import { sendEmailOnCreateEvent } from "@/services/src/sendgrid/sendgridService";
import { Alert } from "@material-tailwind/react";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

export type FormData = {
  startDate: string;
  endDate: string;
  registrationEndDate: string;
  location: string;
  sport: string;
  price: number;
  capacity: number;
  name: string;
  description: string;
  image: File | string | undefined;
  thumbnail: File | string | undefined;
  tags: string[];
  isPrivate: boolean;
  startTime: string;
  endTime: string;
  registrationEndTime: string;
  paymentsActive: boolean;
  lat: number;
  long: number;
  stripeFeeToCustomer: boolean;
  promotionalCodesEnabled: boolean;
  paused: boolean;
  newRecurrenceData: NewRecurrenceFormData;
};

const INITIAL_DATA: FormData = {
  startDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().slice(0, 10),
  endDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().slice(0, 10),
  registrationEndDate: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().slice(0, 10),
  location: "",
  sport: "volleyball",
  price: 1500, // $15 default price, set to 1500 as it is in cents
  capacity: 20,
  name: "",
  description: "",
  image: undefined,
  thumbnail: undefined,
  tags: [],
  isPrivate: false,
  startTime: "10:00",
  endTime: "10:00",
  registrationEndTime: "10:00",
  paymentsActive: false,
  lat: 0,
  long: 0,
  stripeFeeToCustomer: false,
  promotionalCodesEnabled: false,
  paused: false,
  newRecurrenceData: DEFAULT_RECURRENCE_FORM_DATA,
};

export default function CreateEvent() {
  const { user } = useUser();
  const router = useRouter();
  const showForm = user.userId !== "";

  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [hasAlert, setHasAlert] = useState(false);
  const [AlertMessage, setAlertMessage] = useState("");

  const [data, setData] = useState(INITIAL_DATA);
  const [imagePreviewUrl, setImagePreviewUrl] = useState("");
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState("");

  const [eventThumbnailsUrls, setEventThumbnailUrls] = useState<string[]>([]);
  const [eventImageUrls, setEventImageUrls] = useState<string[]>([]);

  useEffect(() => {
    const fetchUserImages = async () => {
      setEventThumbnailUrls(await getUsersEventThumbnailsUrls(user.userId));
      setEventImageUrls(await getUsersEventImagesUrls(user.userId));
    };
    fetchUserImages();
  }, [user]);

  const { step, currentStep, isFirstStep, isLastStep, back, next } = useMultistepForm([
    <BasicInformation
      key="basic-form"
      {...data}
      updateField={updateFields}
      user={user}
      setLoading={setLoading}
      setHasError={setHasError}
      locationError={locationError}
      setLocationError={setLocationError}
    />,
    <FormWrapper>
      <ImageForm
        key="image-form"
        {...data}
        imagePreviewUrl={imagePreviewUrl}
        setImagePreviewUrl={setImagePreviewUrl}
        updateField={updateFields}
        eventThumbnailsUrls={eventThumbnailsUrls}
        eventImageUrls={eventImageUrls}
        thumbnailPreviewUrl={thumbnailPreviewUrl}
        setThumbnailPreviewUrl={setThumbnailPreviewUrl}
      />
    </FormWrapper>,
    <DescriptionForm key="description-image-form" {...data} updateField={updateFields} />,
    <PreviewForm
      key="preview-form"
      form={data}
      user={user}
      imagePreviewUrl={imagePreviewUrl}
      thumbnailPreviewUrl={thumbnailPreviewUrl}
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

    let formHasError = false;
    let errorMessage = "";

    if (isFirstStep) {
      if (data.location === "") {
        formHasError = true;
        errorMessage = "Location is required.";
      }
    }

    if (formHasError) {
      setHasError(true);
      setAlertMessage(errorMessage);
      setHasAlert(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  useEffect(() => {
    if (hasError) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [hasError]);

  async function createEventWorkflow(formData: FormData, user: UserData): Promise<EventId> {
    setLoading(true);
    const [imageUrl, thumbnailUrl] = await uploadAndGetImageAndThumbnailUrls(user.userId, { ...formData });

    const newEventData = await convertFormDataToEventData(formData, user, imageUrl, thumbnailUrl);
    const newRecurrenceData = formData.newRecurrenceData;
    let newEventId = "";
    try {
      if (newRecurrenceData.recurrenceEnabled) {
        const [firstEventId, newRecurrenceTemplateId] = await createRecurrenceTemplate(newEventData, newRecurrenceData);
        newEventId = firstEventId;
      } else {
        newEventId = await createEvent(newEventData);
      }
      await sendEmailOnCreateEvent(newEventId, newEventData.isPrivate ? "Private" : "Public");
    } catch (error) {
      if (error === "Rate Limited") {
        router.push("/error/CREATE_UPDATE_EVENT_RATELIMITED");
      } else if (error == "Sendgrid failed") {
        return newEventId;
      } else {
        router.push("/error");
      }
    }
    return newEventId;
  }

  async function convertFormDataToEventData(
    formData: FormData,
    user: UserData,
    imageUrl: string,
    thumbnailUrl: string
  ): Promise<NewEventData> {
    return {
      location: formData.location,
      capacity: formData.capacity,
      vacancy: formData.capacity,
      price: formData.price,
      name: formData.name,
      description: formData.description,
      image: imageUrl,
      thumbnail: thumbnailUrl,
      eventTags: formData.tags,
      isActive: true,
      isPrivate: formData.isPrivate,
      attendees: {},
      attendeesMetadata: {},
      accessCount: 0,
      organiserId: user.userId,
      registrationDeadline: convertDateAndTimeStringToTimestamp(
        formData.registrationEndDate,
        formData.registrationEndTime
      ),
      locationLatLng: {
        lat: formData.lat,
        lng: formData.long,
      },
      sport: formData.sport,
      paymentsActive: formData.paymentsActive,
      startDate: convertDateAndTimeStringToTimestamp(formData.startDate, formData.startTime),
      endDate: convertDateAndTimeStringToTimestamp(formData.endDate, formData.endTime),
      stripeFeeToCustomer: formData.stripeFeeToCustomer,
      promotionalCodesEnabled: formData.promotionalCodesEnabled,
      paused: formData.paused,
    };
  }

  function convertDateAndTimeStringToTimestamp(date: string, time: string): Timestamp {
    let dateObject = new Date(date);
    const timeArr = time.split(":");
    dateObject.setHours(parseInt(timeArr[0]));
    dateObject.setMinutes(parseInt(timeArr[1]));
    return Timestamp.fromDate(dateObject);
  }
  const handleAlertClose = () => {
    setHasError(false);
    setHasAlert(false);
    setAlertMessage("");
  };
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
            <Alert
              open={hasAlert}
              onClose={() => handleAlertClose()}
              color="red"
              className="absolute ml-auto mr-auto left-0 right-0 top-20 w-fit"
            >
              {AlertMessage !== "" ? AlertMessage : "Error Submitting Form"}
            </Alert>
            <div className="flex mt-8 w-11/12 lg:w-2/3 xl:w-full m-auto">
              {!isFirstStep && (
                <InvertedHighlightButton type="button" className="px-7" onClick={back}>
                  Back
                </InvertedHighlightButton>
              )}
              {!isLastStep && (
                //TODO: Add service layer protection
                <InvertedHighlightButton
                  type="submit"
                  className={`px-7 ml-auto lg:mr-2 ${hasError ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
                  disabled={hasError}
                >
                  Next
                </InvertedHighlightButton>
              )}
              {isLastStep && (
                <InvertedHighlightButton type="submit" className="px-7 ml-auto">
                  Create Event
                </InvertedHighlightButton>
              )}
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
