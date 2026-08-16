"use client";

import Loading from "@/components/loading/Loading";
import { EmailChangeModal } from "@/components/users/profile/EmailChangeModal";
import {
  ProfileBioEditor,
  ProfileField,
  ProfileReadonlyField,
  ProfileSection,
  ProfileSelect,
  ProfileTextInput,
} from "@/components/users/profile/ProfileFormControls";
import { ProfilePhotoPanel } from "@/components/users/profile/ProfilePhotoPanel";
import { useUser } from "@/components/utility/UserContext";
import { UserData } from "@/interfaces/UserTypes";
import { Logger } from "@/observability/logger";
import { updateUser } from "@/services/src/users/usersService";
import { bustUserLocalStorageCache } from "@/services/src/users/usersUtils/getUsersUtils";
import { updateUsername } from "@/services/src/users/usersUtils/usernameUtils";
import { convertDateToInput, convertInputToDate } from "@/utilities/profileDateUtils";
import Tick from "@svgs/Verified_tick.png";
import Image from "next/image";
import { FormEvent, useEffect, useMemo, useState } from "react";

const logger = new Logger("ProfileEditPage");

type ProfileDraft = {
  firstName: string;
  surname: string;
  location: string;
  dob: string;
  gender: UserData["gender"];
  publicEmail: string;
  publicMobile: string;
  bio: string;
  username: string;
  privateMobile: string;
  isSearchable: boolean;
};

function draftFromUser(user: UserData): ProfileDraft {
  return {
    firstName: user.firstName || "",
    surname: user.surname || "",
    location: user.location || "",
    dob: user.dob || "",
    gender: user.gender || "",
    publicEmail: user.publicContactInformation?.email || "",
    publicMobile: user.publicContactInformation?.mobile || "",
    bio: user.bio || "",
    username: user.username || "",
    privateMobile: user.contactInformation?.mobile || "",
    isSearchable: Boolean(user.isSearchable),
  };
}

