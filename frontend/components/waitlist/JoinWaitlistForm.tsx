"use client";

import { HeaderSectionResponse } from "@/components/forms/sections/header-section/HeaderSectionResponse";
import { TextSectionResponse } from "@/components/forms/sections/text-section/TextSectionResponse";
import { EventData } from "@/interfaces/EventTypes";
import { FormSectionType, TextSection } from "@/interfaces/FormTypes";

interface JoinWaitlistFormProps {
  eventData: EventData;
  fullName: string;
  email: string;
  emailError?: string;
  onFullNameChange: (value: string) => void;
  onEmailChange: (value: string) => void;
}

const JoinWaitlistForm = ({
  eventData,
  fullName,
  email,
  emailError,
  onFullNameChange,
  onEmailChange,
}: JoinWaitlistFormProps) => {
  const fullNameSection: TextSection = {
    type: FormSectionType.TEXT,
    question: "Full Name",
    imageUrl: null,
    required: true,
    answer: fullName,
  };

  const emailSection: TextSection = {
    type: FormSectionType.TEXT,
    question: "Email Address",
    imageUrl: null,
    required: true,
    answer: email,
  };

  // Build waitlist description as HTML rich text
  const waitlistDescription = `
    <p>This event is currently at capacity. Join the waitlist to be notified when spots become available.</p>
    <p><strong>Location:</strong> ${eventData.location}</p>
  `;

  return (
    <>
      <HeaderSectionResponse
        formTitle={`Join the Waitlist for ${eventData.name}`}
        formDescription={waitlistDescription}
        organiser={eventData.organiser}
      />
      <TextSectionResponse
        textSection={fullNameSection}
        answerOnChange={onFullNameChange}
        canEdit={true}
      />
      <div>
        <TextSectionResponse
          textSection={emailSection}
          answerOnChange={onEmailChange}
          canEdit={true}
        />
        {emailError && (
          <p className="text-red-500 text-sm mt-2 px-8">{emailError}</p>
        )}
      </div>
    </>
  );
};

export default JoinWaitlistForm;
