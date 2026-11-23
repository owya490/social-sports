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
import { FormEvent, useState } from "react";

const GENDER_OPTIONS = [
  { value: "", label: "Prefer not to say" },
  { value: "Male", label: "Male" },
  { value: "Female", label: "Female" },
  { value: "Other", label: "Other" },
];

type ProfileDraft = {
  firstName: string;
  surname: string;
  location: string;
  gender: UserData["gender"];
  bio: string;
};

function draftFromUser(user: UserData): ProfileDraft {
  return {
    firstName: user.firstName || "",
    surname: user.surname || "",
    location: user.location || "",
    gender: user.gender || "",
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
  const [firstNameError, setFirstNameError] = useState<string | undefined>(undefined);
  const [formError, setFormError] = useState("");

  const updateDraft = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
    setFormError("");
    if (key === "firstName") {
      setFirstNameError(undefined);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!user.userId || submitting) return;

    const firstName = draft.firstName.trim();
    const surname = draft.surname.trim();

    if (!firstName) {
      setFirstNameError("Add your first name to continue.");
      return;
    }

    setFirstNameError(undefined);
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
            ? "Your name, photo, and bio show on your organiser profile."
            : "Your name and photo show on bookings and your public profile."}
        </p>
      </header>

      <form onSubmit={(event) => void handleSubmit(event)} noValidate className="space-y-4">
        <ProfileSection title="Personal details" description="Basics used across SPORTSHUB.">
          <ProfilePhotoPanel user={user} setUser={setUser} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <ProfileField label="First name" htmlFor="onboarding-first-name" error={firstNameError}>
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
          <ProfileSection title="Bio" description="Visible on your organiser profile when people find you.">
            <ProfileBioEditor value={draft.bio} onChange={(value) => updateDraft("bio", value)} />
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
