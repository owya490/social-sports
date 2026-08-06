"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export const HIDDEN_NAVBAR_ROUTES = [
  /^\/organiser\/wrapped/, // Organiser wrapped page
  /^\/user\/[^/]+\/wrapped/, // Public wrapped page (/user/*/wrapped)
];

/** Routes that use the organiser v2 sidebar chrome (no global SPORTSHUB navbar). */
export function usesOrganiserV2Chrome(pathname: string): boolean {
  return pathname.startsWith("/organiser/v2");
}

const HIDE_SPORTSHUB_NAVBAR_KEY = "hideSportshubNavbar";

function pathnameHidesNavbar(pathname: string): boolean {
  return usesOrganiserV2Chrome(pathname) || HIDDEN_NAVBAR_ROUTES.some((pattern) => pattern.test(pathname));
}

export function shouldHideNavbar(pathname: string): boolean {
  if (pathnameHidesNavbar(pathname)) return true;
  if (typeof window !== "undefined") {
    if (sessionStorage.getItem(HIDE_SPORTSHUB_NAVBAR_KEY) === "true") {
      return true;
    }
  }
  return false;
}

/**
 * Encapsulates all navbar-visibility logic: reads initial state synchronously,
 * persists/reads the hideSportshubNavbar sessionStorage flag, and strips the URL param.
 * Returns true when the navbar should be hidden.
 */
export function useNavbarVisibility(): boolean {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  // Initial state must only use pathname/searchParams so server and client render the same
  // (avoids hydration mismatch). sessionStorage is synced in useEffect after mount.
  const [isNavbarHidden, setIsNavbarHidden] = useState<boolean>(() => {
    if (pathnameHidesNavbar(pathname)) {
      return true;
    }
    if (searchParams.get(HIDE_SPORTSHUB_NAVBAR_KEY) === "true") {
      return true;
    }
    return false;
  });

  // When landing with ?hideSportshubNavbar=true (from Syrio), store in sessionStorage and strip param.
  useEffect(() => {
    if (searchParams.get(HIDE_SPORTSHUB_NAVBAR_KEY) === "true") {
      sessionStorage.setItem(HIDE_SPORTSHUB_NAVBAR_KEY, "true");
      setIsNavbarHidden(true);

      // Strip ?hideSportshubNavbar=true from URL; navbar stays hidden via sessionStorage
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete(HIDE_SPORTSHUB_NAVBAR_KEY);
      const newSearch = newSearchParams.toString();
      const newUrl = newSearch ? `${pathname}?${newSearch}` : pathname;
      replace(newUrl, { scroll: false });
      return;
    }

    setIsNavbarHidden(shouldHideNavbar(pathname));
  }, [pathname, searchParams, replace]);

  return isNavbarHidden;
}
