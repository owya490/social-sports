"use client";

import { CreateEventWorkbench } from "@/components/events/create/CreateEventWorkbench";
import {
  CREATE_EVENT_INITIAL_DATA,
  CreateEventFormData,
} from "@/components/events/create/createEventFormTypes";
import Loading from "@/components/loading/Loading";
import { useUser } from "@/components/utility/UserContext";
import { EventId, NewEventData } from "@/interfaces/EventTypes";
import { UserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { createEvent } from "@/services/src/events/eventsService";
import { buildNewEventInventory } from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import { clampMaxTicketsPerTransaction } from "@/services/src/events/eventsUtils/ticketLimits";
import {
  getImageAndThumbnailUrlsWithDefaults,
  getUsersEventImagesUrls,
  getUsersEventThumbnailsUrls,
} from "@/services/src/images/imageService";
import { sendEmailOnCreateEventV2 } from "@/services/src/loops/loopsService";
import { createRecurrenceTemplate } from "@/services/src/recurringEvents/recurringEventsService";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";

const createEventLogger = new Logger("CreateEvent");

/** @deprecated Use CreateEventFormData from createEventFormTypes */
export type FormData = CreateEventFormData;

export default function CreateEvent() {
  const { user } = useUser();
  const router = useRouter();
  const showForm = user.userId !== "";

  const [loading, setLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [hasAlert, setHasAlert] = useState(false);
  const [AlertMessage, setAlertMessage] = useState("");

  const [data, setData] = useState(CREATE_EVENT_INITIAL_DATA);

  const [eventThumbnailsUrls, setEventThumbnailUrls] = useState<string[]>([]);
  const [eventImageUrls, setEventImageUrls] = useState<string[]>([]);

  useEffect(() => {
    const fetchUserImages = async () => {
      setEventThumbnailUrls(await getUsersEventThumbnailsUrls(user.userId));
      setEventImageUrls(await getUsersEventImagesUrls(user.userId));
    };
    fetchUserImages();
  }, [user]);

  function updateFields(fields: Partial<CreateEventFormData>) {
    setData((prev) => {
      return { ...prev, ...fields };
    });
  }

  function validateForm(): boolean {
    const form = document.querySelector("form") as HTMLFormElement | null;
    if (form && !form.reportValidity()) {
      return false;
    }
    if (data.location === "") {
      setHasError(true);
      setAlertMessage("Location is required.");
      setHasAlert(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }
    if (hasError) {
      setHasAlert(true);
      setAlertMessage(AlertMessage || "Please fix the highlighted fields.");
      window.scrollTo({ top: 0, behavior: "smooth" });
      return false;
    }
    return true;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    try {
      const eventId = await createEventWorkflow(data, user);
      if (eventId !== null) {
        router.push(`/event/${eventId}`);
      }
    } catch (err) {
      createEventLogger.error(`Error creating event: ${err}`);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function createEventWorkflow(formData: CreateEventFormData, user: UserData): Promise<EventId | null> {
    setLoading(true);
    const [imageUrl, thumbnailUrl] = getImageAndThumbnailUrlsWithDefaults({ ...formData });

    const newEventData = convertFormDataToEventData(formData, user, imageUrl, thumbnailUrl);
    const newRecurrenceData = formData.newRecurrenceData;
    let newEventId: EventId | null = null;
    try {
      if (newRecurrenceData.recurrenceEnabled) {
        const [firstEventId] = await createRecurrenceTemplate(newEventData, newRecurrenceData);
        newEventId = firstEventId;
      } else {
        newEventId = await createEvent(newEventData);
      }
      if (newEventId === null) {
        return null;
      }
      await sendEmailOnCreateEventV2(newEventId, newEventData.isPrivate ? "Private" : "Public");
    } catch (error) {
      if (error === "Rate Limited") {
        router.push("/error/CREATE_UPDATE_EVENT_RATELIMITED");
        return null;
      } else if (error == "Sendgrid failed") {
        return newEventId;
      } else {
        router.push("/error");
        return null;
      }
    }
    return newEventId;
  }

  function convertFormDataToEventData(
    formData: CreateEventFormData,
    user: UserData,
    imageUrl: string,
    thumbnailUrl: string
  ): NewEventData {
    return {
      location: formData.location,
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
        lng: formData.lng,
      },
      sport: formData.sport,
      paymentsActive: formData.paymentsActive,
      startDate: convertDateAndTimeStringToTimestamp(formData.startDate, formData.startTime),
      endDate: convertDateAndTimeStringToTimestamp(formData.endDate, formData.endTime),
      stripeFeeToCustomer: formData.stripeFeeToCustomer,
      promotionalCodesEnabled: formData.promotionalCodesEnabled,
      paused: formData.paused,
      eventLink: formData.eventLink,
      hideVacancy: formData.hideVacancy,
      waitlistEnabled: formData.waitlistEnabled,
      bookingApprovalEnabled: formData.bookingApprovalEnabled,
      formId: formData.formId,
      showAttendeesOnEventPage: formData.showAttendeesOnEventPage,
      maxTicketsPerTransaction: clampMaxTicketsPerTransaction(
        formData.maxTicketsPerTransaction,
        formData.capacity
      ),
      ...buildNewEventInventory(formData.price, formData.capacity),
    };
  }

  function convertDateAndTimeStringToTimestamp(date: string, time: string): Timestamp {
    const dateObject = new Date(date);
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
    <>
      {/*
        THESIS: Compact create — thumbnail rail beside essentials on the footer shell.
        OWN-WORLD: Honest Clubhouse on white canvas; Satoshi; dense soft controls.
        STORY: Organiser names the session, sets when/where/price, creates with bookings open by default.
        FIRST VIEWPORT: Thumbnail + sport + Public|Private left; title; when/where; side-by-side options; Create.
        FORM: Luma density inside organiser tokens; site footer layout; deep edits in EventHubPanel.
      */}
      {!showForm ? (
        <div className="h-screen w-full flex justify-center items-center bg-background text-foreground font-sans">
          Please Login/ Register to Access
        </div>
      ) : (
        <CreateEventWorkbench
          data={data}
          user={user}
          updateField={updateFields}
          eventThumbnailsUrls={eventThumbnailsUrls}
          eventImageUrls={eventImageUrls}
          setThumbnailUrls={setEventThumbnailUrls}
          setImageUrls={setEventImageUrls}
          setLoading={setLoading}
          setHasError={setHasError}
          hasAlert={hasAlert}
          alertMessage={AlertMessage}
          onAlertClose={handleAlertClose}
          onSubmit={submit}
        />
      )}
    </>
  );
}
