"use client";

import { usesOrganiserV2Shell } from "@/components/navbar/navbarVisibility";
import { OrganiserBreadcrumbProvider } from "@/components/organiser/OrganiserBreadcrumbContext";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import OrganiserSidebar from "@/components/organiser/OrganiserSidebar";
import { useUser } from "@/components/utility/UserContext";
import { DEFAULT_USER_PROFILE_PICTURE } from "@/services/src/users/usersConstants";
import {
  DEFAULT_ORGANISER_ACCENT,
  DEFAULT_ORGANISER_ACCENT_CONTRAST,
  resolveOrganiserAccentPalette,
} from "@/utilities/organiserAccentColour";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

/** Matches `--color-surface` — kept in sync for body overscroll / Safari chrome. */
const ORGANISER_V2_CANVAS = "#f7f7f7";

function applyAccentCssVars(target: HTMLElement, accent: string, contrast: string): void {
  target.style.setProperty("--color-accent", accent);
  target.style.setProperty("--color-accent-contrast", contrast);
  target.style.setProperty("--color-focus", accent);
}

function clearAccentCssVars(target: HTMLElement): void {
  target.style.removeProperty("--color-accent");
  target.style.removeProperty("--color-accent-contrast");
  target.style.removeProperty("--color-focus");
}

export default function OrganiserShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, userLoading } = useUser();
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

  // Derive hub accent from the organiser profile photo (cached 1 day in localStorage).
  useEffect(() => {
    if (!isV2Shell) return;

    const root = document.documentElement;
    let cancelled = false;

    const applyDefault = () => {
      applyAccentCssVars(root, DEFAULT_ORGANISER_ACCENT, DEFAULT_ORGANISER_ACCENT_CONTRAST);
    };

    const hasCustomPhoto =
      !userLoading &&
      Boolean(user.profilePicture) &&
      user.profilePicture !== DEFAULT_USER_PROFILE_PICTURE &&
      Boolean(user.userId);

    if (!hasCustomPhoto) {
      applyDefault();
      return () => {
        clearAccentCssVars(root);
      };
    }

    const imageUrl = user.profilePicture;
    const userId = user.userId;

    void (async () => {
      try {
        const palette = await resolveOrganiserAccentPalette(userId, imageUrl);
        if (cancelled) return;
        applyAccentCssVars(root, palette.accent, palette.contrast);
      } catch {
        if (cancelled) return;
        applyDefault();
      }
    })();

    return () => {
      cancelled = true;
      clearAccentCssVars(root);
    };
  }, [isV2Shell, user.profilePicture, user.userId, userLoading]);

  if (isV2Shell) {
    return (
      <OrganiserBreadcrumbProvider openMobileNav={openMobileNav}>
        <div className="min-h-screen bg-surface">
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
