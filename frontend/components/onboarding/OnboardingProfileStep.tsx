"use client";

import OnboardingStepNav from "@/components/onboarding/OnboardingStepNav";
import {
  PROFILE_GENDER_OPTIONS,
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

type FieldErrors = {
  firstName?: string;
  contactEmail?: string;
  contactPhone?: string;
};

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

export default function OnboardingProfileStep({
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
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState("");

  const updateDraft = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setFormError("");
    if (key === "firstName" || key === "contactEmail" || key === "contactPhone") {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user.userId || submitting) return;

    const firstName = draft.firstName.trim();
    const surname = draft.surname.trim();
    const contactEmail = draft.contactEmail.trim();
    const contactPhone = draft.contactPhone.trim();

    const nextErrors: FieldErrors = {
      firstName: firstName ? undefined : "Add your first name to continue.",
      contactEmail:
        persona === "organiser" && contactEmail && !validateEmail(contactEmail)
          ? EMAIL_VALIDATION_ERROR_MESSAGE
          : undefined,
      contactPhone:
        persona === "organiser" && contactPhone && !validatePhoneNumber(contactPhone)
          ? PHONE_VALIDATION_ERROR_MESSAGE
          : undefined,
    };

    setErrors(nextErrors);
    if (nextErrors.firstName || nextErrors.contactEmail || nextErrors.contactPhone) return;

    setFormError("");
    setSubmitting(true);
    try {
      const nameTokens = `${firstName} ${surname}`.trim().toLowerCase().split(/\s+/).filter(Boolean);
      const patch: Partial<UserData> =
        persona === "organiser"
          ? {
              firstName,
              surname,
              nameTokens,
              bio: draft.bio,
              publicContactInformation: {
                ...user.publicContactInformation,
                email: contactEmail,
                mobile: contactPhone,
              },
            }
          : {
              firstName,
              surname,
              nameTokens,
              location: draft.location.trim(),
              gender: draft.gender,
            };

      await updateUser(user.userId, patch);
      await refreshUser();
      await onComplete();
    } catch {
      setFormError("Could not save your profile. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">Add your profile</h1>
        <p className="mt-1.5 text-sm text-foreground-secondary sm:text-base">
          {persona === "organiser"
            ? "Your name and contact details show on your organiser profile."
            : "Your name and photo show on bookings and your public profile."}
        </p>
      </header>

      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-4">
        {persona === "attendee" ? (
          <ProfileSection title="Photo" description="This image appears on your public profile and events.">
            <ProfilePhotoPanel user={user} setUser={setUser} />
          </ProfileSection>
        ) : null}

        <ProfileSection title="Personal details" description="Basics used across SPORTSHUB.">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileField label="First name" htmlFor="onboarding-first-name" error={errors.firstName}>
              <ProfileTextInput
                id="onboarding-first-name"
                value={draft.firstName}
                onChange={(value) => updateDraft("firstName", value)}
                autoComplete="given-name"
                invalid={Boolean(errors.firstName)}
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
                    options={PROFILE_GENDER_OPTIONS}
                    disabled={submitting}
                  />
                </ProfileField>
              </>
            ) : null}
          </div>
        </ProfileSection>

        {persona === "organiser" ? (
          <ProfileSection title="Public info" description="Visible on your organiser profile when people find you.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <ProfileField label="Contact email" htmlFor="onboarding-contact-email" error={errors.contactEmail}>
                <ProfileTextInput
                  id="onboarding-contact-email"
                  type="email"
                  value={draft.contactEmail}
                  onChange={(value) => updateDraft("contactEmail", value)}
                  placeholder="public@email.com"
                  autoComplete="email"
                  invalid={Boolean(errors.contactEmail)}
                  disabled={submitting}
                />
              </ProfileField>
              <ProfileField
                label="Phone number"
                htmlFor="onboarding-contact-phone"
                hint="Digits only."
                error={errors.contactPhone}
              >
                <ProfileTextInput
                  id="onboarding-contact-phone"
                  value={draft.contactPhone}
                  onChange={(value) => {
                    if (/^\d*$/.test(value)) updateDraft("contactPhone", value);
                  }}
                  inputMode="numeric"
                  placeholder="04…"
                  invalid={Boolean(errors.contactPhone)}
                  disabled={submitting}
                />
              </ProfileField>
              <div className="space-y-1.5 sm:col-span-2">
                <p className="text-xs font-medium text-foreground-muted">Bio</p>
                <ProfileBioEditor value={draft.bio} onChange={(value) => updateDraft("bio", value)} />
              </div>
            </div>
          </ProfileSection>
        ) : null}

        {formError ? <p className="text-sm text-danger">{formError}</p> : null}

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
