"use client";

import { usesOrganiserV2Shell } from "@/components/navbar/navbarVisibility";
import { OrganiserBreadcrumbProvider } from "@/components/organiser/OrganiserBreadcrumbContext";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import OrganiserSidebar from "@/components/organiser/OrganiserSidebar";
import { Bars3Icon } from "@heroicons/react/24/solid";
import { usePathname } from "next/navigation";
import { useCallback, useState } from "react";

export default function OrganiserShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const onMobileOpenChange = useCallback((open: boolean) => setMobileOpen(open), []);

  if (usesOrganiserV2Shell(pathname)) {
    return (
      <OrganiserBreadcrumbProvider>
        <div className="min-h-screen bg-background">
          <OrganiserSidebar mobileOpen={mobileOpen} onMobileOpenChange={onMobileOpenChange} />
          {/* Icon-only mobile menu control — no full-width header strip */}
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            data-tour="organiser-nav"
            className="fixed left-3 top-3 z-40 flex h-9 w-9 items-center justify-center rounded-xl text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus lg:hidden"
            aria-label="Open organiser menu"
          >
            <Bars3Icon className="h-5 w-5" aria-hidden />
          </button>
          <div className="min-h-screen transition-[padding] duration-200 lg:pl-[var(--organiser-sidebar-width)]">
            {children}
          </div>
        </div>
      </OrganiserBreadcrumbProvider>
    );
  }

  return (
    <>
      <OrganiserNavbar />
      <div className="pb-28 sm:ml-14 sm:pb-0">{children}</div>
    </>
  );
}
