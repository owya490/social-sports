"use client";

import { usePathname } from "next/navigation";
import { useEffect, useLayoutEffect } from "react";
import { hasHashTarget, resetWindowScroll } from "@/components/layout/scrollToTopOnNavigation";

/**
 * App Router layouts stay mounted across client navigations, so window scroll can
 * carry onto the next page. Reset to the top unless the destination has a hash.
 */
export function useScrollToTopOnNavigation(): void {
  const pathname = usePathname();

  useEffect(() => {
    if ("scrollRestoration" in history) {
      history.scrollRestoration = "manual";
    }
  }, []);

  useLayoutEffect(() => {
    if (hasHashTarget(window.location.hash)) {
      return;
    }

    const reset = () => {
      resetWindowScroll((x, y) => window.scrollTo(x, y));
    };

    reset();
    // Next.js / the browser may re-apply the previous offset after this commit.
    const frame = window.requestAnimationFrame(reset);
    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);
}
