"use client";

import { usesOrganiserV2Shell } from "@/components/navbar/navbarVisibility";
import { OrganiserBreadcrumbProvider } from "@/components/organiser/OrganiserBreadcrumbContext";
import OrganiserNavbar from "@/components/organiser/OrganiserNavbar";
import OrganiserSidebar from "@/components/organiser/OrganiserSidebar";
import { lockOrganiserV2Chrome } from "@/components/organiser/organiserV2Chrome";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function OrganiserShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const onMobileOpenChange = useCallback((open: boolean) => setMobileOpen(open), []);
  const openMobileNav = useCallback(() => setMobileOpen(true), []);
  const isV2Shell = usesOrganiserV2Shell(pathname);

  // Keep html/body on Clubhouse Grey so overscroll and browser chrome match the hub.
  useEffect(() => {
    if (!isV2Shell) return;
    const root = document.documentElement;
    const body = document.body;
    const prevRootBg = root.style.backgroundColor;
    const prevBodyBg = body.style.backgroundColor;
    const prevColorScheme = root.style.colorScheme;
    const themeMetas = Array.from(document.querySelectorAll('meta[name="theme-color"]'));
    const prevThemeHtml = themeMetas.map((meta) => meta.outerHTML);
    lockOrganiserV2Chrome();
    return () => {
      root.style.backgroundColor = prevRootBg;
      root.style.colorScheme = prevColorScheme;
      body.style.backgroundColor = prevBodyBg;
      document.querySelectorAll('meta[name="theme-color"]').forEach((meta) => meta.remove());
      prevThemeHtml.forEach((html) => document.head.insertAdjacentHTML("beforeend", html));
    };
  }, [isV2Shell]);

  useEffect(() => {
    if (!isV2Shell) return;
    lockOrganiserV2Chrome();
  }, [isV2Shell, mobileOpen]);

  if (isV2Shell) {
    return (
      <OrganiserBreadcrumbProvider openMobileNav={openMobileNav}>
        <div className="min-h-screen bg-surface">
          <OrganiserSidebar mobileOpen={mobileOpen} onMobileOpenChange={onMobileOpenChange} />
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
