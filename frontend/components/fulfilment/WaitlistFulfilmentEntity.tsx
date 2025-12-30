"use client";

import FulfilmentEntityPage from "@/components/fulfilment/FulfilmentEntityPage";
import Loading from "@/components/loading/Loading";
import JoinWaitlistForm from "@/components/waitlist/JoinWaitlistForm";
import { EmptyEventData, EventData } from "@/interfaces/EventTypes";
import {
  FulfilmentEntityId,
  FulfilmentSessionId,
  GetFulfilmentSessionInfoResponse,
} from "@/interfaces/FulfilmentTypes";
import { Logger } from "@/observability/logger";
import { getEventById } from "@/services/src/events/eventsService";
import { EMAIL_VALIDATION_ERROR_MESSAGE, validateEmail } from "@/utilities/emailValidationUtils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface WaitlistFulfilmentEntityProps {
  fulfilmentSessionId: FulfilmentSessionId;
  fulfilmentEntityId: FulfilmentEntityId;
  eventId: string | null;
  fulfilmentSessionInfo: GetFulfilmentSessionInfoResponse | null;
  onNext: () => Promise<void>;
  onPrev: () => Promise<void>;
  logger: Logger;
}

const WaitlistFulfilmentEntity = ({
  fulfilmentSessionId,
  fulfilmentEntityId,
  eventId,
  fulfilmentSessionInfo,
  onNext,
  onPrev,
  logger,
}: WaitlistFulfilmentEntityProps) => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [eventData, setEventData] = useState<EventData>(EmptyEventData);
  const [isSaving, setIsSaving] = useState(false);

  // Form state
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  // Validation - check both fields are filled and email is valid format
  const isValidEmail = validateEmail(email);
  const areAllRequiredFieldsFilled = fullName.trim() !== "" && email.trim() !== "" && isValidEmail;

  useEffect(() => {
    if (isValidEmail) {
      setEmailError("");
    } else {
      setEmailError(EMAIL_VALIDATION_ERROR_MESSAGE);
    }
  }, [isValidEmail]);

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

  const handleSaveAndNext = async () => {
    if (!areAllRequiredFieldsFilled) return;

    setIsSaving(true);
    try {
      // TODO: Save waitlist entry to backend when service is implemented
      logger.info(
        `WaitlistFulfilmentEntity: Saving waitlist entry for fulfilmentSessionId: ${fulfilmentSessionId}, fulfilmentEntityId: ${fulfilmentEntityId}, fullName: ${fullName}, email: ${email}`
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
      onNext={handleSaveAndNext}
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
              emailError={emailError}
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
