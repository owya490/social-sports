"use client";

import OnboardingStepNav from "@/components/onboarding/OnboardingStepNav";
import OnboardingStripeSetup from "@/components/onboarding/OnboardingStripeSetup";
import { useUser } from "@/components/utility/UserContext";
import { UserId } from "@/interfaces/UserTypes";
import {
  markProductOnboardingCompleted,
  syncStripeConnectSetupCompletedIfNeeded,
  updateUser,
} from "@/services/src/users/usersService";
import { hasCompletedStripeConnectSetup } from "@/utilities/onboardingUtils";
import { Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";

const PROCEED_WITHOUT_PAYMENT_SETUP_MESSAGE =
  "You haven't connected payouts yet. Free events still work. You can connect later from your profile when you want to sell tickets.\n\nContinue anyway?";

export default function OrganiserOnboardingStep({
  onBack,
  onFinished,
}: {
  onBack: () => void;
  onFinished: () => Promise<void>;
}) {
  const { user, userLoading, refreshUser } = useUser();
  const [stripeLoading, setStripeLoading] = useState(false);
  const [skipBusy, setSkipBusy] = useState(false);
  const [continueBusy, setContinueBusy] = useState(false);

  useEffect(() => {
    if (!user.userId) return;
    void (async () => {
      const wrote = await syncStripeConnectSetupCompletedIfNeeded(user.userId as UserId, user);
      if (wrote) await refreshUser();
    })();
  }, [user, refreshUser]);

  const skipGettingPaid = async () => {
    if (!user.userId || skipBusy || continueBusy) return;
    setSkipBusy(true);
    try {
      if (!hasCompletedStripeConnectSetup(user) && user.stripeConnectSetupSkippedAt == null) {
        await updateUser(user.userId, { stripeConnectSetupSkippedAt: Timestamp.now() });
      }
      await markProductOnboardingCompleted(user.userId as UserId);
      await onFinished();
    } finally {
      setSkipBusy(false);
    }
  };

  const completeOrganiserOnboarding = async () => {
    if (!user.userId || continueBusy || skipBusy) return;

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
      await onFinished();
    } finally {
      setContinueBusy(false);
    }
  };

  const navDisabled = skipBusy || continueBusy;
  const stripeReady = hasCompletedStripeConnectSetup(user);

  return (
    <div className="flex flex-col items-center">
      <header className="w-full text-center">
        <h1 className="whitespace-nowrap text-3xl font-bold tracking-tight">Getting paid</h1>
        <p className="mx-auto mt-4 max-w-lg text-sm text-gray-600 sm:text-base">
          Connect payouts to sell tickets. Free events don&apos;t need this. You can finish later in organiser
          settings.
        </p>
      </header>

      <div className="mt-10 w-full">
        <section aria-labelledby="onboarding-paid-events-heading" className="w-full text-left">
          <h2 id="onboarding-paid-events-heading" className="text-lg font-semibold text-core-text">
            Paid events &amp; payouts
          </h2>
          <div className="mt-4">
            {!stripeReady ? (
              <OnboardingStripeSetup
                userId={user.userId}
                setLoading={setStripeLoading}
                userLoading={userLoading || stripeLoading}
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

      <div className="mt-10 w-full">
        <OnboardingStepNav
          onBack={onBack}
          primaryLabel={continueBusy ? "Working…" : "Finish"}
          onPrimary={() => void completeOrganiserOnboarding()}
          disabled={navDisabled}
          skip={{ busy: skipBusy, onSkip: skipGettingPaid }}
        />
      </div>
    </div>
  );
}
