"use client";

import { useUser } from "@/components/utility/UserContext";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CalendarIcon,
  CameraIcon,
  Cog6ToothIcon,
  PencilSquareIcon,
  Squares2X2Icon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Bars3Icon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Logo from "@/public/images/BlackLogo.svg";

const SIDEBAR_COLLAPSED_KEY = "organiser-sidebar-collapsed";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Squares2X2Icon;
  isActive: (pathname: string) => boolean;
};

const MAIN_NAV: NavItem[] = [
  {
    href: "/organiser/v2/dashboard",
    label: "Dashboard",
    icon: Squares2X2Icon,
    isActive: (pathname) => /^\/organiser\/(v2\/)?dashboard/.test(pathname),
  },
  {
    href: "/organiser/event/dashboard",
    label: "Events",
    icon: CalendarIcon,
    isActive: (pathname) => pathname.startsWith("/organiser/event"),
  },
  {
    href: "/organiser/forms/gallery",
    label: "Forms",
    icon: PencilSquareIcon,
    isActive: (pathname) => pathname.startsWith("/organiser/forms"),
  },
  {
    href: "/organiser/gallery",
    label: "Gallery",
    icon: CameraIcon,
    isActive: (pathname) => pathname.startsWith("/organiser/gallery"),
  },
];

function applySidebarWidth(collapsed: boolean) {
  document.documentElement.style.setProperty(
    "--organiser-sidebar-width",
    collapsed
      ? "var(--organiser-sidebar-width-collapsed)"
      : "var(--organiser-sidebar-width-expanded)",
  );
}

function NavLink({
  item,
  pathname,
  onNavigate,
  collapsed,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const active = item.isActive(pathname);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={`flex items-center rounded-xl text-xs font-medium font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
        collapsed ? "justify-center px-2 py-2" : "gap-2.5 px-2.5 py-1.5"
      } ${
        active
          ? "bg-surface-muted text-foreground"
          : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
      {!collapsed && item.label}
    </Link>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
  showCollapseToggle = false,
}: {
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  showCollapseToggle?: boolean;
}) {
  const { user } = useUser();
  const displayName =
    [user.firstName, user.surname].filter(Boolean).join(" ").trim() || user.username || "Organiser";
  const subtitle = user.isVerifiedOrganiser ? "Verified organiser" : "Organiser";

  return (
    <div
      className={`flex h-full flex-col py-4 transition-[padding] duration-200 ${
        collapsed ? "px-2" : "px-3"
      }`}
    >
      <div
        className={
          collapsed
            ? "flex items-center justify-between gap-0.5"
            : "flex items-start gap-2"
        }
      >
        {collapsed ? (
          <Link
            href="/"
            onClick={onNavigate}
            className="shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
            aria-label="SPORTSHUB home"
          >
            <Image
              src={Logo}
              alt="SPORTSHUB"
              className="h-6 w-auto"
              priority
            />
          </Link>
        ) : (
          <Image
            src={Logo}
            alt="SPORTSHUB"
            className="h-10 w-auto shrink-0"
            priority
          />
        )}

        {!collapsed && (
          <div className="min-w-0 flex-1 pt-0.5">
            <span className="font-sans text-sm font-semibold leading-tight text-foreground">
              Organiser Hub
            </span>
            <Link
              href="/"
              onClick={onNavigate}
              className="mt-0.5 block text-[10px] text-foreground-muted hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            >
              Back to SPORTSHUB
            </Link>
          </div>
        )}

        {showCollapseToggle && onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="shrink-0 p-0.5 text-foreground-secondary transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
          >
            {collapsed ? (
              <ArrowRightIcon className="h-4 w-4 shrink-0" aria-hidden />
            ) : (
              <ArrowLeftIcon className="h-4 w-4 shrink-0" aria-hidden />
            )}
          </button>
        )}
      </div>

      <Link
        href="/profile"
        onClick={onNavigate}
        title={collapsed ? displayName : undefined}
        className={`mt-5 flex items-center rounded-xl transition-colors hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
          collapsed ? "justify-center p-1.5" : "gap-2.5 p-1.5 -mx-1.5"
        }`}
      >
        <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-surface-muted">
          {user.profilePicture ? (
            <Image
              src={user.profilePicture}
              alt=""
              fill
              className="object-cover"
              sizes="36px"
            />
          ) : null}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-sans text-xs font-semibold text-foreground">{displayName}</p>
            <p className="truncate text-xs font-normal text-foreground-muted">{subtitle}</p>
          </div>
        )}
      </Link>

      <nav className="mt-5 flex flex-col gap-0.5" aria-label="Organiser navigation">
        {MAIN_NAV.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            pathname={pathname}
            onNavigate={onNavigate}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5 pt-4">
        <NavLink
          item={{
            href: "/organiser/settings",
            label: "Settings",
            icon: Cog6ToothIcon,
            isActive: (path) => path.startsWith("/organiser/settings"),
          }}
          pathname={pathname}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />
      </div>
    </div>
  );
}

export default function OrganiserSidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      applySidebarWidth(next);
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    const isCollapsed = stored === "true";
    setCollapsed(isCollapsed);
    applySidebarWidth(isCollapsed);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileOpen(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  return (
    <>
      {/* Mobile menu trigger */}
      <button
        type="button"
        className="fixed top-4 left-4 z-40 flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-foreground shadow-sm lg:hidden focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
        onClick={() => setMobileOpen(true)}
        aria-label="Open organiser menu"
      >
        <Bars3Icon className="h-6 w-6" aria-hidden />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          aria-label="Close menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer — always expanded */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-[min(100%,var(--organiser-sidebar-width-expanded))] border-r border-border bg-background transition-transform duration-300 ease-out lg:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-label="Organiser sidebar"
      >
        <button
          type="button"
          className="absolute top-4 right-3 flex h-8 w-8 items-center justify-center rounded-lg text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
          onClick={() => setMobileOpen(false)}
          aria-label="Close menu"
        >
          <XMarkIcon className="h-5 w-5" aria-hidden />
        </button>
        <SidebarContent pathname={pathname} onNavigate={() => setMobileOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-[var(--organiser-sidebar-width)] lg:flex-col lg:border-r lg:border-border lg:bg-background lg:transition-[width] lg:duration-200"
        aria-label="Organiser sidebar"
        data-collapsed={collapsed}
      >
        <SidebarContent
          pathname={pathname}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
          showCollapseToggle
        />
      </aside>
    </>
  );
}
