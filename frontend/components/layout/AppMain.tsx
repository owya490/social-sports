"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { useScrollToTopOnNavigation } from "@/components/layout/useScrollToTopOnNavigation";
import { shouldHideNavbar } from "@/components/navbar/navbarVisibility";

export function AppMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideTopNav = shouldHideNavbar(pathname);
  useScrollToTopOnNavigation();

  return (
    <main
      id="main-content"
      className={hideTopNav ? "min-h-screen" : "min-h-screen pt-[var(--navbar-height)]"}
    >
      {children}
    </main>
  );
}
