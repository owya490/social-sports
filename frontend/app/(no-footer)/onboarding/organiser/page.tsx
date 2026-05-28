"use client";

import { HighlightButton } from "@/components/elements/HighlightButton";
import StripeSetup from "@/components/elements/StripeSetup";
import { OrganiserOnboardingProfileFields } from "@/components/onboarding/OrganiserOnboardingProfileFields";
import { ProfilePhotoPanel } from "@/components/users/profile/ProfilePhotoPanel";
import { useUser } from "@/components/utility/UserContext";
import { UserData, UserId } from "@/interfaces/UserTypes";
import {
  clearOnboardingPersonaChoice,
  markProductOnboardingCompleted,
  skipProductOnboarding,
  syncStripeConnectSetupCompletedIfNeeded,
  updateUser,
} from "@/services/src/users/usersService";
import { DEFAULT_USER_PROFILE_PICTURE } from "@/services/src/users/usersConstants";
import { bustUserLocalStorageCache } from "@/services/src/users/usersUtils/getUsersUtils";
import {
  hasCompletedStripeConnectSetup,
  hasProvisionedFirestoreProfile,
  needsOrganiserOnboarding,
  SKIP_PRODUCT_ONBOARDING_CONFIRM_MESSAGE,
} from "@/utilities/onboardingUtils";
import { CheckIcon } from "@heroicons/react/20/solid";
import { Timestamp } from "firebase/firestore";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";

const PROCEED_WITHOUT_PAYMENT_SETUP_MESSAGE =
  "You haven\u2019t connected payouts for paid tickets yet. Free events still work — you\u2019ll only need this when you want to sell tickets or charge for sessions. You can finish anytime from your profile or organiser tools.\n\nContinue anyway?";

const PROCEED_TO_EVENT_BUILDER_MESSAGE =
  "You haven\u2019t connected payouts for paid tickets yet. Free events still work — you\u2019ll only need this when you want to sell tickets or charge for sessions. You can finish anytime from your profile or organiser tools.\n\nOpen the event builder anyway?";

type Step = 1 | 2 | 3;

function stepFromSearchParams(searchParams: URLSearchParams | null): Step {
  const raw = searchParams?.get("step");
  if (raw === "2") return 2;
  if (raw === "3") return 3;
  return 1;
}

/** Fields editable on organiser onboarding profile step — snapshot detects “still skippable”. */
type ProfileStepBaseline = Pick<UserData, "profilePicture" | "firstName" | "surname" | "username" | "location" | "bio" | "isSearchable">;

function pickProfileStepBaseline(u: UserData): ProfileStepBaseline {
  return {
    profilePicture: u.profilePicture,
    firstName: u.firstName,
    surname: u.surname,
    username: u.username,
    location: u.location,
    bio: u.bio,
    isSearchable: u.isSearchable,
  };
}

function normField(s: string): string {
  return s.trim();
}

function profileStepMatchesBaseline(u: UserData, b: ProfileStepBaseline): boolean {
  return (
    u.profilePicture === b.profilePicture &&
    normField(u.firstName) === normField(b.firstName) &&
    normField(u.surname) === normField(b.surname) &&
    normField(u.username) === normField(b.username) &&
    normField(u.location) === normField(b.location) &&
    normField(u.bio) === normField(b.bio) &&
    u.isSearchable === b.isSearchable
  );
}

function profileStepLooksFilledIn(u: UserData): boolean {
  if (u.isSearchable) return true;
  if (u.profilePicture !== DEFAULT_USER_PROFILE_PICTURE) return true;
  if (normField(u.bio) !== "" || normField(u.location) !== "") return true;
  return false;
}

const PROFILE_STEP_BLURB_SKIP =
  "Add how you'll show up to players anytime from your full profile. Everything else lives on your full profile later.";
const PROFILE_STEP_BLURB_FILLED =
  "Add how you'll show up to players. Everything else lives on your full profile later.";

const STEP_COPY: Record<
  Step,
  { label: string; blurb: string }
> = {
  1: {
    label: "Profile",
    blurb: PROFILE_STEP_BLURB_FILLED,
  },
  2: {
    label: "Paid tickets",
    blurb:
      "Optional: connect payout details so you can publish paid events with ticket sales. Free events never need this — finish anytime from organiser settings.",
  },
  3: {
    label: "Create event",
    blurb: "You're ready to set time, place, pricing or free RSVP — then publish.",
  },
};

