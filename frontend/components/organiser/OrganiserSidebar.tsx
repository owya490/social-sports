"use client";

import { useUser } from "@/components/utility/UserContext";
import Logo from "@/public/images/BlackLogo.svg";
import {
  ArrowLeftIcon,
  ArrowPathIcon,
  ArrowRightIcon,
  CalendarIcon,
  CameraIcon,
  ChevronDownIcon,
  Cog6ToothIcon,
  LinkIcon,
  PencilSquareIcon,
  QuestionMarkCircleIcon,
  RectangleStackIcon,
  Squares2X2Icon,
  StarIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import { Bars3Icon } from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

const SIDEBAR_COLLAPSED_KEY = "organiser-sidebar-collapsed";

type NavItem = {
  href: string;
  label: string;
  icon: typeof Squares2X2Icon;
  isActive: (pathname: string) => boolean;
};

const isEventsSection = (pathname: string) =>
  pathname.startsWith("/organiser/v2/event") || pathname.startsWith("/organiser/event");

const EVENTS_CHILDREN: NavItem[] = [
  {
    href: "/organiser/v2/event/dashboard",
    label: "Event dashboard",
    icon: StarIcon,
    isActive: (pathname) =>
      pathname.startsWith("/organiser/v2/event/dashboard") || pathname.startsWith("/organiser/event/dashboard"),
  },
  {
    href: "/organiser/v2/event/recurring-events",
    label: "Recurring events",
    icon: ArrowPathIcon,
    isActive: (pathname) =>
      pathname.startsWith("/organiser/v2/event/recurring-events") ||
      pathname.startsWith("/organiser/event/recurring-events"),
  },
  {
    href: "/organiser/v2/event/event-collection",
    label: "Event collections",
    icon: RectangleStackIcon,
    isActive: (pathname) =>
      pathname.startsWith("/organiser/v2/event/event-collection") ||
      pathname.startsWith("/organiser/event/event-collection"),
  },
  {
    href: "/organiser/v2/event/custom-links",
    label: "Custom event links",
    icon: LinkIcon,
    isActive: (pathname) =>
      pathname.startsWith("/organiser/v2/event/custom-links") || pathname.startsWith("/organiser/event/custom-links"),
  },
];

const TOP_NAV: NavItem[] = [
  {
    href: "/organiser/v2/dashboard",
    label: "Dashboard",
    icon: Squares2X2Icon,
    isActive: (pathname) => /^\/organiser\/(v2\/)?dashboard/.test(pathname),
  },
];

const BOTTOM_NAV: NavItem[] = [
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
    collapsed ? "var(--organiser-sidebar-width-collapsed)" : "var(--organiser-sidebar-width-expanded)"
  );
}

const navItemClass = (active: boolean, collapsed?: boolean, nested?: boolean) =>
  `flex items-center rounded-xl text-xs font-medium font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
    collapsed ? "justify-center px-2 py-2" : nested ? "gap-2 px-2.5 py-1.5 pl-5" : "gap-2.5 px-2.5 py-1.5"
  } ${
    active
      ? "bg-surface-muted text-foreground"
      : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
  }`;

function NavLink({
  item,
  pathname,
  onNavigate,
  collapsed,
  nested,
}: {
  item: NavItem;
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
  nested?: boolean;
}) {
  const active = item.isActive(pathname);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      className={navItemClass(active, collapsed, nested)}
    >
      <Icon className="h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
      {!collapsed && item.label}
    </Link>
  );
}

