"use client";

import { OrganiserWelcomeTour } from "@/components/organiser/v2/welcome/OrganiserWelcomeOnboarding";

/**
 * Isolates the entire V1→V2 welcome journey under /organiser/v2/welcome/*.
 * Server-painted blackout prevents a dashboard flash before the tour hydrates.
 */
export default function OrganiserWelcomeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* SSR / first-paint black — tour overlay (z-80) takes over on hydrate */}
      <div
        className="organiser-welcome-ssr-blackout pointer-events-none fixed inset-0 z-[70] bg-foreground"
        aria-hidden
      />
      {children}
      <OrganiserWelcomeTour />
    </>
  );
}
