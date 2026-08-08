"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";

type OrganiserBreadcrumbContextValue = {
  pageTitle: string | null;
  setPageTitle: (title: string | null) => void;
  openMobileNav: () => void;
};

const OrganiserBreadcrumbContext = createContext<OrganiserBreadcrumbContextValue | null>(null);

export function OrganiserBreadcrumbProvider({
  children,
  openMobileNav,
}: {
  children: ReactNode;
  openMobileNav: () => void;
}) {
  const pathname = usePathname();
  const [pageTitleState, setPageTitleState] = useState<{ path: string; title: string } | null>(null);

  const setPageTitle = useCallback(
    (title: string | null) => {
      const trimmed = title?.trim() ?? "";
      setPageTitleState(trimmed ? { path: pathname, title: trimmed } : null);
    },
    [pathname]
  );

  const pageTitle = pageTitleState?.path === pathname ? pageTitleState.title : null;
  const value = useMemo(
    () => ({ pageTitle, setPageTitle, openMobileNav }),
    [pageTitle, setPageTitle, openMobileNav]
  );

  return (
    <OrganiserBreadcrumbContext.Provider value={value}>{children}</OrganiserBreadcrumbContext.Provider>
  );
}

export function useOrganiserBreadcrumbTitle(title: string | null | undefined) {
  const ctx = useContext(OrganiserBreadcrumbContext);
  const setPageTitle = ctx?.setPageTitle;

  useEffect(() => {
    if (!setPageTitle) return;
    setPageTitle(title ?? null);
    return () => setPageTitle(null);
  }, [setPageTitle, title]);
}

export function useOrganiserPageTitle(): string | null {
  return useContext(OrganiserBreadcrumbContext)?.pageTitle ?? null;
}

export function useOpenOrganiserMobileNav(): (() => void) | null {
  return useContext(OrganiserBreadcrumbContext)?.openMobileNav ?? null;
}
