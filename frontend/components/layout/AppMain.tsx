"use client";

import { usePathname } from "next/navigation";
import { ReactNode, useLayoutEffect } from "react";
import { shouldHideNavbar } from "@/components/navbar/navbarVisibility";

export function AppMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideTopNav = shouldHideNavbar(pathname);

  // Layouts stay mounted across App Router navigations, so window scroll can
  // carry onto the next page. Skip when the URL has a hash so in-page jumps work.
  useLayoutEffect(() => {
    if (window.location.hash) {
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <main
      id="main-content"
      className={hideTopNav ? "min-h-screen" : "min-h-screen pt-[var(--navbar-height)]"}
    >
      {children}
    </main>
  );
}
