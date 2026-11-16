"use client";

import { CheckIcon } from "@heroicons/react/24/solid";
import { useEffect, useRef, useState } from "react";

export type OnboardingTimelineStep = "role" | "profile" | "payouts";
export type OnboardingTimelinePersona = "organiser" | "attendee";

type OnboardingTimelineProps = {
  currentStep: OnboardingTimelineStep;
  /** Null keeps the stepper on Account and Role. A persona expands the later steps. */
  revealed: OnboardingTimelinePersona | null;
  /** Marks every visible step complete so the last step can fill in before leaving. */
  allComplete?: boolean;
  /** Organisers who already have a Stripe account skip Getting Paid. */
  showPayouts?: boolean;
};

const STEPS = [
  { id: "account", title: "Account", description: "Create your account" },
  { id: "role", title: "Role", description: "Host events or join sessions" },
  { id: "profile", title: "Profile", description: "Add your details" },
  { id: "payouts", title: "Getting Paid", description: "Connect payouts" },
] as const;

type StepId = (typeof STEPS)[number]["id"];
type StepStatus = "complete" | "current" | "upcoming";

const EASE = "ease-[cubic-bezier(0.22,1,0.36,1)]";
/** Keep in step with `duration-300` below. Step 4 waits for step 3 to finish opening. */
const EXPAND_MS = 300;
const MOTION = `duration-300 ${EASE} motion-reduce:transition-none`;

function isStepVisible(id: StepId, profileShown: boolean, payoutsShown: boolean): boolean {
  if (id === "account" || id === "role") return true;
  if (id === "profile") return profileShown;
  return payoutsShown;
}

function useStaggeredSteps(revealed: OnboardingTimelinePersona | null, showPayouts: boolean) {
  const [profileShown, setProfileShown] = useState(revealed != null);
  const [payoutsShown, setPayoutsShown] = useState(revealed === "organiser" && showPayouts);
  const payoutsShownRef = useRef(revealed === "organiser" && showPayouts);

  useEffect(() => {
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const wait = reduceMotion ? 0 : EXPAND_MS;

    if (revealed === "organiser") {
      setProfileShown(true);
      if (!showPayouts) {
        payoutsShownRef.current = false;
        setPayoutsShown(false);
        return;
      }
      const timer = window.setTimeout(() => {
        payoutsShownRef.current = true;
        setPayoutsShown(true);
      }, wait);
      return () => window.clearTimeout(timer);
    }

    if (revealed === "attendee") {
      payoutsShownRef.current = false;
      setPayoutsShown(false);
      setProfileShown(true);
      return;
    }

    const hadPayouts = payoutsShownRef.current;
    setPayoutsShown(false);
    const timer = window.setTimeout(() => {
      payoutsShownRef.current = false;
      setProfileShown(false);
    }, hadPayouts ? wait : 0);
    return () => window.clearTimeout(timer);
  }, [revealed, showPayouts]);

  return { profileShown, payoutsShown };
}

function stepStatus(visibleIndex: number, currentIndex: number): StepStatus {
  if (visibleIndex < currentIndex) return "complete";
  if (visibleIndex === currentIndex) return "current";
  return "upcoming";
}

function markerClass(status: StepStatus): string {
  const shared = `relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ring-1 transition-colors ${MOTION}`;
  if (status === "complete") return `${shared} bg-[#22c55e] text-white ring-transparent`;
  if (status === "current") return `${shared} bg-surface-muted text-foreground ring-transparent`;
  return `${shared} bg-surface text-foreground-muted ring-border`;
}

function Marker({ status, number }: { status: StepStatus; number: number }) {
  const complete = status === "complete";
  return (
    <span className={markerClass(status)}>
      <span className="grid place-items-center">
        <CheckIcon
          className={`col-start-1 row-start-1 h-4 w-4 transition-all ${MOTION} ${
            complete ? "scale-100 opacity-100" : "scale-0 opacity-0"
          }`}
          aria-hidden
        />
        <span
          className={`col-start-1 row-start-1 text-sm font-semibold transition-all ${MOTION} ${
            complete ? "scale-0 opacity-0" : "scale-100 opacity-100"
          }`}
          aria-hidden
        >
          {number}
        </span>
      </span>
    </span>
  );
}