function EventsNavGroup({
  pathname,
  onNavigate,
  collapsed,
}: {
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const sectionActive = isEventsSection(pathname);
  const [expanded, setExpanded] = useState(sectionActive);
  const [flyoutOpen, setFlyoutOpen] = useState(false);
  const flyoutRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (sectionActive) setExpanded(true);
  }, [sectionActive]);

  useEffect(() => {
    if (!flyoutOpen) return;

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (flyoutRef.current?.contains(target) || triggerRef.current?.contains(target)) return;
      setFlyoutOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFlyoutOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [flyoutOpen]);

  useEffect(() => {
    setFlyoutOpen(false);
  }, [pathname, collapsed]);

  if (collapsed) {
    return (
      <div className="relative">
        <button
          ref={triggerRef}
          type="button"
          title="Events"
          aria-label="Events"
          aria-expanded={flyoutOpen}
          aria-controls={panelId}
          onClick={() => setFlyoutOpen((open) => !open)}
          className={navItemClass(sectionActive || flyoutOpen, true)}
        >
          <CalendarIcon className="h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
        </button>
        {flyoutOpen && (
          <div
            ref={flyoutRef}
            id={panelId}
            role="menu"
            aria-label="Events"
            className="absolute left-full top-0 z-50 ml-2 w-52 rounded-xl border border-border bg-background p-1.5 shadow-[0_1px_2px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)]"
          >
            {EVENTS_CHILDREN.map((item) => {
              const active = item.isActive(pathname);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  role="menuitem"
                  onClick={() => {
                    setFlyoutOpen(false);
                    onNavigate?.();
                  }}
                  className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-medium font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                    active
                      ? "bg-surface-muted text-foreground"
                      : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                  {item.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded((open) => !open)}
        className={`flex w-full items-center gap-2.5 rounded-xl px-2.5 py-1.5 text-xs font-medium font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
          sectionActive ? "text-foreground" : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
        }`}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
        <span className="min-w-0 flex-1 text-left">Events</span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 shrink-0 stroke-[1.5] text-foreground-muted transition-transform duration-200 ease-out ${
            expanded ? "rotate-0" : "-rotate-90"
          }`}
          aria-hidden
        />
      </button>
      {expanded && (
        <div id={panelId} className="mt-0.5 flex flex-col gap-0.5" role="group" aria-label="Events">
          {EVENTS_CHILDREN.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} nested />
          ))}
        </div>
      )}
    </div>
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
  const displayName = [user.firstName, user.surname].filter(Boolean).join(" ").trim() || user.username || "Organiser";
  const subtitle = user.isVerifiedOrganiser ? "Verified organiser" : "Organiser";

  return (
    <div className={`flex h-full flex-col py-3 transition-[padding] duration-200 ${collapsed ? "px-1.5" : "px-2.5"}`}>
      <div className={collapsed ? "flex justify-center pb-3" : "border-b border-border pb-4"}>
        {!collapsed ? (
          <div className="px-0.5">
            <div className="flex items-center gap-2.5">
              <Image src={Logo} alt="" className="h-8 w-auto shrink-0" priority />
              <p className="font-sans text-md font-semibold leading-tight text-foreground">ORGANISER HUB</p>
            </div>
            <div className="flex justify-end">
              <Link
                href="/"
                onClick={onNavigate}
                className="origin-right scale-[0.85] rounded text-xs font-normal leading-none text-foreground-secondary transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Back to SPORTSHUB
              </Link>
            </div>
          </div>
        ) : (
          <Link
            href="/"
            onClick={onNavigate}
            className="shrink-0 rounded-xl p-1.5 transition-colors hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            aria-label="Back to SPORTSHUB"
          >
            <Image src={Logo} alt="" className="h-7 w-auto" priority />
          </Link>
        )}
      </div>

      <Link
        href="/profile"
        onClick={onNavigate}
        title={collapsed ? displayName : undefined}
        className={`mt-3.5 flex items-center rounded-xl transition-colors hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
          collapsed ? "justify-center p-1.5" : "gap-2.5 p-1.5 -mx-1.5"
        }`}
      >
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-surface-muted">
          {user.profilePicture ? (
            <Image src={user.profilePicture} alt="" fill className="object-cover" sizes="32px" />
          ) : null}
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate font-sans text-xs font-semibold text-foreground">{displayName}</p>
            <p className="truncate text-xs font-normal text-foreground-muted">{subtitle}</p>
          </div>
        )}
      </Link>

      <nav className="mt-4 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto" aria-label="Organiser navigation">
        {TOP_NAV.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} collapsed={collapsed} />
        ))}
        <EventsNavGroup pathname={pathname} onNavigate={onNavigate} collapsed={collapsed} />
        {BOTTOM_NAV.map((item) => (
          <NavLink key={item.href} item={item} pathname={pathname} onNavigate={onNavigate} collapsed={collapsed} />
        ))}
      </nav>

      <div className="mt-auto flex flex-col gap-0.5 pt-3">
        <NavLink
          item={{
            href: "/docs",
            label: "Get Help",
            icon: QuestionMarkCircleIcon,
            isActive: (path) => path.startsWith("/docs"),
          }}
          pathname={pathname}
          onNavigate={onNavigate}
          collapsed={collapsed}
        />
        <div
          className={`my-1 border-t border-border ${collapsed ? "mx-1.5" : "mx-0.5"}`}
          role="separator"
          aria-hidden
        />
        <div className={collapsed ? "flex flex-col items-center gap-0.5" : "flex items-center gap-0.5"}>
          <div className={collapsed ? undefined : "min-w-0 flex-1"}>
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
          {showCollapseToggle && onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className={`shrink-0 flex items-center justify-center rounded-xl text-foreground-secondary transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
                collapsed ? "px-2 py-2" : "px-1.5 py-1.5"
              }`}
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
