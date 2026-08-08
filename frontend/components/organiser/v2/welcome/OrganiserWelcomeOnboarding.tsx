"use client";

import {
  AnimatePresence,
  EASE,
  measureTourTarget,
  motion,
  scrollTourTargetIntoView,
  tipPlacementStyle,
  useReducedMotion,
  WelcomeLoadingStage,
  WelcomePrimaryButton,
  WelcomeSpotlight,
  type SpotlightRect,
} from "@/components/organiser/v2/welcome/WelcomeTourOverlay";
import {
  CLICK_EVENT_STEP,
  CLICK_EVENTS_NAV_STEP,
  CREATE_EVENT_STEP,
  clearTourSession,
  DASHBOARD_PATH,
  EVENT_HUB_STEPS,
  EVENTS_INTRO_STEPS,
  findFirstEventId,
  hasTourEvents,
  HUB_STEPS,
  isWelcomeEventHubPath,
  isWelcomeEventsPath,
  isWelcomeRootPath,
  LOADING_MS,
  LOADING_MS_REDUCED,
  markWelcomeSeen,
  readTourSession,
  requestWelcomeMenuClose,
  requestWelcomeMenuOpen,
  writeTourSession,
  type TourStep,
} from "@/components/organiser/v2/welcome/welcomeOnboarding";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useLayoutEffect, useState } from "react";

type Phase =
  | "loading"
  | "modal"
  | "hub"
  | "click-events-nav"
  | "events-intro"
  | "click-event"
  | "create-event"
  | "event-hub"
  | null;

function phaseFromPath(pathname: string): Phase {
  if (isWelcomeEventHubPath(pathname)) return "event-hub";
  if (isWelcomeEventsPath(pathname)) {
    const session = readTourSession();
    if (session?.chapter === "click-event") return "click-event";
    if (session?.chapter === "create-event") return "create-event";
    return "events-intro";
  }
  if (isWelcomeRootPath(pathname)) {
    const session = readTourSession();
    if (session?.chapter === "click-events-nav") return "click-events-nav";
    if (session?.chapter === "hub") return "hub";
    return "loading";
  }
  return "loading";
}

/**
 * Welcome-layout-mounted tour. Black-and-white overlay UI.
 * Entire journey stays under /organiser/v2/welcome/* so the rest of the hub stays clean.
 */
