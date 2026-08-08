"use client";

import { useUser } from "@/components/utility/UserContext";
import { UserData } from "@/interfaces/UserTypes";
import { DEFAULT_USER_PROFILE_PICTURE } from "@/services/src/users/usersConstants";
import { hasCompletedStripeConnectSetup } from "@/utilities/onboardingUtils";
import {
  ArrowRightIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { DASHBOARD_ANNOUNCEMENTS, DashboardAnnouncement } from "./dashboardAnnouncements";

function AnnouncementRow({ item }: { item: DashboardAnnouncement }) {
  const TrailingIcon = item.external ? ArrowTopRightOnSquareIcon : ArrowRightIcon;
  const className =
    "group flex items-start gap-3 px-3 py-3 -mx-1 rounded-lg hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

  const content = (
    <>
      <span className="mt-0.5 shrink-0 w-[4.5rem] font-mono text-xs uppercase tracking-wide text-foreground-muted tabular-nums">
        {item.tag}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-sans text-sm font-semibold text-foreground leading-snug">
          {item.label}
        </span>
        {item.description ? (
          <span className="mt-0.5 block font-sans text-xs text-foreground-secondary leading-snug">
            {item.description}
          </span>
        ) : null}
      </span>
      <TrailingIcon
        className="mt-1 h-4 w-4 shrink-0 stroke-[1.5] text-foreground-muted transition-[transform,color] duration-200 ease-out group-hover:translate-x-0.5 group-hover:text-foreground"
        aria-hidden
      />
    </>
  );

  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {content}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className}>
      {content}
    </Link>
  );
}

const SETUP_DISMISSED_KEY = "organiser-v2-setup-dismissed";

type SetupItem = {
  id: string;
  label: string;
  href: string;
  isComplete: (user: UserData, hasEvents: boolean) => boolean;
};

const SETUP_ITEMS: SetupItem[] = [
  {
    id: "picture",
    label: "Add a profile picture",
    href: "/profile",
    isComplete: (user) =>
      Boolean(user.profilePicture) && user.profilePicture !== DEFAULT_USER_PROFILE_PICTURE,
  },
  {
    id: "bio",
    label: "Add a description",
    href: "/profile",
    isComplete: (user) => user.bio.trim().length > 0,
  },
  {
    id: "stripe",
    label: "Connect Stripe for payouts",
    href: "/organiser/v2/settings",
    isComplete: (user) => hasCompletedStripeConnectSetup(user),
  },
  {
    id: "first-event",
    label: "Create your first event",
    href: "/event/create",
    isComplete: (_user, hasEvents) => hasEvents,
  },
];

type DashboardSetupSectionProps = {
  hasEvents: boolean;
  loading?: boolean;
};

function SetupCheckbox({
  checked,
  label,
  href,
}: {
  checked: boolean;
  label: string;
  href: string;
}) {
  return (
    <div className="flex items-center gap-3 min-h-[2.5rem]">
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
          checked
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-background"
        }`}
        aria-hidden
      >
        {checked ? <CheckIcon className="h-3.5 w-3.5 stroke-[2.5]" /> : null}
      </span>
      {checked ? (
        <span className="text-sm font-sans text-foreground-muted line-through">{label}</span>
      ) : (
        <Link
          href={href}
          className="text-sm font-sans text-foreground hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded"
        >
          {label}
        </Link>
      )}
    </div>
  );
}

export function DashboardSetupSection({ hasEvents, loading = false }: DashboardSetupSectionProps) {
  const { user } = useUser();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setDismissed(localStorage.getItem(SETUP_DISMISSED_KEY) === "1");
    setMounted(true);
  }, []);

  const items = useMemo(
    () =>
      SETUP_ITEMS.map((item) => ({
        ...item,
        complete: item.isComplete(user, hasEvents),
      })),
    [user, hasEvents],
  );

  const completedCount = items.filter((item) => item.complete).length;
  const allComplete = completedCount === items.length;
  const progressPercent = Math.round((completedCount / items.length) * 100);
  const showChecklist = mounted && !loading && !allComplete;
  const showCompleteBanner = mounted && !loading && !dismissed && allComplete;

  const dismiss = () => {
    localStorage.setItem(SETUP_DISMISSED_KEY, "1");
    setDismissed(true);
  };

  const restore = () => {
    localStorage.removeItem(SETUP_DISMISSED_KEY);
    setDismissed(false);
  };

  return (
    <section
      aria-label="Setup and announcements"
      className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-8"
    >
      <div
        className={`grid gap-3 lg:gap-4 ${
          showChecklist || showCompleteBanner ? "grid-cols-1 lg:grid-cols-12" : "grid-cols-1"
        }`}
      >
        {showChecklist ? (
          <div className="lg:col-span-5 rounded-xl border border-border bg-background p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <h2 className="font-sans text-base font-semibold text-foreground">
                  Finish setting up
                </h2>
                <p className="text-xs text-foreground-muted font-sans mt-0.5">
                  A few steps so players trust your clubhouse
                </p>
              </div>
              <span className="shrink-0 font-mono text-xs tabular-nums text-foreground-muted">
                {completedCount}/{items.length}
              </span>
            </div>

            <div
              className="h-1 w-full rounded-full bg-surface-muted overflow-hidden mb-4"
              role="progressbar"
              aria-valuenow={completedCount}
              aria-valuemin={0}
              aria-valuemax={items.length}
              aria-label="Setup progress"
            >
              <div
                className="h-full rounded-full bg-foreground-secondary transition-[width] duration-300 ease-out"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <ul className="space-y-1">
              {items.map((item) => (
                <li key={item.id}>
                  <SetupCheckbox checked={item.complete} label={item.label} href={item.href} />
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        {showCompleteBanner ? (
          <div className="lg:col-span-5 rounded-xl border border-border bg-background p-4 sm:p-5 flex flex-col justify-center">
            <div className="flex items-start gap-3">
              <CheckCircleIcon className="h-5 w-5 text-foreground shrink-0 mt-0.5" aria-hidden />
              <div className="min-w-0 flex-1">
                <h2 className="font-sans text-base font-semibold text-foreground">
                  You&apos;re set up
                </h2>
                <p className="mt-1 text-xs text-foreground-muted font-sans">
                  Profile, payouts, and a first event — go fill some sessions.
                </p>
                <div className="mt-3 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={dismiss}
                    className="text-xs font-medium text-foreground-secondary hover:text-foreground font-sans focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        <div
          className={`rounded-xl border border-border bg-background p-4 sm:p-5 ${
            showChecklist || showCompleteBanner ? "lg:col-span-7" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-2 mb-3">
            <div className="flex items-center gap-2 min-w-0">
              <h2 className="font-sans text-base font-semibold text-foreground">Announcements</h2>
              <span className="inline-flex items-center rounded-md bg-surface px-1.5 py-0.5 font-mono text-xs uppercase tracking-wide text-foreground-muted">
                From SPORTSHUB
              </span>
            </div>
            {dismissed && allComplete ? (
              <button
                type="button"
                onClick={restore}
                className="text-xs font-medium text-foreground-muted hover:text-foreground font-sans shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus rounded"
              >
                Show setup
              </button>
            ) : null}
          </div>

          <div className="divide-y divide-border border-t border-border -mx-1">
            {DASHBOARD_ANNOUNCEMENTS.map((item) => (
              <AnnouncementRow key={item.id} item={item} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
