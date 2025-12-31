"use client";

import FulfilmentEntityPage from "@/components/fulfilment/FulfilmentEntityPage";
import Loading from "@/components/loading/Loading";
import JoinWaitlistForm from "@/components/waitlist/JoinWaitlistForm";
import { EmptyEventData, EventData, EventId } from "@/interfaces/EventTypes";
import {
  FulfilmentEntityId,
  FulfilmentSessionId,
  GetFulfilmentSessionInfoResponse,
} from "@/interfaces/FulfilmentTypes";
import { Logger } from "@/observability/logger";
import { getEventById } from "@/services/src/events/eventsService";
import { getErrorUrl } from "@/services/src/urlUtils";
import { updateFulfilmentEntityWithWaitlistData } from "@/services/src/waitlist/waitlistService";
import { EMAIL_VALIDATION_ERROR_MESSAGE, validateEmail } from "@/utilities/emailValidationUtils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";


interface WaitlistFulfilmentEntityProps {
  fulfilmentSessionId: FulfilmentSessionId;
  fulfilmentEntityId: FulfilmentEntityId;
  eventId: EventId | null;
  fulfilmentSessionInfo: GetFulfilmentSessionInfoResponse | null;
  onNext: () => Promise<void>;
  onPrev: () => Promise<void>;
}

const WaitlistFulfilmentEntity = ({
  fulfilmentSessionId,
  fulfilmentEntityId,
  eventId,
  fulfilmentSessionInfo,
  onNext,
  onPrev,
}: WaitlistFulfilmentEntityProps) => {
  const logger = new Logger("WaitlistFulfilmentEntityLogger");
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<EventData>(EmptyEventData);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Validation - check both fields are filled and email is valid format
  const isValidEmail = validateEmail(email);
  const areAllRequiredFieldsFilled = fullName.trim() !== "" && email.trim() !== "" && isValidEmail;

  useEffect(() => {
    if (isValidEmail || email.trim() === "") {
      setErrorMessage("");
    } else {
      setErrorMessage(EMAIL_VALIDATION_ERROR_MESSAGE);
    }
  }, [email]);

  // Handle email change with validation
  const handleEmailChange = (value: string) => {
    setEmail(value);
  };

  // Determine navigation based on current position
  const currentIndex = fulfilmentSessionInfo?.currentEntityIndex ?? 0;
  const totalEntities = fulfilmentSessionInfo?.fulfilmentEntityTypes?.length ?? 0;
  const isFirstEntity = currentIndex === 0;
  const isLastEntity = currentIndex === totalEntities - 1;

  useEffect(() => {
    const fetchEventData = async () => {
      if (!eventId) {
        logger.error(`WaitlistFulfilmentEntity: eventId is null`);
        router.push("/error");
        return;
      }

      try {
        const event = await getEventById(eventId);
        setEventData(event);
      } catch (error) {
        logger.error(`WaitlistFulfilmentEntity: Error fetching event data: ${error}`);
        router.push("/error");
        return;
      } finally {
        setLoading(false);
      }
    };

    fetchEventData();
  }, []);

  const onWaitlistFulfilmentEntitySaveAndNext = async (): Promise<void> => {
    if (!areAllRequiredFieldsFilled) return;

    setIsSaving(true);
    try {
      const response = await updateFulfilmentEntityWithWaitlistData(
        fulfilmentSessionId,
        fulfilmentEntityId,
        fullName,
        email
      );
      if (!response.success) {
        logger.error(`WaitlistFulfilmentEntity: Failed to update waitlist entry: ${response.message}`);
        router.push(getErrorUrl(new Error(response.message)));
        return;
      }

      logger.info(
        `WaitlistFulfilmentEntity: Waitlist entry saved with fulfilmentSessionId: ${fulfilmentSessionId}, fulfilmentEntityId: ${fulfilmentEntityId}`
      );

      await onNext();
    } catch (error) {
      logger.error(`WaitlistFulfilmentEntity: Error saving waitlist entry: ${error}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <FulfilmentEntityPage
      onNext={onWaitlistFulfilmentEntitySaveAndNext}
      onPrev={onPrev}
      showPrevButton={!isFirstEntity}
      showNextButton={!isLastEntity}
      fulfilmentSessionInfo={fulfilmentSessionInfo}
      areAllRequiredFieldsFilled={areAllRequiredFieldsFilled}
      isSaving={isSaving}
      fulfilmentSessionId={fulfilmentSessionId}
    >
      <div className="bg-core-hover">
        <div className="flex w-screen justify-center">
          <div className="screen-width-primary space-y-8 md:px-32">
            <JoinWaitlistForm
              eventData={eventData}
              fullName={fullName}
              email={email}
              errorMessage={errorMessage}
              onFullNameChange={setFullName}
              onEmailChange={handleEmailChange}
            />
          </div>
        </div>
      </div>
    </FulfilmentEntityPage>
  );
};

export default WaitlistFulfilmentEntity;
