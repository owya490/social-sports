"use client";

import { shouldHideNavbar } from "@/components/navbar/navbarVisibility";
import { usePathname } from "next/navigation";

/** Avoid a blank white fixed strip on routes that hide the global nav (e.g. organiser v2). */
export function NavbarSuspenseFallback() {
  const pathname = usePathname();
  if (shouldHideNavbar(pathname)) return null;
  return <div className="fixed top-0 left-0 right-0 h-[var(--navbar-height)] z-50 bg-white" aria-hidden />;
}
