"use client";

import { usesOrganiserV2Shell } from "@/components/navbar/navbarVisibility";
import { OrganiserBreadcrumbProvider } from "@/components/organiser/OrganiserBreadcrumbContext";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import OrganiserSidebar from "@/components/organiser/OrganiserSidebar";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/** Matches `--color-surface` — kept in sync for body overscroll / Safari chrome. */
const ORGANISER_V2_CANVAS = "#f7f7f7";

export default function OrganiserShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const onMobileOpenChange = useCallback((open: boolean) => setMobileOpen(open), []);
  const openMobileNav = useCallback(() => setMobileOpen(true), []);
  const isV2Shell = usesOrganiserV2Shell(pathname);

  // Keep html/body paint colour on the v2 canvas so overscroll and translucent
  // Safari chrome match the grey hub background (not the global white body).
  useEffect(() => {
    if (!isV2Shell) return;
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
  }, [isV2Shell]);

  useEffect(() => {
    if (!isV2Shell) return;
    document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
      meta.setAttribute("content", ORGANISER_V2_CANVAS);
    });
  }, [isV2Shell, mobileOpen]);

  if (isV2Shell) {
    return (
      <OrganiserBreadcrumbProvider openMobileNav={openMobileNav}>
        <div className="min-h-screen bg-surface">
          <OrganiserSidebar mobileOpen={mobileOpen} onMobileOpenChange={onMobileOpenChange} />
          <div className="min-h-screen transition-[padding] duration-200 max-lg:pt-[env(safe-area-inset-top,0px)] lg:pl-[var(--organiser-sidebar-width)]">
            {children}
          </div>
        </div>
      </OrganiserBreadcrumbProvider>
    );
  }

  return (
    <>
      <OrganiserNavbar />
      <div className="pb-28 sm:ml-14 sm:pb-0">{children}</div>
    </>
  );
}
