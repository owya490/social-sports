"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export const HIDDEN_NAVBAR_ROUTES = [
  /^\/login$/,
  /^\/register$/,
  /^\/organiser\/wrapped/, // Organiser wrapped page
  /^\/user\/[^/]+\/wrapped/, // Public wrapped page (/user/*/wrapped)
];

/** Routes that use the organiser v2 sidebar shell (no global SPORTSHUB navbar). */
export function usesOrganiserV2Shell(pathname: string): boolean {
  return pathname.startsWith("/organiser/v2");
}

/** `brandOnly` shows just the non-clickable logo, for partner sessions that must not navigate away. */
export type NavbarVariant = "full" | "brandOnly" | "hidden";

const HIDE_SPORTSHUB_NAVBAR_KEY = "hideSportshubNavbar";

export function shouldHideNavbar(pathname: string): boolean {
  return usesOrganiserV2Shell(pathname) || HIDDEN_NAVBAR_ROUTES.some((pattern) => pattern.test(pathname));
}

function getNavbarVariant(pathname: string): NavbarVariant {
  if (shouldHideNavbar(pathname)) return "hidden";
  if (sessionStorage.getItem(HIDE_SPORTSHUB_NAVBAR_KEY) === "true") return "brandOnly";
  return "full";
}

/**
 * Encapsulates all navbar-variant logic: reads initial state synchronously,
 * persists/reads the hideSportshubNavbar sessionStorage flag, and strips the URL param.
 */
export function useNavbarVariant(): NavbarVariant {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  // Initial state must only use pathname/searchParams so server and client render the same
  // (avoids hydration mismatch). sessionStorage is synced in useEffect after mount.
  const [variant, setVariant] = useState<NavbarVariant>(() => {
    if (shouldHideNavbar(pathname)) {
      return "hidden";
    }
    if (searchParams.get(HIDE_SPORTSHUB_NAVBAR_KEY) === "true") {
      return "brandOnly";
    }
    return "full";
  });

  // When landing with ?hideSportshubNavbar=true (from a partner), store in sessionStorage and strip param.
  useEffect(() => {
    if (searchParams.get(HIDE_SPORTSHUB_NAVBAR_KEY) === "true") {
      sessionStorage.setItem(HIDE_SPORTSHUB_NAVBAR_KEY, "true");
      setVariant(shouldHideNavbar(pathname) ? "hidden" : "brandOnly");

      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete(HIDE_SPORTSHUB_NAVBAR_KEY);
      const newSearch = newSearchParams.toString();
      const newUrl = newSearch ? `${pathname}?${newSearch}` : pathname;
      replace(newUrl, { scroll: false });
      return;
    }

    setVariant(getNavbarVariant(pathname));
  }, [pathname, searchParams, replace]);

  return variant;
}
