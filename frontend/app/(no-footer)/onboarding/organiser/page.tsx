"use client";

import { HighlightButton } from "@/components/elements/HighlightButton";
import StripeSetup from "@/components/elements/StripeSetup";
import { useUser } from "@/components/utility/UserContext";
import { UserId } from "@/interfaces/UserTypes";
import {
  clearOnboardingPersonaChoice,
  markProductOnboardingCompleted,
  skipProductOnboarding,
  syncStripeConnectSetupCompletedIfNeeded,
  updateUser,
} from "@/services/src/users/usersService";
import {
  hasCompletedStripeConnectSetup,
  hasProvisionedFirestoreProfile,
  needsOrganiserOnboarding,
  SKIP_PRODUCT_ONBOARDING_CONFIRM_MESSAGE,
} from "@/utilities/onboardingUtils";
import { Timestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const PROCEED_WITHOUT_PAYMENT_SETUP_MESSAGE =
  "You haven\u2019t connected payouts for paid tickets yet. Free events still work — you\u2019ll only need this when you want to sell tickets or charge for sessions. You can finish anytime from your profile or organiser tools.\n\nContinue anyway?";

export default function OrganiserOnboardingPage() {
  const { user, userLoading, refreshUser } = useUser();
  const router = useRouter();
  const [stripeLoading, setStripeLoading] = useState(false);
  const [resettingPersona, setResettingPersona] = useState(false);
  const [skipBusy, setSkipBusy] = useState(false);
  const [continueBusy, setContinueBusy] = useState(false);

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

  const changeHowIUseSportshub = async () => {
    if (!user.userId || resettingPersona || skipBusy || continueBusy) return;
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
    if (!user.userId || skipBusy || resettingPersona || continueBusy) return;
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

  const completeOrganiserOnboarding = async () => {
    if (!user.userId || continueBusy || skipBusy || resettingPersona) return;

    const stripeReady = hasCompletedStripeConnectSetup(user);
    const skippedPaymentSetup = user.stripeConnectSetupSkippedAt != null;

    if (!stripeReady && !skippedPaymentSetup) {
      const confirmed = window.confirm(PROCEED_WITHOUT_PAYMENT_SETUP_MESSAGE);
      if (!confirmed) return;
    }

    setContinueBusy(true);
    try {
      if (!stripeReady && !skippedPaymentSetup) {
        await updateUser(user.userId, { stripeConnectSetupSkippedAt: Timestamp.now() });
      }
      await markProductOnboardingCompleted(user.userId as UserId);
      await refreshUser();
      router.replace("/");
    } finally {
      setContinueBusy(false);
    }
  };

  const navDisabled = skipBusy || resettingPersona || continueBusy;
  const stripeReady = hasCompletedStripeConnectSetup(user);

  if (userLoading || !hasProvisionedFirestoreProfile(user)) {
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
          <p className="mx-auto mt-4 max-w-lg text-sm text-gray-600 sm:text-base">
            Optional: connect payout details so you can publish paid events with ticket sales. Free events never need
            this — finish anytime from organiser settings.
          </p>
        </header>

        <div className="mt-10 w-full">
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
                  stripeReturnPath="/onboarding/organiser"
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
        </div>

        <div className="mt-10 flex w-full flex-col-reverse gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex justify-center sm:justify-start">
            <HighlightButton
              type="button"
              className="border border-core-outline bg-transparent"
              disabled={navDisabled}
              onClick={() => void changeHowIUseSportshub()}
            >
              Back
            </HighlightButton>
          </div>
          <div className="flex flex-wrap justify-center gap-3 sm:justify-end">
            <HighlightButton
              type="button"
              className="bg-core-text text-white hover:bg-black"
              disabled={navDisabled}
              onClick={() => void completeOrganiserOnboarding()}
            >
              {continueBusy ? "Working…" : "Continue"}
            </HighlightButton>
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
