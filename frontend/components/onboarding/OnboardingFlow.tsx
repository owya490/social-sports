"use client";

import Loading from "@/components/loading/Loading";
import Logo from "@/components/navbar/Logo";
import OnboardingPayoutsStep from "@/components/onboarding/OnboardingPayoutsStep";
import OnboardingProfileStep from "@/components/onboarding/OnboardingProfileStep";
import OnboardingTimeline, { OnboardingTimelinePersona } from "@/components/onboarding/OnboardingTimeline";
import { useUser } from "@/components/utility/UserContext";
import { OnboardingPersona, UserData, UserId } from "@/interfaces/UserTypes";
import { markProductOnboardingCompleted, updateUser } from "@/services/src/users/usersService";
import { hasProvisionedFirestoreProfile, isUserOnboarding } from "@/utilities/onboardingUtils";
import { CalendarDaysIcon, TicketIcon } from "@heroicons/react/24/outline";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type OnboardingStep = "role" | "profile" | "payouts";

const ONBOARDING_STEP_KEY = "sportshub-onboarding-step";

const ROLE_OPTIONS: {
  persona: OnboardingPersona;
  title: string;
  description: string;
  icon: typeof CalendarDaysIcon;
}[] = [
  {
    persona: "organiser",
    title: "Host events",
    description: "Run sessions. Sell tickets when you want.",
    icon: CalendarDaysIcon,
  },
  {
    persona: "attendee",
    title: "Join sessions",
    description: "Find a game and book a spot.",
    icon: TicketIcon,
  },
];

function readStoredStep(): OnboardingStep | null {
  if (typeof window === "undefined") return null;
  const value = sessionStorage.getItem(ONBOARDING_STEP_KEY);
  return value === "profile" || value === "payouts" ? value : null;
}

function initialStepForUser(user: UserData): OnboardingStep {
  if (user.onboardingPersona === "organiser") {
    if (user.stripeAccount) return "profile";
    return readStoredStep() === "payouts" ? "payouts" : "profile";
  }
  if (user.onboardingPersona === "attendee") return "profile";
  return "role";
}

export default function OnboardingFlow() {
  const { user, userLoading, refreshUser } = useUser();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [stepOverride, setStepOverride] = useState<OnboardingStep | null>(null);
  const [personaOverride, setPersonaOverride] = useState<OnboardingPersona | null>(null);
  const [allComplete, setAllComplete] = useState(false);

  const ready = !userLoading && hasProvisionedFirestoreProfile(user) && isUserOnboarding(user);
  const step: OnboardingStep | null = ready ? (stepOverride ?? initialStepForUser(user)) : null;
  const persona: OnboardingPersona | null =
    personaOverride ??
    (user.onboardingPersona === "organiser" || user.onboardingPersona === "attendee" ? user.onboardingPersona : null);

  useEffect(() => {
    if (userLoading) return;
    if (!user.userId) {
      router.replace("/login");
      return;
    }
    if (!hasProvisionedFirestoreProfile(user)) return;
    if (!isUserOnboarding(user)) {
      router.replace("/");
    }
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
    const previousStep = stepOverride;
    const previousPersona = personaOverride;
    setSubmitting(true);
    setPersonaOverride(nextPersona);
    setStepOverride("profile");
    try {
      await updateUser(user.userId, { onboardingPersona: nextPersona });
      void refreshUser();
    } catch {
      setPersonaOverride(previousPersona);
      setStepOverride(previousStep);
    } finally {
      setSubmitting(false);
    }
  };

  if (!ready || step === null) {
    return <Loading />;
  }

  const showPayouts = persona === "organiser" && !user.stripeAccount;
  const revealed: OnboardingTimelinePersona | null = step === "role" ? null : persona;

  return (
    <div className="relative flex min-h-dvh flex-col bg-surface text-foreground">
      <div className="px-5 pt-5 sm:px-6 lg:absolute lg:left-6 lg:top-5 lg:p-0">
        <Logo showText size="sm" />
      </div>

      <div className="m-auto flex w-full max-w-5xl flex-col items-center gap-6 px-5 py-8 lg:flex-row lg:items-center lg:justify-center lg:gap-16 lg:px-6">
        <div className="w-full shrink-0 lg:w-auto">
          <OnboardingTimeline
            currentStep={step}
            revealed={revealed}
            allComplete={allComplete}
            showPayouts={!user.stripeAccount}
          />
        </div>

        <main className="w-full min-w-0 lg:flex-1">
          {step === "role" ? (
            <div className="space-y-6">
              <header>
                <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                  Welcome to SPORTSHUB
                </h1>
                <p className="mt-1.5 text-sm text-foreground-secondary sm:text-base">
                  How do you want to start?
                </p>
              </header>

              <div className="grid gap-4 sm:grid-cols-2">
                {ROLE_OPTIONS.map(({ persona: optionPersona, title, description, icon: Icon }) => (
                  <button
                    key={optionPersona}
                    type="button"
                    disabled={submitting}
                    onClick={() => void choosePersona(optionPersona)}
                    className="rounded-xl border border-border bg-background p-5 text-left transition-colors hover:border-foreground hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground disabled:opacity-50 sm:p-6"
                  >
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-surface text-foreground">
                      <Icon aria-hidden className="h-5 w-5 stroke-[1.5]" />
                    </span>
                    <h2 className="mt-4 text-base font-semibold text-foreground sm:text-lg">{title}</h2>
                    <p className="mt-1 text-sm text-foreground-secondary">{description}</p>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {step === "profile" && persona ? (
            <OnboardingProfileStep
              persona={persona}
              onBack={() => setStepOverride("role")}
              completeLabel={showPayouts ? "Continue" : "Finish"}
              onComplete={async () => {
                if (showPayouts) {
                  setStepOverride("payouts");
                  return;
                }
                await markProductOnboardingCompleted(user.userId as UserId);
                await finishAndLeave();
              }}
            />
          ) : null}

          {step === "payouts" ? (
            <OnboardingPayoutsStep onBack={() => setStepOverride("profile")} onFinished={finishAndLeave} />
          ) : null}
        </main>
      </div>
    </div>
  );
}
