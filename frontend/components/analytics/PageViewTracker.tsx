"use client";

import { trackScreen } from "@/services/src/analytics/analyticsService";
import { screenForPathname } from "@/services/src/analytics/pageTemplates";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

export default function PageViewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      if (!pathname) {
        return;
      }
      const screen = screenForPathname(pathname);
      trackScreen(screen.pageTemplate, pathname, screen.pageGroup);
    } catch {
      // A failed page view must not break navigation.
    }
  }, [pathname]);

  return null;
}