export function OrganiserWelcomeTour() {
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  const [phase, setPhase] = useState<Phase>(() => phaseFromPath(pathname));
  const [hubIndex, setHubIndex] = useState(0);
  const [eventsIntroIndex, setEventsIntroIndex] = useState(0);
  const [eventHubIndex, setEventHubIndex] = useState(0);
  const [spot, setSpot] = useState<SpotlightRect | null>(null);

  const finish = useCallback(() => {
    markWelcomeSeen();
    clearTourSession();
    setPhase(null);
    setSpot(null);
    router.replace(DASHBOARD_PATH);
  }, [router]);

  // Resume / re-sync when nested welcome routes change.
  useEffect(() => {
    if (isWelcomeEventHubPath(pathname)) {
      writeTourSession({ chapter: "event-hub" });
      setPhase("event-hub");
      setEventHubIndex(0);
      return;
    }
    if (isWelcomeEventsPath(pathname)) {
      const session = readTourSession();
      if (session?.chapter === "click-event" || session?.chapter === "create-event") {
        setPhase(session.chapter);
      } else {
        writeTourSession({ chapter: "events-intro" });
        setEventsIntroIndex(0);
        setPhase("events-intro");
      }
      return;
    }
    if (isWelcomeRootPath(pathname)) {
      const session = readTourSession();
      if (session?.chapter === "click-events-nav") {
        setPhase("click-events-nav");
        return;
      }
      if (session?.chapter === "hub") {
        setPhase("hub");
        return;
      }
      if (
        phase === null ||
        phase === "events-intro" ||
        phase === "click-event" ||
        phase === "create-event" ||
        phase === "event-hub"
      ) {
        setPhase("loading");
        setHubIndex(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only react to route; phase checked intentionally
  }, [pathname]);

  // Loading → modal (dimmed dashboard underneath — no solid black behind the card).
  useEffect(() => {
    if (phase !== "loading") return;
    const ms = reduceMotion ? LOADING_MS_REDUCED : LOADING_MS;
    const t = window.setTimeout(() => setPhase("modal"), ms);
    return () => window.clearTimeout(t);
  }, [phase, reduceMotion]);

  // Scroll lock for loading + modal.
  useEffect(() => {
    if (phase !== "loading" && phase !== "modal") return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [phase]);

  // Hide SSR blackout once the tour overlay owns the screen.
  useEffect(() => {
    document.documentElement.setAttribute("data-welcome-tour", phase ? "1" : "0");
    return () => document.documentElement.removeAttribute("data-welcome-tour");
  }, [phase]);

  const activeStep: TourStep | null =
    phase === "hub"
      ? HUB_STEPS[hubIndex]
      : phase === "click-events-nav"
        ? CLICK_EVENTS_NAV_STEP
        : phase === "events-intro"
          ? EVENTS_INTRO_STEPS[eventsIntroIndex]
          : phase === "click-event"
            ? CLICK_EVENT_STEP
            : phase === "create-event"
              ? CREATE_EVENT_STEP
              : phase === "event-hub"
                ? EVENT_HUB_STEPS[eventHubIndex]
                : null;

  // Mobile drawer: open only when spotlighting the sidebar / Events nav; otherwise close
  // so dashboard steps (KPIs, create) aren’t covered by the open menu.
  useEffect(() => {
    const needsMenu =
      phase === "click-events-nav" || (phase === "hub" && hubIndex === 0);
    if (needsMenu) {
      requestWelcomeMenuOpen();
      const retries = [200, 500, 900].map((ms) =>
        window.setTimeout(requestWelcomeMenuOpen, ms)
      );
      return () => retries.forEach((id) => window.clearTimeout(id));
    }
    if (phase === "hub" || phase === "modal" || phase === "loading") {
      requestWelcomeMenuClose();
    }
  }, [phase, hubIndex]);

  // Keep events intro above the fold — no scroll jump to the list.
  useEffect(() => {
    if (phase !== "events-intro") return;
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [phase, eventsIntroIndex]);

  // After events intro, branch to click-event or create-event once DOM is ready.
  useEffect(() => {
    if (phase !== "click-event" && phase !== "create-event") return;
    const decide = () => {
      if (hasTourEvents()) {
        if (phase !== "click-event") {
          writeTourSession({ chapter: "click-event" });
          setPhase("click-event");
        }
        return;
      }
      const list = document.querySelector("[data-tour='events-list']");
      if (!list) return;
      if (list.querySelector(".react-loading-skeleton")) return;
      if (!hasTourEvents()) {
        writeTourSession({ chapter: "create-event" });
        setPhase("create-event");
      }
    };
    const timers = [100, 400, 1000, 2000].map((ms) => window.setTimeout(decide, ms));
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [phase]);

  useLayoutEffect(() => {
    if (
      !activeStep ||
      (phase !== "hub" &&
        phase !== "click-events-nav" &&
        phase !== "events-intro" &&
        phase !== "click-event" &&
        phase !== "create-event" &&
        phase !== "event-hub")
    ) {
      setSpot(null);
      return;
    }

    if (activeStep.scroll !== false) {
      scrollTourTargetIntoView(activeStep.target);
    }

    let alive = true;
    const sync = () => {
      if (!alive) return;
      setSpot(measureTourTarget(activeStep.target));
    };
    const start = window.setTimeout(sync, reduceMotion ? 40 : 280);
    // Include a post-drawer-close beat (~300ms transition) so KPI/create spots
    // remeasure after the mobile menu finishes closing.
    const retries = [350, 500, 1000, 1800, 2800].map((ms) => window.setTimeout(sync, ms));
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);
    return () => {
      alive = false;
      window.clearTimeout(start);
      retries.forEach((id) => window.clearTimeout(id));
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [activeStep, phase, reduceMotion, hubIndex, eventsIntroIndex, eventHubIndex]);

  // Click-through: advance when the user activates the spotlighted control.
  useEffect(() => {
    if (!activeStep || activeStep.interaction !== "click-through") return;

    const onClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      if (phase === "click-events-nav") {
        const nav = target.closest("[data-tour='nav-events']");
        if (!nav) return;
        writeTourSession({ chapter: "events-intro" });
        return;
      }

      if (phase === "click-event") {
        const row = target.closest("[data-event-id]");
        if (!(row instanceof HTMLElement)) return;
        const eventId = row.getAttribute("data-event-id");
        if (!eventId) return;
        writeTourSession({ chapter: "event-hub", eventId });
        return;
      }

      if (phase === "create-event") {
        const create = target.closest("[data-tour='create-event'], a[href='/event/create']");
        if (!create) return;
        markWelcomeSeen();
        clearTourSession();
        setPhase(null);
      }
    };

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [activeStep, phase]);

  const startHubTour = () => {
    setHubIndex(0);
    writeTourSession({ chapter: "hub" });
    setPhase("hub");
  };

  const nextHub = () => {
    if (hubIndex >= HUB_STEPS.length - 1) {
      writeTourSession({ chapter: "click-events-nav" });
      setPhase("click-events-nav");
      setSpot(null);
      return;
    }
    setHubIndex((i) => i + 1);
  };

  const nextEventsIntro = () => {
    if (eventsIntroIndex >= EVENTS_INTRO_STEPS.length - 1) {
      if (hasTourEvents() || findFirstEventId()) {
        writeTourSession({ chapter: "click-event" });
        setPhase("click-event");
        return;
      }
      writeTourSession({ chapter: "create-event" });
      setPhase("create-event");
      return;
    }
    setEventsIntroIndex((i) => i + 1);
  };

  const nextEventHub = () => {
    if (eventHubIndex >= EVENT_HUB_STEPS.length - 1) {
      finish();
      return;
    }
    setEventHubIndex((i) => i + 1);
  };

  if (!phase) {
    return <div className="fixed inset-0 z-[80] bg-foreground" aria-hidden />;
  }

  const tipStyle = tipPlacementStyle(spot);
  const loadingMs = reduceMotion ? LOADING_MS_REDUCED : LOADING_MS;

  const progressFor = () => {
    if (phase === "hub") return `${hubIndex + 1} of ${HUB_STEPS.length}`;
    if (phase === "click-events-nav") return "Events · open";
    if (phase === "events-intro") {
      return `Events · ${eventsIntroIndex + 1} of ${EVENTS_INTRO_STEPS.length + 1}`;
    }
    if (phase === "click-event" || phase === "create-event") {
      return `Events · ${EVENTS_INTRO_STEPS.length + 1} of ${EVENTS_INTRO_STEPS.length + 1}`;
    }
    if (phase === "event-hub") return `Hub · ${eventHubIndex + 1} of ${EVENT_HUB_STEPS.length}`;
    return "";
  };

  return (
    <>
      {/*
        Overlap loading → modal so the solid black never drops to a naked dashboard.
        Dim mounts at full strength under the loading cover; only the card animates in.
      */}
      <AnimatePresence>
        {phase === "loading" && (
          <WelcomeLoadingStage key="loading" durationMs={loadingMs} reduceMotion={reduceMotion} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "modal" && (
          <div key="modal" className="fixed inset-0 z-[80]">
            <motion.button
              type="button"
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(10, 10, 10, 0.62)" }}
              aria-label="Dismiss welcome"
              onClick={finish}
              initial={false}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            />
            <div
              className="pointer-events-none absolute inset-0 flex items-end justify-center p-4 sm:items-center sm:p-6"
              role="dialog"
              aria-modal="true"
              aria-labelledby="organiser-welcome-title"
            >
              <motion.div
                className="pointer-events-auto relative z-10 w-full max-w-md overflow-hidden rounded-2xl border border-border bg-background shadow-[0_18px_50px_rgba(10,10,10,0.28)]"
                initial={
                  reduceMotion
                    ? false
                    : { y: 36, opacity: 0, scale: 0.94, filter: "blur(8px)" }
                }
                animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.52, ease: EASE }}
              >
                <div className="px-6 pb-7 pt-7 sm:px-8 sm:pb-8 sm:pt-8">
                  <motion.div
                    className="mb-5"
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: reduceMotion ? 0 : 0.18, ease: EASE }}
                  >
                    <Image
                      src="/icons/Icon_black.svg"
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10"
                      priority
                    />
                  </motion.div>

                  <motion.h2
                    id="organiser-welcome-title"
                    className="max-w-[16ch] font-sans text-3xl font-bold leading-[1.15] tracking-tight text-foreground text-balance"
                    initial={reduceMotion ? false : { y: 14, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.42, delay: reduceMotion ? 0 : 0.26, ease: EASE }}
                  >
                    Here’s the new hub
                  </motion.h2>

                  <motion.p
                    className="mt-3.5 max-w-[36ch] font-sans text-sm leading-relaxed text-foreground-secondary"
                    initial={reduceMotion ? false : { y: 12, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.42, delay: reduceMotion ? 0 : 0.34, ease: EASE }}
                  >
                    Same work — clearer layout. Take a quick look around, or skip and get to it.
                  </motion.p>

                  <motion.div
                    className="mt-8 flex flex-col gap-2.5 sm:flex-row-reverse sm:items-center"
                    initial={reduceMotion ? false : { y: 14, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ duration: 0.42, delay: reduceMotion ? 0 : 0.42, ease: EASE }}
                  >
                    <WelcomePrimaryButton onClick={startHubTour} className="flex-1 sm:flex-none sm:px-6">
                      Take the tour
                    </WelcomePrimaryButton>
                    <button
                      type="button"
                      onClick={finish}
                      className="inline-flex flex-1 items-center justify-center rounded-xl border border-border bg-background px-4 py-3 font-sans text-sm font-semibold text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus sm:flex-none"
                    >
                      Skip for now
                    </button>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {phase === "hub" && activeStep && (
          <WelcomeSpotlight
            key="hub-spotlight"
            spot={spot}
            tipStyle={tipStyle}
            title={activeStep.title}
            body={activeStep.body}
            progressLabel={progressFor()}
            primaryLabel={hubIndex >= HUB_STEPS.length - 1 ? "Continue" : "Next"}
            onPrimary={nextHub}
            onSkip={finish}
            onBack={hubIndex > 0 ? () => setHubIndex((i) => i - 1) : undefined}
          />
        )}

        {phase === "click-events-nav" && activeStep && (
          <WelcomeSpotlight
            key="click-events-nav"
            spot={spot}
            tipStyle={tipStyle}
            title={activeStep.title}
            body={activeStep.body}
            progressLabel={progressFor()}
            interaction="click-through"
            clickHint={activeStep.clickHint}
            onSkip={finish}
          />
        )}

        {phase === "events-intro" && activeStep && (
          <WelcomeSpotlight
            key="events-intro-spotlight"
            spot={spot}
            tipStyle={tipStyle}
            title={activeStep.title}
            body={activeStep.body}
            progressLabel={progressFor()}
            primaryLabel={eventsIntroIndex >= EVENTS_INTRO_STEPS.length - 1 ? "Got it" : "Next"}
            onPrimary={nextEventsIntro}
            onSkip={finish}
            onBack={
              eventsIntroIndex > 0 ? () => setEventsIntroIndex((i) => i - 1) : undefined
            }
          />
        )}

        {(phase === "click-event" || phase === "create-event") && activeStep && (
          <WelcomeSpotlight
            key={phase}
            spot={spot}
            tipStyle={tipStyle}
            title={activeStep.title}
            body={activeStep.body}
            progressLabel={progressFor()}
            interaction="click-through"
            clickHint={activeStep.clickHint}
            onSkip={finish}
          />
        )}

        {phase === "event-hub" && activeStep && (
          <WelcomeSpotlight
            key="event-hub-spotlight"
            spot={spot}
            tipStyle={tipStyle}
            title={activeStep.title}
            body={activeStep.body}
            progressLabel={progressFor()}
            primaryLabel={eventHubIndex >= EVENT_HUB_STEPS.length - 1 ? "Let's go" : "Next"}
            onPrimary={nextEventHub}
            onSkip={finish}
            onBack={eventHubIndex > 0 ? () => setEventHubIndex((i) => i - 1) : undefined}
          />
        )}
      </AnimatePresence>
    </>
  );
}
