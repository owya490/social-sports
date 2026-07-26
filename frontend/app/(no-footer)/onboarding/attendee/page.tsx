"use client";

import { HighlightButton } from "@/components/elements/HighlightButton";
import OnboardingFooterSkipActions from "@/components/onboarding/OnboardingFooterSkipActions";
import { useUser } from "@/components/utility/UserContext";
import { UserId } from "@/interfaces/UserTypes";
import {
  clearOnboardingPersonaChoice,
  markProductOnboardingCompleted,
  skipProductOnboarding,
} from "@/services/src/users/usersService";
import {
  hasProvisionedFirestoreProfile,
  needsAttendeeOnboarding,
  SKIP_PRODUCT_ONBOARDING_CONFIRM_MESSAGE,
} from "@/utilities/onboardingUtils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function AttendeeOnboardingPage() {
  const { user, userLoading, refreshUser } = useUser();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [skipFooterBusy, setSkipFooterBusy] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user.userId) {
      router.replace("/login");
      return;
    }
    if (!hasProvisionedFirestoreProfile(user)) return;
    if (user.onboardingPersona === "organiser") {
      router.replace("/onboarding/organiser");
      return;
    }
    if (!needsAttendeeOnboarding(user)) {
      router.replace("/");
      return;
    }
  }, [userLoading, user, router]);

  const explore = async () => {
    if (!user.userId || submitting || skipFooterBusy) return;
    setSubmitting(true);
    try {
      await markProductOnboardingCompleted(user.userId as UserId);
      await refreshUser();
      router.replace("/");
    } finally {
      setSubmitting(false);
    }
  };

  const skipThisStep = async () => {
    if (!user.userId || submitting || skipFooterBusy) return;
    setSkipFooterBusy(true);
    try {
      await clearOnboardingPersonaChoice(user.userId as UserId);
      await refreshUser();
      router.replace("/onboarding");
    } finally {
      setSkipFooterBusy(false);
    }
  };

  const skipEntireOnboarding = async () => {
    if (!user.userId || submitting || skipFooterBusy) return;
    const confirmed = window.confirm(SKIP_PRODUCT_ONBOARDING_CONFIRM_MESSAGE);
    if (!confirmed) return;
    setSkipFooterBusy(true);
    try {
      await skipProductOnboarding(user.userId as UserId);
      await refreshUser();
      router.replace("/");
    } finally {
      setSkipFooterBusy(false);
    }
  };

  if (userLoading || !hasProvisionedFirestoreProfile(user)) {
    return (
      <div className="flex min-h-[calc(100vh-var(--navbar-height))] items-center justify-center px-6">
        <p className="text-gray-600">Loading…</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[calc(100vh-var(--navbar-height))] max-w-xl flex-col gap-8 px-6 py-16 sm:py-24">
      <div className="rounded-2xl border border-core-outline/60 bg-organiser-light-gray/40 p-6 sm:p-8">
        <h1 className="text-3xl font-bold tracking-tight">Find your next session</h1>
        <p className="mt-3 text-gray-700">
          Browse public events, book a spot, and get reminders — no hosting setup required.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <HighlightButton
          type="button"
          className="bg-core-text text-white hover:bg-black"
          disabled={submitting || skipFooterBusy}
          onClick={() => void explore()}
        >
          Explore events
        </HighlightButton>
      </div>

      <OnboardingFooterSkipActions
        skipStep={{
          label: "Skip this step — choose host or participant again",
          onSkipStep: skipThisStep,
        }}
        onSkipAll={skipEntireOnboarding}
        disabled={submitting || skipFooterBusy}
      />
    </div>
  );
}
