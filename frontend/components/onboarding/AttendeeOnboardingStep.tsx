"use client";

import OnboardingStepNav from "@/components/onboarding/OnboardingStepNav";
import {
  ProfileBioEditor,
  ProfileField,
  ProfileSection,
  ProfileSelect,
  ProfileTextInput,
} from "@/components/users/profile/ProfileFormControls";
import { ProfilePhotoPanel } from "@/components/users/profile/ProfilePhotoPanel";
import { useUser } from "@/components/utility/UserContext";
import { OnboardingPersona, UserData } from "@/interfaces/UserTypes";
import { updateUser } from "@/services/src/users/usersService";
import { EMAIL_VALIDATION_ERROR_MESSAGE, validateEmail } from "@/utilities/emailValidationUtils";
import { PHONE_VALIDATION_ERROR_MESSAGE, validatePhoneNumber } from "@/utilities/phoneValidationUtils";
import { FormEvent, useState } from "react";

type ProfileDraft = {
  firstName: string;
  surname: string;
  location: string;
  gender: UserData["gender"];
  contactEmail: string;
  contactPhone: string;
  bio: string;
};

const GENDER_OPTIONS = [
  { value: "", label: "Prefer not to say" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

function draftFromUser(user: UserData): ProfileDraft {
  return {
    firstName: user.firstName || "",
    surname: user.surname || "",
    location: user.location || "",
    gender: user.gender || "",
    contactEmail: user.publicContactInformation?.email || "",
    contactPhone: user.publicContactInformation?.mobile || "",
    bio: user.bio || "",
  };
}

export default function AttendeeOnboardingStep({
  persona,
  onBack,
  onComplete,
  completeLabel,
}: {
  persona: OnboardingPersona;
  onBack: () => void;
  onComplete: () => Promise<void>;
  completeLabel: string;
}) {
  const { user, setUser, refreshUser } = useUser();
  const [draft, setDraft] = useState<ProfileDraft>(() => draftFromUser(user));
  const [submitting, setSubmitting] = useState(false);
  const [firstNameError, setFirstNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [formError, setFormError] = useState("");

  const updateDraft = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setFormError("");
    if (key === "firstName") setFirstNameError("");
    if (key === "contactEmail") setEmailError("");
    if (key === "contactPhone") setPhoneError("");
  };

  const saveProfileAndFinish = async (event: FormEvent) => {
    event.preventDefault();
    if (!user.userId || submitting) return;

    const trimmedFirst = draft.firstName.trim();
    const trimmedSurname = draft.surname.trim();
    const trimmedEmail = draft.contactEmail.trim();
    const trimmedPhone = draft.contactPhone.trim();

    const nextFirstNameError = trimmedFirst ? "" : "Add your first name to continue.";
    const nextEmailError =
      persona === "organiser" && trimmedEmail && !validateEmail(trimmedEmail) ? EMAIL_VALIDATION_ERROR_MESSAGE : "";
    const nextPhoneError =
      persona === "organiser" && trimmedPhone && !validatePhoneNumber(trimmedPhone)
        ? PHONE_VALIDATION_ERROR_MESSAGE
        : "";

    setFirstNameError(nextFirstNameError);
    setEmailError(nextEmailError);
    setPhoneError(nextPhoneError);
    if (nextFirstNameError || nextEmailError || nextPhoneError) return;

    setFormError("");
    setSubmitting(true);
    try {
      const nameTokens = `${trimmedFirst} ${trimmedSurname}`.trim().toLowerCase().split(/\s+/).filter(Boolean);
      if (persona === "organiser") {
        await updateUser(user.userId, {
          firstName: trimmedFirst,
          surname: trimmedSurname,
          nameTokens,
          bio: draft.bio,
          publicContactInformation: {
            ...user.publicContactInformation,
            email: trimmedEmail,
            mobile: trimmedPhone,
          },
        });
      } else {
        await updateUser(user.userId, {
          firstName: trimmedFirst,
          surname: trimmedSurname,
          nameTokens,
          location: draft.location.trim(),
          gender: draft.gender,
        });
      }
      await refreshUser();
      await onComplete();
    } catch {
      setFormError("Could not save your profile. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Add your profile</h1>
        <p className="mt-1.5 text-sm text-gray-700 sm:mt-3 sm:text-base">
          {persona === "organiser"
            ? "Your name and contact details show on your organiser profile."
            : "Your name and photo show on bookings and your public profile."}
        </p>
      </div>

      <form onSubmit={(event) => void saveProfileAndFinish(event)} noValidate className="space-y-4">
        {persona === "attendee" ? (
          <ProfileSection title="Photo" description="This image appears on your public profile and events.">
            <ProfilePhotoPanel user={user} setUser={setUser} />
          </ProfileSection>
        ) : null}

        <ProfileSection title="Personal details" description="Basics used across SPORTSHUB.">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ProfileField label="First name" htmlFor="onboarding-first-name" error={firstNameError || undefined}>
              <ProfileTextInput
                id="onboarding-first-name"
                value={draft.firstName}
                onChange={(value) => updateDraft("firstName", value)}
                autoComplete="given-name"
                invalid={Boolean(firstNameError)}
                disabled={submitting}
              />
            </ProfileField>
            <ProfileField label="Last name" htmlFor="onboarding-last-name">
              <ProfileTextInput
                id="onboarding-last-name"
                value={draft.surname}
                onChange={(value) => updateDraft("surname", value)}
                placeholder="Optional"
                autoComplete="family-name"
                disabled={submitting}
              />
            </ProfileField>
            {persona === "attendee" ? (
              <>
                <ProfileField label="Location" htmlFor="onboarding-location">
                  <ProfileTextInput
                    id="onboarding-location"
                    value={draft.location}
                    onChange={(value) => updateDraft("location", value)}
                    placeholder="Suburb or city"
                    autoComplete="address-level2"
                    disabled={submitting}
                  />
                </ProfileField>
                <ProfileField label="Gender" htmlFor="onboarding-gender">
                  <ProfileSelect
                    id="onboarding-gender"
                    value={draft.gender}
                    onChange={(value) => updateDraft("gender", value as UserData["gender"])}
                    options={GENDER_OPTIONS}
                    disabled={submitting}
                  />
                </ProfileField>
              </>
            ) : null}
          </div>
        </ProfileSection>

        {persona === "organiser" ? (
          <ProfileSection title="Public info" description="Visible on your organiser profile when people find you.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileField label="Contact email" htmlFor="onboarding-contact-email" error={emailError || undefined}>
                <ProfileTextInput
                  id="onboarding-contact-email"
                  type="email"
                  value={draft.contactEmail}
                  onChange={(value) => updateDraft("contactEmail", value)}
                  placeholder="public@email.com"
                  autoComplete="email"
                  invalid={Boolean(emailError)}
                  disabled={submitting}
                />
              </ProfileField>
              <ProfileField
                label="Phone number"
                htmlFor="onboarding-contact-phone"
                hint="Digits only."
                error={phoneError || undefined}
              >
                <ProfileTextInput
                  id="onboarding-contact-phone"
                  value={draft.contactPhone}
                  onChange={(value) => {
                    if (/^\d*$/.test(value)) updateDraft("contactPhone", value);
                  }}
                  inputMode="numeric"
                  placeholder="04…"
                  invalid={Boolean(phoneError)}
                  disabled={submitting}
                />
              </ProfileField>
              <div className="sm:col-span-2 space-y-1.5">
                <p className="text-xs font-medium text-foreground-muted font-sans">Bio</p>
                <ProfileBioEditor value={draft.bio} onChange={(value) => updateDraft("bio", value)} />
              </div>
            </div>
          </ProfileSection>
        ) : null}

        {formError ? <p className="text-sm text-red-700">{formError}</p> : null}

        <OnboardingStepNav
          onBack={onBack}
          primaryType="submit"
          primaryLabel={submitting ? "Working…" : completeLabel}
          disabled={submitting}
        />
      </form>
    </div>
  );
}
