"use client";

import { CreateEventWorkbench } from "@/components/events/create/CreateEventWorkbench";
import {
  createEventInitialData,
  CreateEventFormData,
} from "@/components/events/create/createEventFormTypes";
import Loading from "@/components/loading/Loading";
import { useUser } from "@/components/utility/UserContext";
import { EventId, NewEventData } from "@/interfaces/EventTypes";
import { UserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { createEvent } from "@/services/src/events/eventsService";
import { bustOrganiserEventsCache } from "@/services/src/organiser/organiserEventsService";
import { buildNewEventInventory } from "@/services/src/events/eventsUtils/eventTicketTypesUtils";
import { clampMaxTicketsPerTransaction } from "@/services/src/events/eventsUtils/ticketLimits";
import {
  getImageAndThumbnailUrlsWithDefaults,
  getUsersEventImagesUrls,
  getUsersEventThumbnailsUrls,
} from "@/services/src/images/imageService";
import { sendEmailOnCreateEventV2 } from "@/services/src/loops/loopsService";
import { createRecurrenceTemplate } from "@/services/src/recurringEvents/recurringEventsService";
import { dateAndTimeInLocalToTimestamp } from "@/services/src/datetimeUtils";
import { withInactiveStripePaymentDefaults } from "@/services/src/stripe/stripeUtils";
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

  const [data, setData] = useState(createEventInitialData);

  const [eventThumbnailsUrls, setEventThumbnailUrls] = useState<string[]>([]);
  const [eventImageUrls, setEventImageUrls] = useState<string[]>([]);
  const eventFormData = withInactiveStripePaymentDefaults(data, user.stripeAccountActive);

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

  function onSubmitFailure(message: string) {
    setLoading(false);
    setHasError(true);
    setHasAlert(true);
    setAlertMessage(message);
    window.scrollTo({ top: 0, behavior: "smooth" });
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
      const eventId = await createEventWorkflow(eventFormData, user);
      if (eventId !== null) {
        router.push(`/organiser/v2/event/${eventId}`);
      }
      // null: workflow already alerted (stay on page) or redirected (loading cleared, no alert)
    } catch (err) {
      createEventLogger.error(`Error creating event: ${err}`);
      onSubmitFailure("Failed to create event. Please try again.");
    }
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
        onSubmitFailure("Failed to create event. Please try again.");
        return null;
      }
      bustOrganiserEventsCache();
      await sendEmailOnCreateEventV2(newEventId, newEventData.isPrivate ? "Private" : "Public");
    } catch (error) {
      if (error === "Rate Limited") {
        setLoading(false);
        router.push("/error/CREATE_UPDATE_EVENT_RATELIMITED");
        return null;
      } else if (error == "Sendgrid failed") {
        return newEventId;
      } else {
        setLoading(false);
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
    const paymentFields = withInactiveStripePaymentDefaults(formData, user.stripeAccountActive);
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
      paymentsActive: paymentFields.paymentsActive,
      startDate: convertDateAndTimeStringToTimestamp(formData.startDate, formData.startTime),
      endDate: convertDateAndTimeStringToTimestamp(formData.endDate, formData.endTime),
      stripeFeeToCustomer: paymentFields.stripeFeeToCustomer,
      promotionalCodesEnabled: paymentFields.promotionalCodesEnabled,
      paused: formData.paused,
      eventLink: formData.eventLink,
      hideVacancy: formData.hideVacancy,
      waitlistEnabled: formData.waitlistEnabled,
      bookingApprovalEnabled: paymentFields.bookingApprovalEnabled,
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
    return dateAndTimeInLocalToTimestamp(date, time);
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
          data={eventFormData}
          user={user}
          updateField={updateFields}
          eventThumbnailsUrls={eventThumbnailsUrls}
          eventImageUrls={eventImageUrls}
          setThumbnailUrls={setEventThumbnailUrls}
          setImageUrls={setEventImageUrls}
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
