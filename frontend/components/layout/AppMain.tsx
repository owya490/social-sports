"use client";

import { usePathname } from "next/navigation";
import { ReactNode } from "react";
import { shouldHideNavbar } from "@/components/navbar/navbarVisibility";

export function AppMain({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const hideTopNav = shouldHideNavbar(pathname);

  return (
    <main
      id="main-content"
      className={hideTopNav ? "min-h-screen" : "min-h-screen pt-[var(--navbar-height)]"}
    >
      {children}
    </main>
  );
}
