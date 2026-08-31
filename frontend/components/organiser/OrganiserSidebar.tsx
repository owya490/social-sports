"use client";

import { OrganiserCommandSearch } from "@/components/organiser/OrganiserCommandSearch";
import { OrganiserNotificationsPanel } from "@/components/organiser/OrganiserNotificationsPanel";
import {
  isEventsNavGroupPath,
  ORGANISER_MAIN_NAV,
  ORGANISER_SECONDARY_NAV,
  type OrganiserNavItem,
} from "@/components/organiser/organiserNav";
import {
  isWelcomeFlowPath,
  WELCOME_CLOSE_MENU_EVENT,
  WELCOME_OPEN_MENU_EVENT,
  welcomeAwareHref,
} from "@/components/organiser/v2/welcome/welcomeOnboarding";
import { useUser } from "@/components/utility/UserContext";
import Logo from "@/public/images/BlackLogo.svg";
import { handleSignOut } from "@/services/src/auth/authService";
import { DEFAULT_USER_PROFILE_PICTURE } from "@/services/src/users/usersConstants";
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import {
  ArrowLeftStartOnRectangleIcon,
  BellIcon,
  ChevronDownIcon,
  ChevronUpDownIcon,
  Cog6ToothIcon,
  HomeIcon,
  MagnifyingGlassIcon,
  QuestionMarkCircleIcon,
} from "@heroicons/react/24/outline";
import { IconLayoutSidebar } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useCallback, useEffect, useState, type TransitionEvent } from "react";

const SIDEBAR_COLLAPSED_KEY = "organiser-sidebar-collapsed";

const ALL_NAV: OrganiserNavItem[] = [...ORGANISER_MAIN_NAV, ...ORGANISER_SECONDARY_NAV];

/** Custom photo only — hide the generic/default asset and empty loading state. */
function hasCustomProfilePicture(profilePicture: string | undefined, userLoading: boolean): boolean {
  if (userLoading || !profilePicture) return false;
  return profilePicture !== DEFAULT_USER_PROFILE_PICTURE;
}

function applySidebarWidth(collapsed: boolean) {
  document.documentElement.style.setProperty(
    "--organiser-sidebar-width",
    collapsed ? "var(--organiser-sidebar-width-collapsed)" : "var(--organiser-sidebar-width-expanded)"
  );
}