const Profile = () => {
  const { user, setUser } = useUser();
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<ProfileDraft | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [usernameWarning, setUsernameWarning] = useState(false);
  const [emailChangeModalOpened, setEmailChangeModalOpened] = useState(false);

  useEffect(() => {
    if (user.userId !== "") {
      window.scrollTo(0, 0);
      setDraft(draftFromUser(user));
      setLoading(false);
    }
  }, [user]);

  const isDirty = useMemo(() => {
    if (!draft || !user.userId) return false;
    const baseline = draftFromUser(user);
    return JSON.stringify(draft) !== JSON.stringify(baseline);
  }, [draft, user]);

  const updateDraft = <K extends keyof ProfileDraft>(key: K, value: ProfileDraft[K]) => {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
    setSaveSuccess(false);
    setSaveError("");
    if (key === "username") setUsernameWarning(false);
  };

  const handleReset = () => {
    setDraft(draftFromUser(user));
    setSaveError("");
    setSaveSuccess(false);
    setUsernameWarning(false);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!draft || !user.userId || saving) return;

    setSaving(true);
    setSaveError("");
    setSaveSuccess(false);
    setUsernameWarning(false);

    try {
      const usernameChanged = draft.username !== user.username;
      if (usernameChanged) {
        const usernameOk = await updateUsername(user.userId, draft.username);
        if (!usernameOk) {
          setUsernameWarning(true);
          setSaveError("That username is taken. Try another.");
          setSaving(false);
          return;
        }
      }

      const patch: Partial<UserData> = {
        firstName: draft.firstName.trim(),
        surname: draft.surname.trim(),
        location: draft.location.trim(),
        dob: draft.dob,
        gender: draft.gender,
        bio: draft.bio,
        isSearchable: draft.isSearchable,
        nameTokens: draft.firstName.trim().toLowerCase().split(/\s+/).filter(Boolean),
        publicContactInformation: {
          ...user.publicContactInformation,
          email: draft.publicEmail.trim(),
          mobile: draft.publicMobile.trim(),
        },
        contactInformation: {
          ...user.contactInformation,
          mobile: draft.privateMobile.trim(),
        },
      };

      await updateUser(user.userId, patch);

      setUser({
        ...user,
        ...patch,
        username: draft.username,
        publicContactInformation: patch.publicContactInformation!,
        contactInformation: patch.contactInformation!,
      });
      bustUserLocalStorageCache();
      setSaveSuccess(true);
    } catch (error) {
      logger.error(`Failed to save profile: ${error}`);
      setSaveError("Couldn't save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !draft) {
    return <Loading />;
  }

  return (
    <div className="min-h-screen bg-surface text-foreground pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8">
        <header className="mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight font-sans leading-tight">
              Profile
            </h1>
            {user.isVerifiedOrganiser ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-surface-muted px-2 py-1 text-xs font-semibold text-foreground font-sans">
                <Image src={Tick} alt="" className="h-4 w-4" />
                Verified organiser
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-sm text-foreground-secondary font-sans">
            Keep your public profile and private details up to date.
          </p>
        </header>

        <form onSubmit={handleSave} className="space-y-4">
          <ProfileSection title="Photo" description="This image appears on your public profile and events.">
            <ProfilePhotoPanel user={user} setUser={setUser} />
          </ProfileSection>

          <ProfileSection title="Personal details" description="Basics used across SPORTSHUB.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileField label="First name" htmlFor="profile-first-name">
                <ProfileTextInput
                  id="profile-first-name"
                  value={draft.firstName}
                  onChange={(v) => updateDraft("firstName", v)}
                  autoComplete="given-name"
                />
              </ProfileField>
              <ProfileField label="Last name" htmlFor="profile-last-name">
                <ProfileTextInput
                  id="profile-last-name"
                  value={draft.surname}
                  onChange={(v) => updateDraft("surname", v)}
                  placeholder="Optional"
                  autoComplete="family-name"
                />
              </ProfileField>
              <ProfileField label="Location" htmlFor="profile-location">
                <ProfileTextInput
                  id="profile-location"
                  value={draft.location}
                  onChange={(v) => updateDraft("location", v)}
                  placeholder="Suburb or city"
                  autoComplete="address-level2"
                />
              </ProfileField>
              <ProfileField label="Date of birth" htmlFor="profile-dob">
                <ProfileTextInput
                  id="profile-dob"
                  type="date"
                  value={convertDateToInput(draft.dob)}
                  onChange={(v) => updateDraft("dob", convertInputToDate(v))}
                />
              </ProfileField>
              <ProfileField label="Gender" htmlFor="profile-gender" className="sm:col-span-2">
                <ProfileSelect
                  id="profile-gender"
                  value={draft.gender}
                  onChange={(v) => updateDraft("gender", v as UserData["gender"])}
                  options={[
                    { value: "", label: "Prefer not to say" },
                    { value: "Male", label: "Male" },
                    { value: "Female", label: "Female" },
                    { value: "Other", label: "Other" },
                  ]}
                />
              </ProfileField>
            </div>
          </ProfileSection>

          <ProfileSection
            title="Public info"
            description="Visible on your organiser profile when people find you."
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileField label="Contact email" htmlFor="profile-public-email">
                <ProfileTextInput
                  id="profile-public-email"
                  type="email"
                  value={draft.publicEmail}
                  onChange={(v) => updateDraft("publicEmail", v)}
                  placeholder="public@email.com"
                  autoComplete="email"
                />
              </ProfileField>
              <ProfileField label="Phone number" htmlFor="profile-public-mobile" hint="Digits only.">
                <ProfileTextInput
                  id="profile-public-mobile"
                  value={draft.publicMobile}
                  onChange={(v) => {
                    if (/^\d*$/.test(v)) updateDraft("publicMobile", v);
                  }}
                  inputMode="numeric"
                  placeholder="04…"
                />
              </ProfileField>
              <div className="sm:col-span-2 space-y-1.5">
                <p className="text-xs font-medium text-foreground-muted font-sans">Bio</p>
                <ProfileBioEditor value={draft.bio} onChange={(v) => updateDraft("bio", v)} />
              </div>
            </div>
          </ProfileSection>

          <ProfileSection title="Account" description="Private details for signing in and support.">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ProfileReadonlyField label="User ID" value={user.userId} />
              <ProfileField
                label="Username"
                htmlFor="profile-username"
                hint={usernameWarning ? "Username update failed — try another." : undefined}
              >
                <ProfileTextInput
                  id="profile-username"
                  value={draft.username}
                  onChange={(v) => updateDraft("username", v)}
                  prefix="@"
                  autoComplete="username"
                />
              </ProfileField>
              <ProfileReadonlyField
                label="Private email"
                value={user.contactInformation.email}
                action={
                  <button
                    type="button"
                    onClick={() => setEmailChangeModalOpened(true)}
                    className="text-xs font-semibold text-foreground font-sans hover:underline"
                  >
                    Change
                  </button>
                }
              />
              <ProfileField label="Private phone number" htmlFor="profile-private-mobile" hint="Digits only.">
                <ProfileTextInput
                  id="profile-private-mobile"
                  value={draft.privateMobile}
                  onChange={(v) => {
                    if (/^\d*$/.test(v)) updateDraft("privateMobile", v);
                  }}
                  inputMode="numeric"
                />
              </ProfileField>
            </div>
          </ProfileSection>

          <ProfileSection title="Visibility" description="Control whether others can find your profile.">
            <div className="flex items-start gap-4">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground font-sans">Publicly searchable</p>
                <p className="mt-1 text-xs text-foreground-muted font-sans leading-relaxed">
                  Allow your profile to appear when people search for organisers on SPORTSHUB.
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={draft.isSearchable}
                aria-label="Publicly searchable"
                onClick={() => updateDraft("isSearchable", !draft.isSearchable)}
                className={`relative shrink-0 h-5 w-9 rounded-full transition-colors ${
                  draft.isSearchable ? "bg-foreground" : "bg-surface-muted"
                }`}
              >
                <span
                  aria-hidden
                  className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-background border border-border transition-transform duration-200 ease-out ${
                    draft.isSearchable ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </ProfileSection>

          <div className="rounded-xl border border-border bg-background px-4 sm:px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between sticky bottom-4 shadow-[0_-8px_28px_rgba(10,10,10,0.06)]">
            <div className="min-w-0">
              {saveError ? (
                <p className="text-xs text-danger font-sans">{saveError}</p>
              ) : saveSuccess && !isDirty ? (
                <p className="text-xs text-foreground-secondary font-sans">Profile saved.</p>
              ) : (
                <p className="text-xs text-foreground-muted font-sans">
                  {isDirty ? "You have unsaved changes." : "Save once to update your shared profile."}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleReset}
                disabled={!isDirty || saving}
                className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-semibold text-foreground font-sans hover:bg-surface-hover disabled:opacity-50"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={!isDirty || saving}
                className="rounded-xl bg-foreground px-4 py-2.5 text-sm font-semibold text-background font-sans hover:opacity-90 disabled:opacity-50"
              >
                {saving ? "Saving…" : "Save changes"}
              </button>
            </div>
          </div>
        </form>
      </div>

      <EmailChangeModal
        isOpen={emailChangeModalOpened}
        onClose={() => setEmailChangeModalOpened(false)}
        currentEmail={user.contactInformation.email}
      />
    </div>
  );
};

export default Profile;
