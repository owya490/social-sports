"use client";

import { trackScreen } from "@/services/src/analytics/analyticsService";
import { useEffect } from "react";

export function useTrackScreen(pageTemplate: string, pageGroup: string) {
  useEffect(() => {
    try {
      const pagePath = typeof window === "undefined" ? pageTemplate : window.location.pathname;
      trackScreen(pageTemplate, pagePath, pageGroup);
    } catch {
      // A failed screen view must not break the page.
    }
  }, [pageTemplate, pageGroup]);
}
