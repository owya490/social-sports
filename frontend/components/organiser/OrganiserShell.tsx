"use client";

import { OrganiserBreadcrumbProvider } from "@/components/organiser/OrganiserBreadcrumbContext";
import OrganiserSidebar from "@/components/organiser/OrganiserSidebar";
import { useCallback, useEffect, useState } from "react";

/** Matches `--color-surface` — kept in sync for body overscroll / Safari chrome. */
const ORGANISER_V2_CANVAS = "#f7f7f7";

export default function OrganiserShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const onMobileOpenChange = useCallback((open: boolean) => setMobileOpen(open), []);
  const openMobileNav = useCallback(() => setMobileOpen(true), []);

  // Keep html/body paint colour on the v2 canvas so overscroll and translucent
  // Safari chrome match the grey hub background (not the global white body).
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;
    const prevRootBg = root.style.backgroundColor;
    const prevBodyBg = body.style.backgroundColor;
    root.style.backgroundColor = ORGANISER_V2_CANVAS;
    body.style.backgroundColor = ORGANISER_V2_CANVAS;
    return () => {
      root.style.backgroundColor = prevRootBg;
      body.style.backgroundColor = prevBodyBg;
    };
  }, []);

  // Re-apply canvas colour when the drawer closes so Safari re-samples translucent chrome.
  useEffect(() => {
    if (mobileOpen) return;
    const root = document.documentElement;
    const body = document.body;
    root.style.backgroundColor = ORGANISER_V2_CANVAS;
    body.style.backgroundColor = ORGANISER_V2_CANVAS;
  }, [mobileOpen]);

  return (
    <OrganiserBreadcrumbProvider openMobileNav={openMobileNav}>
      <div className="min-h-screen bg-surface">
        <OrganiserSidebar mobileOpen={mobileOpen} onMobileOpenChange={onMobileOpenChange} />
        <div className="flex min-h-[100dvh] flex-col transition-[padding] duration-200 lg:pl-[var(--organiser-sidebar-width)]">
          <div className="h-[env(safe-area-inset-top)] shrink-0 lg:hidden" aria-hidden />
          <div className="relative min-h-0 flex-1">
            <div className={mobileOpen ? "max-lg:pointer-events-none" : undefined}>{children}</div>
            {mobileOpen ? (
              <button
                type="button"
                className="absolute inset-0 z-30 bg-black/50 lg:hidden"
                aria-label="Close menu"
                onClick={() => onMobileOpenChange(false)}
              />
            ) : null}
          </div>
          <div className="h-[env(safe-area-inset-bottom)] shrink-0 lg:hidden" aria-hidden />
        </div>
      </div>
    </OrganiserBreadcrumbProvider>
  );
}
