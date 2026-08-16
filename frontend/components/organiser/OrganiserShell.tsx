"use client";

import { usesOrganiserV2Shell } from "@/components/navbar/navbarVisibility";
import { OrganiserBreadcrumbProvider } from "@/components/organiser/OrganiserBreadcrumbContext";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import OrganiserSidebar from "@/components/organiser/OrganiserSidebar";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/** Matches `--color-surface` — kept in sync for body overscroll / Safari chrome. */
const ORGANISER_V2_CANVAS = "#f7f7f7";

function applyOrganiserV2SafariChrome() {
  document.documentElement.style.backgroundColor = ORGANISER_V2_CANVAS;
  document.body.style.backgroundColor = ORGANISER_V2_CANVAS;
  document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => {
    meta.setAttribute("content", ORGANISER_V2_CANVAS);
  });
}

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
    const themeMetas = Array.from(document.querySelectorAll('meta[name="theme-color"]'));
    const prevThemeColors = themeMetas.map((meta) => meta.getAttribute("content"));
    applyOrganiserV2SafariChrome();
    return () => {
      root.style.backgroundColor = prevRootBg;
      body.style.backgroundColor = prevBodyBg;
      themeMetas.forEach((meta, index) => {
        const previous = prevThemeColors[index];
        if (previous == null) meta.removeAttribute("content");
        else meta.setAttribute("content", previous);
      });
    };
  }, [isV2Shell]);

  // Re-assert Clubhouse Grey after the mobile drawer opens or closes. iOS Safari
  // otherwise samples the dim overlay and can leave the status / URL bars dark.
  useEffect(() => {
    if (!isV2Shell) return;
    applyOrganiserV2SafariChrome();
    const frame = requestAnimationFrame(() => applyOrganiserV2SafariChrome());
    return () => cancelAnimationFrame(frame);
  }, [isV2Shell, mobileOpen]);

  if (isV2Shell) {
    return (
      <OrganiserBreadcrumbProvider openMobileNav={openMobileNav}>
        <div className="min-h-screen bg-surface">
          {/* Hairlines sit above the mobile drawer overlay so Safari always
              samples Clubhouse Grey at the viewport edges. */}
          <div
            aria-hidden
            className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-px bg-surface lg:hidden"
          />
          <div
            aria-hidden
            className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] h-px bg-surface lg:hidden"
          />
          <OrganiserSidebar mobileOpen={mobileOpen} onMobileOpenChange={onMobileOpenChange} />
          <div className="min-h-screen transition-[padding] duration-200 lg:pl-[var(--organiser-sidebar-width)]">
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
