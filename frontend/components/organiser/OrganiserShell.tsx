"use client";

import { usesOrganiserV2Shell } from "@/components/navbar/navbarVisibility";
import { OrganiserBreadcrumbProvider } from "@/components/organiser/OrganiserBreadcrumbContext";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import OrganiserSidebar from "@/components/organiser/OrganiserSidebar";
import { useUser } from "@/components/utility/UserContext";
import {
  lighterCompanionFor,
  NEUTRAL_HUB_ACCENT,
  NEUTRAL_HUB_ACCENT_CONTRAST,
  resolveProfileColour,
} from "@/services/src/users/profileColour";
import { usePathname } from "next/navigation";
import { CSSProperties, useCallback, useEffect, useMemo, useState } from "react";

/** Matches `--color-surface` — kept in sync for body overscroll / Safari chrome. */
const ORGANISER_V2_CANVAS = "#f7f7f7";

function neutralAccentStyle(): CSSProperties {
  return {
    ["--color-accent" as string]: NEUTRAL_HUB_ACCENT,
    ["--color-accent-contrast" as string]: NEUTRAL_HUB_ACCENT_CONTRAST,
    ["--color-focus" as string]: NEUTRAL_HUB_ACCENT,
  };
}

export default function OrganiserShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, userLoading } = useUser();
  const [mobileOpen, setMobileOpen] = useState(false);
  const onMobileOpenChange = useCallback((open: boolean) => setMobileOpen(open), []);
  const openMobileNav = useCallback(() => setMobileOpen(true), []);
  const isV2Shell = usesOrganiserV2Shell(pathname);

  const accentStyle = useMemo((): CSSProperties => {
    // Black/white until the organiser profile is loaded and a colour is chosen.
    if (userLoading || !user.userId) return neutralAccentStyle();

    const accent = resolveProfileColour(user.profileColour);
    if (!accent) return neutralAccentStyle();

    return {
      ["--color-accent" as string]: accent,
      ["--color-accent-contrast" as string]: lighterCompanionFor(accent),
      ["--color-focus" as string]: accent,
    };
  }, [user.profileColour, user.userId, userLoading]);

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

  if (isV2Shell) {
    return (
      <OrganiserBreadcrumbProvider openMobileNav={openMobileNav}>
        <div className="min-h-screen bg-surface" style={accentStyle}>
          <OrganiserSidebar mobileOpen={mobileOpen} onMobileOpenChange={onMobileOpenChange} />
          <div className="min-h-screen transition-[padding] duration-200 lg:pl-[var(--organiser-sidebar-width)]">
            {children}
          </div>
        </div>
      </OrganiserBreadcrumbProvider>
    );
  }

  return (
    <div style={accentStyle}>
      <OrganiserNavbar />
      <div className="pb-28 sm:ml-14 sm:pb-0">{children}</div>
    </div>
  );
}
