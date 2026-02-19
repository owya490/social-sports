"use client";

import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export const HIDDEN_NAVBAR_ROUTES = [
  /^\/organiser\/wrapped/, // Organiser wrapped page
  /^\/user\/[^/]+\/wrapped/, // Public wrapped page (/user/*/wrapped)
];

export const FULFILMENT_ROUTE_PATTERN = /^\/fulfilment\/([^/]+)\/([^/]+)/;

export function shouldHideNavbar(pathname: string): boolean {
  if (HIDDEN_NAVBAR_ROUTES.some((pattern) => pattern.test(pathname))) {
    return true;
  }
  if (typeof window !== "undefined") {
    const fulfilmentMatch = pathname.match(FULFILMENT_ROUTE_PATTERN);
    if (fulfilmentMatch) {
      const [, fulfilmentSessionId] = fulfilmentMatch;
      if (sessionStorage.getItem(`hideNavbar_${fulfilmentSessionId}`) === "true") {
        return true;
      }
    }
  }
  return false;
}

/**
 * Encapsulates all navbar-visibility logic: reads initial state synchronously,
 * persists/clears the hideNavbar sessionStorage flag, and strips the URL param.
 * Returns true when the navbar should be hidden.
 */
export function useNavbarVisibility(): boolean {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  // Initialized synchronously so the very first client render can already hide the navbar
  // without waiting for useEffect to write sessionStorage.
  const [isNavbarHidden, setIsNavbarHidden] = useState<boolean>(() => {
    if (HIDDEN_NAVBAR_ROUTES.some((pattern) => pattern.test(pathname))) {
      return true;
    }
    const fulfilmentMatch = pathname.match(FULFILMENT_ROUTE_PATTERN);
    if (fulfilmentMatch) {
      // ?hideNavbar=true is detectable before sessionStorage is written
      if (searchParams.get("hideNavbar") === "true") {
        return true;
      }
      // sessionStorage is only available on the client
      if (typeof window !== "undefined") {
        const [, fulfilmentSessionId] = fulfilmentMatch;
        if (sessionStorage.getItem(`hideNavbar_${fulfilmentSessionId}`) === "true") {
          return true;
        }
      }
    }
    return false;
  });

  // When landing with ?hideNavbar=true (from Syrio), store in sessionStorage and strip param.
  // When leaving fulfilment flow, clear all hideNavbar_* keys so future sessions show navbar.
  useEffect(() => {
    const fulfilmentMatch = pathname.match(FULFILMENT_ROUTE_PATTERN);
    const isOnFulfilmentRoute = Boolean(fulfilmentMatch);

    if (searchParams.get("hideNavbar") === "true" && fulfilmentMatch) {
      const [, fulfilmentSessionId] = fulfilmentMatch;
      sessionStorage.setItem(`hideNavbar_${fulfilmentSessionId}`, "true");
      setIsNavbarHidden(true);

      // Strip ?hideNavbar=true from URL; navbar stays hidden via sessionStorage
      const newSearchParams = new URLSearchParams(searchParams.toString());
      newSearchParams.delete("hideNavbar");
      const newSearch = newSearchParams.toString();
      const newUrl = newSearch ? `${pathname}?${newSearch}` : pathname;
      replace(newUrl, { scroll: false });
      return;
    }

    if (!isOnFulfilmentRoute) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key?.startsWith("hideNavbar_")) keysToRemove.push(key);
      }
      keysToRemove.forEach((key) => sessionStorage.removeItem(key));
      setIsNavbarHidden(HIDDEN_NAVBAR_ROUTES.some((pattern) => pattern.test(pathname)));
      return;
    }

    // On a fulfilment route without ?hideNavbar=true — sync state with sessionStorage
    const [, fulfilmentSessionId] = fulfilmentMatch!;
    setIsNavbarHidden(sessionStorage.getItem(`hideNavbar_${fulfilmentSessionId}`) === "true");
  }, [pathname, searchParams, replace]);

  return isNavbarHidden;
}