function FillLine({
  filled,
  orientation,
  active = true,
}: {
  filled: boolean;
  orientation: "vertical" | "horizontal";
  active?: boolean;
}) {
  const [shown, setShown] = useState(filled);

  useEffect(() => {
    setShown(filled);
  }, [filled]);

  const vertical = orientation === "vertical";
  return (
    <span
      className={
        vertical
          ? `absolute top-8 bottom-0 w-0.5 overflow-hidden ${active ? "bg-border" : "bg-transparent"}`
          : `block h-0.5 w-full overflow-hidden ${active ? "bg-border" : "bg-transparent"}`
      }
      aria-hidden
    >
      <span
        className={`block h-full w-full bg-[#22c55e] transition-transform ${MOTION} ${
          vertical ? "origin-top" : "origin-left"
        }`}
        style={{ transform: shown ? (vertical ? "scaleY(1)" : "scaleX(1)") : vertical ? "scaleY(0)" : "scaleX(0)" }}
      />
    </span>
  );
}

export default function OnboardingTimeline({
  currentStep,
  revealed,
  allComplete = false,
  showPayouts = true,
}: OnboardingTimelineProps) {
  const { profileShown, payoutsShown } = useStaggeredSteps(revealed, showPayouts);
  const visibility = STEPS.map((step) => isStepVisible(step.id, profileShown, payoutsShown));
  const visibleIds = STEPS.filter((_, index) => visibility[index]).map((step) => step.id);
  const currentIndex = allComplete ? visibleIds.length : Math.max(0, visibleIds.indexOf(currentStep));

  const rows = STEPS.map((step, index) => {
    const visible = visibility[index];
    const visibleIndex = STEPS.slice(0, index).filter((_, earlier) => visibility[earlier]).length;
    const status = visible ? stepStatus(visibleIndex, currentIndex) : "upcoming";
    const isLastVisible = !visibility.slice(index + 1).some(Boolean);
    const number = visibleIndex + 1;
    return { step, index, visible, status, isLastVisible, number };
  });

  return (
    <>
      <ol
        aria-label="Onboarding progress"
        className={`grid w-full transition-[grid-template-columns] ${MOTION} md:hidden`}
        style={{
          gridTemplateColumns: visibility
            .map((visible) => (visible ? "minmax(max-content,1fr)" : "minmax(0,0fr)"))
            .join(" "),
        }}
      >
        {rows.map(({ step, visible, status, isLastVisible, number }, index) => {
          const showLeft = index > 0 && visibility.slice(0, index).some(Boolean);
          const rightFilled = status === "complete";
          return (
            <li
              key={step.id}
              className="flex min-w-0 flex-col items-center overflow-hidden"
              aria-current={status === "current" ? "step" : undefined}
              aria-hidden={visible ? undefined : true}
            >
              <div className="flex w-full items-center">
                <span className="h-0.5 flex-1">
                  <FillLine filled={showLeft && status !== "upcoming"} active={showLeft} orientation="horizontal" />
                </span>
                <Marker status={status} number={number} />
                <span className="h-0.5 flex-1">
                  <FillLine filled={rightFilled} active={!isLastVisible} orientation="horizontal" />
                </span>
              </div>
              <p
                className={`mt-1 whitespace-nowrap px-0.5 text-center text-xs font-semibold leading-4 transition-colors ${MOTION} ${
                  status === "upcoming" ? "text-foreground-muted" : "text-foreground"
                }`}
              >
                {step.title}
              </p>
            </li>
          );
        })}
      </ol>

      <ol aria-label="Onboarding progress" className="hidden w-60 shrink-0 md:block">
        {rows.map(({ step, visible, status, isLastVisible, number }) => {
          const expandable = step.id === "profile" || step.id === "payouts";
          return (
            <li
              key={step.id}
              className={
                expandable
                  ? `grid transition-[grid-template-rows,opacity] ${MOTION} ${
                      visible ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                    }`
                  : "grid grid-rows-[1fr]"
              }
              aria-current={status === "current" ? "step" : undefined}
              aria-hidden={visible ? undefined : true}
            >
              <div className={expandable ? "min-h-0 overflow-hidden" : undefined}>
                <div className="flex gap-3">
                  <div className="relative flex w-8 shrink-0 justify-center">
                    <FillLine filled={status === "complete"} active={!isLastVisible} orientation="vertical" />
                    <Marker status={status} number={number} />
                  </div>
                  <div
                    className={`transition-[min-height,padding] ${MOTION} ${
                      isLastVisible ? "min-h-8 pt-1" : "min-h-32 pb-10 pt-1"
                    }`}
                  >
                    <p
                      className={`whitespace-nowrap text-sm font-semibold leading-5 transition-colors ${MOTION} ${
                        status === "upcoming" ? "text-foreground-muted" : "text-foreground"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p
                      className={`text-sm leading-5 transition-colors ${MOTION} ${
                        status === "upcoming" ? "text-foreground-muted" : "text-foreground-secondary"
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>
    </>
  );
}
