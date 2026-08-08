"use client";

import {
  useOpenOrganiserMobileNav,
  useOrganiserPageTitle,
} from "@/components/organiser/OrganiserBreadcrumbContext";
import { resolveOrganiserBreadcrumbs } from "@/components/organiser/organiserNav";
import { welcomeAwareHref } from "@/components/organiser/v2/welcome/welcomeOnboarding";
import Logo from "@/public/images/BlackLogo.svg";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import { IconLayoutSidebar } from "@tabler/icons-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const crumbLinkClass =
  "inline-flex shrink-0 items-center gap-1.5 rounded-md text-sm font-normal text-foreground-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const crumbCurrentClass =
  "inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-foreground";

const crumbMutedClass =
  "inline-flex shrink-0 items-center gap-1.5 text-sm font-normal text-foreground-muted";

/**
 * Compact trail above a page title — integrated into page headers, not chrome.
 * Organiser Hub › section › entity (when nested).
 * The leading "Organiser Hub" crumb is always static context — not a link.
 * On mobile, a sidebar trigger sits to the left of the trail (same IconLayoutSidebar as desktop).
 */
export function OrganiserBreadcrumbs() {
  const pathname = usePathname();
  const pageTitle = useOrganiserPageTitle();
  const openMobileNav = useOpenOrganiserMobileNav();
  const crumbs = resolveOrganiserBreadcrumbs(pathname, pageTitle);

  if (crumbs.length === 0) return null;

  const onlyHub = crumbs.length === 1 && crumbs[0].label === "Organiser Hub";

  return (
    <nav className="mb-2.5" aria-label="Breadcrumb">
      <div className="flex min-w-0 items-center gap-2">
        {openMobileNav ? (
          <button
            type="button"
            onClick={openMobileNav}
            data-tour="organiser-nav"
            className="lg:hidden -ml-1.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-foreground-muted transition-colors hover:bg-surface-hover hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
            aria-label="Open organiser menu"
          >
            <IconLayoutSidebar className="h-5 w-5" stroke={1.5} aria-hidden />
          </button>
        ) : null}
        <ol className="flex min-w-0 flex-nowrap items-center gap-x-1.5 overflow-x-auto overflow-y-hidden no-scrollbar">
          <li className="flex shrink-0 items-center gap-1.5">
            <span
              className={onlyHub ? crumbCurrentClass : crumbMutedClass}
              aria-current={onlyHub ? "page" : undefined}
            >
              <Image src={Logo} alt="" className="h-4 w-auto shrink-0" />
              <span className="whitespace-nowrap">Organiser Hub</span>
            </span>
          </li>

          {!onlyHub &&
            crumbs.map((crumb, index) => {
              const isLast = index === crumbs.length - 1;
              const href = crumb.href ? welcomeAwareHref(pathname, crumb.href) : undefined;
              const Icon = crumb.icon;

              return (
                <li key={`${crumb.label}-${index}`} className="flex shrink-0 items-center gap-1.5">
                  <ChevronRightIcon
                    className="h-3.5 w-3.5 shrink-0 text-foreground-muted/60"
                    aria-hidden
                  />
                  {href && !isLast ? (
                    <Link href={href} className={crumbLinkClass}>
                      {Icon ? (
                        <Icon className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" aria-hidden />
                      ) : null}
                      <span className="whitespace-nowrap">{crumb.label}</span>
                    </Link>
                  ) : (
                    <span
                      className={isLast ? crumbCurrentClass : crumbMutedClass}
                      aria-current={isLast ? "page" : undefined}
                    >
                      {!isLast && Icon ? (
                        <Icon className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" aria-hidden />
                      ) : null}
                      <span className="whitespace-nowrap">{crumb.label}</span>
                    </span>
                  )}
                </li>
              );
            })}
        </ol>
      </div>
    </nav>
  );
}
