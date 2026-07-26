"use client";

import { HighlightButton } from "@/components/elements/HighlightButton";
import { OnboardingPrimaryLink } from "@/components/onboarding/OnboardingPrimaryLink";
import { useUser } from "@/components/utility/UserContext";
import { OnboardingPersona, UserId } from "@/interfaces/UserTypes";
import { clearOnboardingPersonaChoice, updateUser } from "@/services/src/users/usersService";
import {
  hasProvisionedFirestoreProfile,
  needsAttendeeOnboarding,
  needsOnboardingPersonaChoice,
  needsOrganiserOnboarding,
} from "@/utilities/onboardingUtils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function OnboardingPersonaPage() {
  const { user, userLoading, refreshUser } = useUser();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [changingPersona, setChangingPersona] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user.userId) {
      router.replace("/login");
      return;
    }
    if (!hasProvisionedFirestoreProfile(user)) return;

    const stillInProductOnboarding =
      needsOnboardingPersonaChoice(user) ||
      needsOrganiserOnboarding(user) ||
      needsAttendeeOnboarding(user);

    // Only bounce finished users away — do not replace forward from here when persona is already chosen,
    // or browser Back from /onboarding/organiser or /onboarding/attendee hits this URL and immediately loses history.
    if (!stillInProductOnboarding) {
      router.replace("/");
    }
  }, [userLoading, user, router]);

  const choosePersona = async (persona: OnboardingPersona) => {
    if (!user.userId || submitting) return;
    setSubmitting(true);
    try {
      await updateUser(user.userId, { onboardingPersona: persona });
      await refreshUser();
      router.push(persona === "organiser" ? "/onboarding/organiser" : "/onboarding/attendee");
    } finally {
      setSubmitting(false);
    }
  };

  if (userLoading || !hasProvisionedFirestoreProfile(user)) {
    return (
      <div className="flex min-h-[calc(100vh-var(--navbar-height))] items-center justify-center px-6">
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }

  const changeHowIUseSportshub = async () => {
    if (!user.userId || changingPersona || submitting) return;
    setChangingPersona(true);
    try {
      await clearOnboardingPersonaChoice(user.userId as UserId);
      await refreshUser();
    } finally {
      setChangingPersona(false);
    }
  };

  if (needsOrganiserOnboarding(user)) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-var(--navbar-height))] max-w-3xl flex-col gap-10 px-6 py-16 sm:py-24">
        <div className="rounded-2xl border border-core-outline/60 bg-organiser-light-gray/40 p-6 sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight">Continue organiser setup</h1>
          <p className="mt-3 text-gray-700">
            You chose <span className="font-semibold">hosting events</span>. Next is a quick flow — profile, optional paid-event setup (only if you want ticket sales), then create your first event — or change how you plan to use SPORTSHUB.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <OnboardingPrimaryLink href="/onboarding/organiser">Continue setup</OnboardingPrimaryLink>
          <HighlightButton
            type="button"
            className="border border-core-outline bg-transparent"
            disabled={changingPersona}
            onClick={() => void changeHowIUseSportshub()}
          >
            Change how I use SPORTSHUB
          </HighlightButton>
        </div>
      </div>
    );
  }

  if (needsAttendeeOnboarding(user)) {
    return (
      <div className="mx-auto flex min-h-[calc(100vh-var(--navbar-height))] max-w-3xl flex-col gap-10 px-6 py-16 sm:py-24">
        <div className="rounded-2xl border border-core-outline/60 bg-organiser-light-gray/40 p-6 sm:p-8">
          <h1 className="text-3xl font-bold tracking-tight">Continue attendee setup</h1>
          <p className="mt-3 text-gray-700">
            You chose <span className="font-semibold">joining sessions</span>. Continue the quick welcome steps, or
            switch if that was a mistake.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <OnboardingPrimaryLink href="/onboarding/attendee">Continue setup</OnboardingPrimaryLink>
          <HighlightButton
            type="button"
            className="border border-core-outline bg-transparent"
            disabled={changingPersona}
            onClick={() => void changeHowIUseSportshub()}
          >
            Change how I use SPORTSHUB
          </HighlightButton>
        </div>
      </div>
    );
  }

  if (!needsOnboardingPersonaChoice(user)) {
    return (
      <div className="flex min-h-[calc(100vh-var(--navbar-height))] items-center justify-center px-6">
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--navbar-height))] max-w-3xl flex-col gap-10 px-6 py-16 sm:py-24">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome to SPORTSHUB</h1>
        <p className="mt-3 text-gray-700">
          Tell us how you plan to use the platform first — you can always book sessions or host events later.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <button
          type="button"
          disabled={submitting}
          onClick={() => void choosePersona("organiser")}
          className="rounded-2xl border border-core-outline bg-organiser-light-gray p-8 text-left transition hover:border-core-text disabled:opacity-50"
        >
          <h2 className="text-xl font-semibold">I&apos;m hosting events</h2>
          <p className="mt-3 text-sm text-gray-700">
            Run free sessions anytime — connect payouts once when you want to sell tickets or charge for paid events.
          </p>
          <span className="mt-6 inline-block text-sm font-semibold text-highlight-yellow">Recommended for organisers →</span>
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={() => void choosePersona("attendee")}
          className="rounded-2xl border border-core-outline p-8 text-left transition hover:border-core-text disabled:opacity-50"
        >
          <h2 className="text-xl font-semibold">I&apos;m joining sessions</h2>
          <p className="mt-3 text-sm text-gray-700">Discover events near you and book your next game.</p>
          <span className="mt-6 inline-block text-sm font-semibold text-gray-900">Continue →</span>
        </button>
      </div>

      <div className="flex flex-wrap gap-4">
        <Link
          href="/"
          className="inline-flex h-10 items-center justify-center rounded-full border border-core-outline px-4 text-sm font-semibold text-core-text hover:bg-core-hover"
        >
          Back to home
        </Link>
      </div>
    </div>
  );
}