function OrganiserOnboardingPageInner() {
  const { user, userLoading, setUser, refreshUser } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [step, setStep] = useState<Step>(1);
  const [stepSynced, setStepSynced] = useState(false);
  const [stripeLoading, setStripeLoading] = useState(false);
  const [resettingPersona, setResettingPersona] = useState(false);
  const [skipBusy, setSkipBusy] = useState(false);
  const [createNavBusy, setCreateNavBusy] = useState(false);
  const [finishOnboardingBusy, setFinishOnboardingBusy] = useState(false);
  const [profileStepBaseline, setProfileStepBaseline] = useState<ProfileStepBaseline | null>(null);

  useEffect(() => {
    if (step !== 1 || !stepSynced || userLoading || !hasProvisionedFirestoreProfile(user)) return;
    setProfileStepBaseline((prev) => prev ?? pickProfileStepBaseline(user));
  }, [
    step,
    stepSynced,
    userLoading,
    user.userId,
    user.profilePicture,
    user.firstName,
    user.surname,
    user.username,
    user.location,
    user.bio,
    user.isSearchable,
  ]);

  const profileStepHasEdits = useMemo(() => {
    if (profileStepBaseline === null) return false;
    return !profileStepMatchesBaseline(user, profileStepBaseline);
  }, [profileStepBaseline, user]);

  const profileStepEngaged = profileStepHasEdits || profileStepLooksFilledIn(user);

  const headerBlurb =
    step === 1
      ? profileStepEngaged
        ? PROFILE_STEP_BLURB_FILLED
        : PROFILE_STEP_BLURB_SKIP
      : STEP_COPY[step].blurb;
  useEffect(() => {
    if (userLoading) return;
    if (!user.userId) {
      router.replace("/login");
      return;
    }
    if (!hasProvisionedFirestoreProfile(user)) return;
    if (user.onboardingPersona === "attendee") {
      router.replace("/onboarding/attendee");
      return;
    }
    if (!needsOrganiserOnboarding(user)) {
      router.replace("/");
      return;
    }

    void (async () => {
      const wrote = await syncStripeConnectSetupCompletedIfNeeded(user.userId as UserId, user);
      if (wrote) await refreshUser();
    })();
  }, [
    userLoading,
    user.userId,
    user.username,
    user.stripeAccountActive,
    user.stripeConnectSetupCompletedAt,
    user.onboardingCompletedAt,
    user.onboardingPersona,
    router,
    refreshUser,
  ]);

  useEffect(() => {
    if (userLoading || !hasProvisionedFirestoreProfile(user)) return;
    const next = stepFromSearchParams(searchParams);
    setStep(next);
    setStepSynced(true);
  }, [userLoading, user, searchParams]);

  useEffect(() => {
    if (!stepSynced) return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [step, stepSynced]);

  const goToStep = (s: Step) => {
    setStep(s);
    if (s === 1) {
      router.replace("/onboarding/organiser", { scroll: false });
    } else {
      router.replace(`/onboarding/organiser?step=${s}`, { scroll: false });
    }
  };

  const handleUserProfileUpdate = async (field: string, value: unknown): Promise<boolean> => {
    await updateUser(user.userId, { [field]: value });
    setUser((prev) => ({
      ...prev,
      [field]: value,
    }));
    bustUserLocalStorageCache();
    return true;
  };

  const changeHowIUseSportshub = async () => {
    if (!user.userId || resettingPersona || skipBusy || createNavBusy || finishOnboardingBusy) return;
    setResettingPersona(true);
    try {
      await clearOnboardingPersonaChoice(user.userId as UserId);
      await refreshUser();
      router.replace("/onboarding");
    } finally {
      setResettingPersona(false);
    }
  };

  const skipEntireOnboarding = async () => {
    if (!user.userId || skipBusy || resettingPersona || createNavBusy || finishOnboardingBusy) return;
    const confirmed = window.confirm(SKIP_PRODUCT_ONBOARDING_CONFIRM_MESSAGE);
    if (!confirmed) return;
    setSkipBusy(true);
    try {
      await skipProductOnboarding(user.userId as UserId);
      await refreshUser();
      router.replace("/");
    } finally {
      setSkipBusy(false);
    }
  };

  const stripeReady = hasCompletedStripeConnectSetup(user);
  const skippedPaymentSetup = user.stripeConnectSetupSkippedAt != null;

  const advanceToStep3 = async () => {
    if (!user.userId || createNavBusy || skipBusy || resettingPersona || finishOnboardingBusy) return;

    if (stripeReady) {
      goToStep(3);
      return;
    }

    const confirmed = window.confirm(PROCEED_WITHOUT_PAYMENT_SETUP_MESSAGE);
    if (!confirmed) return;

    setCreateNavBusy(true);
    try {
      await updateUser(user.userId, { stripeConnectSetupSkippedAt: Timestamp.now() });
      await refreshUser();
      goToStep(3);
    } finally {
      setCreateNavBusy(false);
    }
  };

  const goToCreateEvent = async () => {
    if (!user.userId || createNavBusy || skipBusy || resettingPersona || finishOnboardingBusy) return;

    if (!stripeReady && !skippedPaymentSetup) {
      const confirmed = window.confirm(PROCEED_TO_EVENT_BUILDER_MESSAGE);
      if (!confirmed) return;
      setCreateNavBusy(true);
      try {
        await updateUser(user.userId, { stripeConnectSetupSkippedAt: Timestamp.now() });
        await refreshUser();
        router.push("/event/create");
      } finally {
        setCreateNavBusy(false);
      }
      return;
    }

    router.push("/event/create");
  };

  const completeOrganiserOnboardingWithoutEvent = async () => {
    if (!user.userId || finishOnboardingBusy || createNavBusy || skipBusy || resettingPersona) return;
    setFinishOnboardingBusy(true);
    try {
      await markProductOnboardingCompleted(user.userId as UserId);
      await refreshUser();
      router.replace("/");
    } finally {
      setFinishOnboardingBusy(false);
    }
  };

  const navDisabled = skipBusy || resettingPersona || createNavBusy || finishOnboardingBusy;

  if (userLoading || !hasProvisionedFirestoreProfile(user) || !stepSynced) {
    return (
      <div className="flex min-h-[calc(100vh-var(--navbar-height))] items-center justify-center px-6">
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }

  return (
    <div
      className="flex min-h-[calc(100vh-var(--navbar-height))] justify-center px-4 py-10 sm:px-6 sm:py-14"
      style={{ paddingBottom: "max(2.5rem, env(safe-area-inset-bottom))" }}
    >
      <div className="flex w-full max-w-2xl flex-col items-center">
        <header className="w-full text-center">
          <h1 className="text-3xl font-bold tracking-tight">Organiser setup</h1>
          <nav aria-label="Setup steps" className="mx-auto mt-4 flex w-full max-w-md justify-center px-1 sm:max-w-lg">
            <ol className="m-0 flex w-full list-none gap-1.5 p-0">
              {([1, 2, 3] as const).map((n) => {
                const completed = step > n;
                const current = step === n;
                const pillBase =
                  "relative flex h-7 w-full min-w-0 items-center justify-center whitespace-nowrap rounded-full border px-2 text-[10px] font-medium leading-none sm:h-8 sm:px-2.5 sm:text-[11px]";
                const pillState = completed
                  ? "border-green-200 bg-green-50 font-semibold text-green-900"
                  : current
                    ? "border-transparent bg-core-text font-semibold text-white"
                    : "border-transparent bg-gray-100 text-gray-600";
                return (
                  <li key={n} className="min-w-0 flex-1 text-center" {...(current ? { "aria-current": "step" as const } : {})}>
                    <span className={`${pillBase} ${pillState}`}>
                      {completed ? (
                        <CheckIcon
                          className="pointer-events-none absolute left-1 top-1/2 h-3 w-3 -translate-y-1/2 sm:left-1.5 sm:h-3.5 sm:w-3.5"
                          aria-hidden
                        />
                      ) : null}
                      <span className="block text-center">
                        {completed ? <span className="sr-only">Completed: </span> : null}
                        {STEP_COPY[n].label}
                      </span>
                    </span>
                  </li>
                );
              })}
            </ol>
          </nav>
          <p className="mx-auto mt-4 max-w-lg text-sm text-gray-600 sm:text-base">{headerBlurb}</p>
        </header>

        <div className="mt-10 w-full">
          {step === 1 && (
            <section aria-labelledby="onboarding-profile-heading" className="w-full text-left">
              <h2 id="onboarding-profile-heading" className="text-lg font-semibold text-core-text">
                Profile
              </h2>
              <div className="mt-4 grid gap-6 sm:grid-cols-[11rem,1fr] sm:items-start">
                <div className="space-y-3">
                  <ProfilePhotoPanel user={user} setUser={setUser} compact />
                  <div className="rounded-lg border border-core-outline/60 p-3">
                    <label className="flex cursor-pointer items-center justify-between gap-3">
                      <span className="text-xs text-gray-700">Show in search</span>
                      <input
                        type="checkbox"
                        className="h-4 w-4 shrink-0 rounded border-core-outline text-core-text focus:ring-2 focus:ring-core-text focus:ring-offset-0"
                        checked={user.isSearchable}
                        onChange={(e) => void handleUserProfileUpdate("isSearchable", e.currentTarget.checked)}
                      />
                    </label>
                  </div>
                </div>
                <OrganiserOnboardingProfileFields user={user} setUser={setUser} />
              </div>
            </section>
          )}

          {step === 2 && (
            <section aria-labelledby="onboarding-paid-events-heading" className="w-full text-left">
              <h2 id="onboarding-paid-events-heading" className="text-lg font-semibold text-core-text">
                Paid events &amp; payouts
              </h2>
              <div className="mt-4">
                {!stripeReady ? (
                  <StripeSetup
                    userId={user.userId}
                    setLoading={setStripeLoading}
                    userLoading={userLoading || stripeLoading}
                    stripeReturnPath="/onboarding/organiser?step=2"
                  />
                ) : (
                  <div className="rounded-xl border border-green-200 bg-green-50 p-5">
                    <p className="font-semibold text-green-900">Payouts connected</p>
                    <p className="mt-1 text-sm text-green-900/90">
                      You can publish paid events with ticket sales when you&apos;re ready.
                    </p>
                  </div>
                )}
              </div>
            </section>
          )}

          {step === 3 && (
            <section aria-labelledby="onboarding-event-heading" className="w-full text-left">
              <h2 id="onboarding-event-heading" className="text-lg font-semibold text-core-text">
                Event builder
              </h2>
              <div className="mt-4 rounded-xl border border-core-outline bg-organiser-light-gray/25 p-5 sm:p-6">
                <p className="text-sm text-gray-700">
                  Set time, place, pricing or free RSVP, then publish. You can adjust your profile or payout setup anytime
                  from Profile and organiser settings.
                </p>
                <p className="mt-3 text-sm text-gray-600">
                  Not ready to publish yet? You can finish onboarding from the button below and create an event later.
                </p>
                <div className="mt-5 flex justify-center sm:justify-start">
                  <HighlightButton
                    type="button"
                    className="bg-core-text text-white hover:bg-black"
                    disabled={navDisabled}
                    onClick={() => void goToCreateEvent()}
                  >
                    {createNavBusy ? "Working…" : "Open event builder"}
                  </HighlightButton>
                </div>
              </div>
            </section>
          )}
        </div>

        <div className="mt-10 flex w-full flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex justify-center sm:justify-start">
            <HighlightButton
              type="button"
              className="border border-core-outline bg-transparent"
              disabled={navDisabled}
              onClick={() => {
                if (step > 1) goToStep((step - 1) as Step);
                else void changeHowIUseSportshub();
              }}
            >
              Back
            </HighlightButton>
          </div>
          <div className="flex flex-wrap justify-center gap-3 sm:justify-end">
            {step === 1 && (
              <HighlightButton
                type="button"
                className="bg-core-text text-white hover:bg-black"
                disabled={navDisabled}
                onClick={() => goToStep(2)}
              >
                {profileStepEngaged ? "Continue" : "Skip"}
              </HighlightButton>
            )}
            {step === 2 && (
              <HighlightButton
                type="button"
                className="bg-core-text text-white hover:bg-black"
                disabled={navDisabled}
                onClick={() => void advanceToStep3()}
              >
                {createNavBusy ? "Working…" : "Continue"}
              </HighlightButton>
            )}
            {step === 3 && (
              <HighlightButton
                type="button"
                className="bg-core-text text-white hover:bg-black"
                disabled={navDisabled}
                onClick={() => void completeOrganiserOnboardingWithoutEvent()}
              >
                {finishOnboardingBusy ? "Working…" : "Complete onboarding"}
              </HighlightButton>
            )}
          </div>
        </div>

        <div
          role="region"
          aria-label="Other options"
          className="mt-12 flex w-full flex-col items-center border-t border-gray-100 pt-10"
        >
          <button
            type="button"
            disabled={navDisabled}
            className="text-sm font-semibold text-gray-500 underline decoration-gray-300 underline-offset-2 hover:text-gray-800 disabled:opacity-50"
            onClick={() => void skipEntireOnboarding()}
          >
            Skip onboarding
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OrganiserOnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-var(--navbar-height))] items-center justify-center px-6">
          <p className="text-gray-600">Loading…</p>
        </div>
      }
    >
      <OrganiserOnboardingPageInner />
    </Suspense>
  );
}
