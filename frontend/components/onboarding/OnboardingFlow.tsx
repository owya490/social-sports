"use client";

import Loading from "@/components/loading/Loading";
import AttendeeOnboardingStep from "@/components/onboarding/AttendeeOnboardingStep";
import OnboardingTimeline, { OnboardingTimelinePersona } from "@/components/onboarding/OnboardingTimeline";
import OrganiserOnboardingStep from "@/components/onboarding/OrganiserOnboardingStep";
import { CalendarDaysIcon, TicketIcon } from "@heroicons/react/24/outline";
import { useUser } from "@/components/utility/UserContext";
import { OnboardingPersona, UserId } from "@/interfaces/UserTypes";
import { markProductOnboardingCompleted, updateUser } from "@/services/src/users/usersService";
import {
  hasProvisionedFirestoreProfile,
  needsAttendeeOnboarding,
  needsOnboardingPersonaChoice,
  needsOrganiserOnboarding,
} from "@/utilities/onboardingUtils";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type OnboardingStep = "role" | "profile" | "payouts";

const ONBOARDING_STEP_KEY = "sportshub-onboarding-step";

function readStoredStep(): OnboardingStep | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(ONBOARDING_STEP_KEY);
  return value === "profile" || value === "payouts" ? value : null;
}

export default function OnboardingFlow() {
  const { user, userLoading, refreshUser } = useUser();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<OnboardingStep | null>(null);
  const [persona, setPersona] = useState<OnboardingPersona | null>(null);
  const [allComplete, setAllComplete] = useState(false);

  useEffect(() => {
    if (userLoading) return;
    if (!user.userId) {
      router.replace("/login");
      return;
    }
    if (!hasProvisionedFirestoreProfile(user)) return;

    const stillInProductOnboarding =
      needsOnboardingPersonaChoice(user) || needsOrganiserOnboarding(user) || needsAttendeeOnboarding(user);

    if (!stillInProductOnboarding) {
      router.replace("/");
      return;
    }

    setStep((current) => {
      if (current !== null) return current;
      if (user.onboardingPersona === "organiser") {
        if (user.stripeAccount) return "profile";
        return readStoredStep() === "payouts" ? "payouts" : "profile";
      }
      if (user.onboardingPersona === "attendee") return "profile";
      return "role";
    });
    setPersona((current) => {
      if (current !== null) return current;
      if (user.onboardingPersona === "organiser" || user.onboardingPersona === "attendee") {
        return user.onboardingPersona;
      }
      return null;
    });
  }, [userLoading, user, router]);

  useEffect(() => {
    if (step === "profile" || step === "payouts") {
      sessionStorage.setItem(ONBOARDING_STEP_KEY, step);
      return;
    }
    if (step === "role") sessionStorage.removeItem(ONBOARDING_STEP_KEY);
  }, [step]);

  const finishAndLeave = async () => {
    setAllComplete(true);
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduceMotion) {
      await new Promise((resolve) => window.setTimeout(resolve, 720));
    }
    sessionStorage.removeItem(ONBOARDING_STEP_KEY);
    await refreshUser();
    router.replace("/");
  };

  const choosePersona = async (nextPersona: OnboardingPersona) => {
    if (!user.userId || submitting) return;
    const previousStep = step;
    const previousPersona = persona;
    setSubmitting(true);
    setPersona(nextPersona);
    setStep("profile");
    try {
      await updateUser(user.userId, { onboardingPersona: nextPersona });
      void refreshUser();
    } catch {
      setPersona(previousPersona);
      setStep(previousStep);
    } finally {
      setSubmitting(false);
    }
  };

  if (userLoading || !hasProvisionedFirestoreProfile(user) || step === null) {
    return (
      <div className="flex min-h-dvh items-center justify-center px-6">
        <Loading inline />
      </div>
    );
  }

  const revealed: OnboardingTimelinePersona | null = step === "role" ? null : persona;

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="m-auto flex w-full max-w-5xl flex-col items-center gap-6 px-5 py-8 lg:flex-row lg:items-center lg:justify-center lg:gap-16 lg:px-6">
        <div className="w-full shrink-0 lg:w-auto">
          <OnboardingTimeline
            currentStep={step}
            revealed={revealed}
            allComplete={allComplete}
            showPayouts={!user.stripeAccount}
          />
        </div>
        <div className="w-full min-w-0 lg:flex-1">
          {step === "role" ? (
            <div className="flex flex-col gap-4 lg:gap-8">
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Welcome to SPORTSHUB</h1>
                <p className="mt-1.5 text-sm text-gray-700 sm:mt-3 sm:text-base">How do you want to start?</p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-6">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void choosePersona("organiser")}
                  className="rounded-2xl border border-core-outline bg-organiser-light-gray p-4 text-left transition hover:border-core-text disabled:opacity-50 sm:p-8"
                >
                  <CalendarDaysIcon aria-hidden className="h-5 w-5 text-core-text" />
                  <h2 className="mt-3 text-lg font-semibold sm:text-xl">Host events</h2>
                  <p className="mt-1.5 text-sm text-gray-700">Run sessions. Sell tickets when you want.</p>
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={() => void choosePersona("attendee")}
                  className="rounded-2xl border border-core-outline p-4 text-left transition hover:border-core-text disabled:opacity-50 sm:p-8"
                >
                  <TicketIcon aria-hidden className="h-5 w-5 text-core-text" />
                  <h2 className="mt-3 text-lg font-semibold sm:text-xl">Join sessions</h2>
                  <p className="mt-1.5 text-sm text-gray-700">Find a game and book a spot.</p>
                </button>
              </div>
            </div>
          ) : null}
          {step === "profile" && persona ? (
            <AttendeeOnboardingStep
              persona={persona}
              onBack={() => setStep("role")}
              completeLabel={persona === "organiser" && !user.stripeAccount ? "Continue" : "Finish"}
              onComplete={async () => {
                if (persona === "organiser" && !user.stripeAccount) {
                  setStep("payouts");
                  return;
                }
                await markProductOnboardingCompleted(user.userId as UserId);
                await finishAndLeave();
              }}
            />
          ) : null}
          {step === "payouts" ? (
            <OrganiserOnboardingStep onBack={() => setStep("profile")} onFinished={finishAndLeave} />
          ) : null}
        </div>
      </div>
    </div>
  );
}