const navItemClass = (active: boolean, collapsed?: boolean) =>
  `flex items-center rounded-xl text-xs font-medium font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
    collapsed ? "justify-center px-2 py-2" : "gap-2.5 px-2.5 py-1.5"
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
  item: OrganiserNavItem;
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
  nested?: boolean;
}) {
  const active = item.isActive(pathname);
  const Icon = item.icon;
  const href = welcomeAwareHref(pathname, item.href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      title={collapsed ? item.label : undefined}
      data-tour={item.tourId}
      className={`${navItemClass(active, collapsed)} ${nested && !collapsed ? "pl-8" : ""}`}
    >
      <Icon className="h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
      {!collapsed && item.label}
    </Link>
  );
}

function NavGroup({
  item,
  pathname,
  onNavigate,
  collapsed,
}: {
  item: OrganiserNavItem;
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
}) {
  const children = item.children ?? [];
  const inGroup =
    item.isActive(pathname) ||
    children.some((child) => child.isActive(pathname)) ||
    (item.href.includes("/event/dashboard") && isEventsNavGroupPath(pathname));
  // Default open so nested items (e.g. Calendar under Events) are visible without a click.
  const [expanded, setExpanded] = useState(true);

  useEffect(() => {
    if (inGroup) setExpanded(true);
  }, [inGroup]);

  if (collapsed || children.length === 0) {
    return <NavLink item={item} pathname={pathname} onNavigate={onNavigate} collapsed={collapsed} />;
  }

  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-0.5">
        <Link
          href={welcomeAwareHref(pathname, item.href)}
          onClick={() => {
            setExpanded(true);
            onNavigate?.();
          }}
          data-tour={item.tourId}
          className={`${navItemClass(item.isActive(pathname))} min-w-0 flex-1`}
        >
          <item.icon className="h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
          {item.label}
        </Link>
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
          aria-label={expanded ? `Collapse ${item.label}` : `Expand ${item.label}`}
          aria-expanded={expanded}
        >
          <ChevronDownIcon
            className={`h-3.5 w-3.5 stroke-[1.5] transition-transform duration-150 ${expanded ? "rotate-0" : "-rotate-90"}`}
            aria-hidden
          />
        </button>
      </div>
      {expanded
        ? children.map((child) => (
            <NavLink key={child.href} item={child} pathname={pathname} onNavigate={onNavigate} nested />
          ))
        : null}
    </div>
  );
}

function SidebarSearch({ collapsed, onOpen }: { collapsed?: boolean; onOpen: () => void }) {
  if (collapsed) {
    return (
      <button
        type="button"
        onClick={onOpen}
        title="Search"
        className={navItemClass(false, true)}
        aria-label="Search organiser hub"
      >
        <MagnifyingGlassIcon className="h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full items-center gap-2 rounded-lg border border-border bg-background px-2.5 py-1 text-left text-xs text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      aria-label="Search organiser hub"
    >
      <MagnifyingGlassIcon className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" aria-hidden />
      <span className="min-w-0 flex-1 truncate">Search…</span>
      <kbd className="rounded border border-border bg-surface-muted px-1 py-px text-xs font-medium leading-none text-foreground-muted">
        ⌘K
      </kbd>
    </button>
  );
}

function UserAccountMenu({
  onNavigate,
  collapsed = false,
  onOpenNotifications,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onOpenNotifications: () => void;
}) {
  const { user, userLoading, setUser } = useUser();
  const displayName = [user.firstName, user.surname].filter(Boolean).join(" ").trim() || user.username || "Organiser";
  const subtitle = user.isVerifiedOrganiser ? "Verified organiser" : "Organiser";
  const showProfilePhoto = hasCustomProfilePicture(user.profilePicture, userLoading);

  const handleLogOut = async () => {
    onNavigate?.();
    try {
      await handleSignOut(setUser);
      // Full-page navigation avoids a router.push + refresh race that can leave
      // the organiser shell mounted after sign-out on the first click.
      window.location.assign("/");
    } catch (error) {
      console.error("Error during logout:", error);
      window.location.assign("/");
    }
  };

  return (
    <Menu as="div" className="relative">
      <MenuButton
        title={collapsed ? displayName : undefined}
        className={`flex w-full items-center rounded-xl transition-colors hover:bg-surface-hover focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus data-[open]:bg-surface-muted ${
          collapsed ? "justify-center p-1.5" : "gap-2.5 p-1.5 -mx-0.5"
        }`}
      >
        <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-surface-muted">
          {showProfilePhoto ? (
            <Image src={user.profilePicture} alt="" fill className="object-cover" sizes="32px" />
          ) : null}
        </div>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate font-sans text-xs font-semibold text-foreground">{displayName}</p>
              <p className="truncate text-xs font-normal text-foreground-muted">{subtitle}</p>
            </div>
            <ChevronUpDownIcon className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden />
          </>
        )}
      </MenuButton>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <MenuItems className="absolute bottom-full left-0 z-[60] mb-1.5 w-full min-w-[12rem] origin-bottom rounded-xl border border-border bg-background p-1 shadow-lg focus:outline-none">
          <div className="px-2.5 py-2">
            <p className="truncate font-sans text-xs font-semibold text-foreground">{displayName}</p>
            <p className="truncate text-xs text-foreground-muted">{subtitle}</p>
          </div>
          <div className="my-1 border-t border-border" role="separator" aria-hidden />
          <MenuItem>
            {({ focus }) => (
              <button
                type="button"
                onClick={onOpenNotifications}
                className={`${
                  focus ? "bg-surface-hover text-foreground" : "text-foreground-secondary"
                } flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium`}
              >
                <BellIcon className="h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                Notifications
              </button>
            )}
          </MenuItem>
          <MenuItem>
            {({ focus }) => (
              <Link
                href="/"
                onClick={onNavigate}
                className={`${
                  focus ? "bg-surface-hover text-foreground" : "text-foreground-secondary"
                } flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium`}
              >
                <HomeIcon className="h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                Back to SPORTSHUB
              </Link>
            )}
          </MenuItem>
          <MenuItem>
            {({ focus }) => (
              <button
                type="button"
                onClick={handleLogOut}
                className={`${
                  focus ? "bg-surface-hover text-foreground" : "text-foreground-secondary"
                } flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium`}
              >
                <ArrowLeftStartOnRectangleIcon className="h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                Log out
              </button>
            )}
          </MenuItem>
        </MenuItems>
      </Transition>
    </Menu>
  );
}

function SidebarContent({
  pathname,
  onNavigate,
  collapsed = false,
  onToggleCollapse,
  showCollapseToggle = false,
  onOpenSearch,
  onOpenNotifications,
}: {
  pathname: string;
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
  showCollapseToggle?: boolean;
  onOpenSearch: () => void;
  onOpenNotifications: () => void;
}) {
  return (
    <div className={`flex h-full flex-col py-3 transition-[padding] duration-200 ${collapsed ? "px-1.5" : "px-2.5"}`}>
      <div className={collapsed ? "flex justify-center pb-3" : "pb-2"}>
        {!collapsed ? (
          <div className="flex items-center gap-1.5">
            <Image src={Logo} alt="" className="h-8 w-auto shrink-0" priority />
            <p className="font-sans text-md font-semibold leading-tight text-foreground">
              ORGANISER HUB
              <sup className="ml-0.5 align-super text-[0.55em] font-semibold tracking-wide text-foreground-muted">
                V2
              </sup>
            </p>
          </div>
        ) : (
          <div className="shrink-0 rounded-xl p-1.5" aria-hidden>
            <Image src={Logo} alt="" className="h-7 w-auto" priority />
          </div>
        )}
      </div>

      <div className="mt-2">
        <SidebarSearch collapsed={collapsed} onOpen={onOpenSearch} />
      </div>

      <nav
        className="mt-3 flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto"
        aria-label="Organiser navigation"
        data-tour="organiser-nav"
      >
        {ALL_NAV.map((item) =>
          item.children?.length ? (
            <NavGroup
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={onNavigate}
              collapsed={collapsed}
            />
          ) : (
            <NavLink
              key={item.href}
              item={item}
              pathname={pathname}
              onNavigate={onNavigate}
              collapsed={collapsed}
            />
          )
        )}
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
        <div className={collapsed ? "flex flex-col items-center gap-0.5" : "flex items-center gap-0.5"}>
          <div className={collapsed ? undefined : "min-w-0 flex-1"}>
            <NavLink
              item={{
                href: "/organiser/v2/settings",
                label: "Settings",
                icon: Cog6ToothIcon,
                isActive: (path) => path.startsWith("/organiser/v2/settings"),
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
              <IconLayoutSidebar className="h-4 w-4 shrink-0" stroke={1.5} aria-hidden />
            </button>
          )}
        </div>
        <div className={`mt-1 border-t border-border pt-2 ${collapsed ? "mx-1.5" : "mx-0.5"}`}>
          <UserAccountMenu
            onNavigate={onNavigate}
            collapsed={collapsed}
            onOpenNotifications={onOpenNotifications}
          />
        </div>
      </div>
    </div>
  );
}

type OrganiserSidebarProps = {
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
};

export default function OrganiserSidebar({ mobileOpen, onMobileOpenChange }: OrganiserSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  /** Keep mounted through the close animation, then remove so Safari stops sampling the white drawer. */
  const [mobileDrawerMounted, setMobileDrawerMounted] = useState(false);
  const [mobileDrawerShown, setMobileDrawerShown] = useState(false);

  const openNotifications = useCallback(() => {
    onMobileOpenChange(false);
    setNotificationsOpen(true);
  }, [onMobileOpenChange]);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      applySidebarWidth(next);
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    if (!mobileOpen) {
      setMobileDrawerShown(false);
      return;
    }
    setMobileDrawerMounted(true);
    const frame = requestAnimationFrame(() => setMobileDrawerShown(true));
    return () => cancelAnimationFrame(frame);
  }, [mobileOpen]);

  const handleMobileDrawerTransitionEnd = (event: TransitionEvent<HTMLElement>) => {
    if (event.propertyName !== "transform" || mobileOpen) return;
    setMobileDrawerMounted(false);
  };

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
    const isCollapsed = stored === "true";
    setCollapsed(isCollapsed);
    applySidebarWidth(isCollapsed);
  }, []);

  useEffect(() => {
    onMobileOpenChange(false);
  }, [pathname, onMobileOpenChange]);

  useEffect(() => {
    if (!isWelcomeFlowPath(pathname)) return;
    const open = () => onMobileOpenChange(true);
    const close = () => onMobileOpenChange(false);
    window.addEventListener(WELCOME_OPEN_MENU_EVENT, open);
    window.addEventListener(WELCOME_CLOSE_MENU_EVENT, close);
    return () => {
      window.removeEventListener(WELCOME_OPEN_MENU_EVENT, open);
      window.removeEventListener(WELCOME_CLOSE_MENU_EVENT, close);
    };
  }, [pathname, onMobileOpenChange]);

  useEffect(() => {
    if (!mobileOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onMobileOpenChange(false);
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = "";
    };
  }, [mobileOpen, onMobileOpenChange]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target?.isContentEditable) {
        return;
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setSearchOpen(true);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <>
      {mobileDrawerMounted ? (
        <aside
          className={`fixed inset-y-0 left-0 z-50 w-[min(100%,var(--organiser-sidebar-width-expanded))] bg-transparent transition-transform duration-300 ease-out lg:hidden ${
            mobileDrawerShown ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-label="Organiser sidebar"
          aria-hidden={!mobileOpen}
          data-tour="organiser-sidebar"
          onTransitionEnd={handleMobileDrawerTransitionEnd}
        >
          <div className="mb-[env(safe-area-inset-bottom)] mt-[env(safe-area-inset-top)] flex h-[calc(100%-env(safe-area-inset-top)-env(safe-area-inset-bottom))] flex-col border-r border-border bg-background">
            <SidebarContent
              pathname={pathname}
              onNavigate={() => onMobileOpenChange(false)}
              onOpenSearch={() => setSearchOpen(true)}
              onOpenNotifications={openNotifications}
            />
          </div>
        </aside>
      ) : null}

      <aside
        className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:flex lg:w-[var(--organiser-sidebar-width)] lg:flex-col lg:border-r lg:border-border lg:bg-background lg:transition-[width] lg:duration-200"
        aria-label="Organiser sidebar"
        data-collapsed={collapsed}
        data-tour="organiser-sidebar"
      >
        <SidebarContent
          pathname={pathname}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
          showCollapseToggle
          onOpenSearch={() => setSearchOpen(true)}
          onOpenNotifications={openNotifications}
        />
      </aside>

      <OrganiserCommandSearch open={searchOpen} onClose={() => setSearchOpen(false)} />
      <OrganiserNotificationsPanel open={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
    </>
  );
}
