"use client";

import { useOrganiserPageTitle } from "@/components/organiser/OrganiserBreadcrumbContext";
import { resolveOrganiserBreadcrumbs } from "@/components/organiser/organiserNav";
import { welcomeAwareHref } from "@/components/organiser/v2/welcome/welcomeOnboarding";
import Logo from "@/public/images/BlackLogo.svg";
import { ChevronRightIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const crumbLinkClass =
  "inline-flex min-w-0 items-center gap-1.5 rounded-md text-sm font-normal text-foreground-muted transition-colors hover:text-foreground focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

const crumbCurrentClass =
  "inline-flex min-w-0 items-center gap-1.5 truncate text-sm font-medium text-foreground";

const crumbMutedClass =
  "inline-flex min-w-0 items-center gap-1.5 truncate text-sm font-normal text-foreground-muted";

/**
 * Compact trail above a page title — integrated into page headers, not chrome.
 * Organiser Hub › section › entity (when nested).
 * The leading "Organiser Hub" crumb is always static context — not a link.
 */
export function OrganiserBreadcrumbs() {
  const pathname = usePathname();
  const pageTitle = useOrganiserPageTitle();
  const crumbs = resolveOrganiserBreadcrumbs(pathname, pageTitle);

  if (crumbs.length === 0) return null;

  const onlyHub = crumbs.length === 1 && crumbs[0].label === "Organiser Hub";

  return (
    <nav className="mb-2.5" aria-label="Breadcrumb">
      <ol className="flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
        <li className="flex min-w-0 items-center gap-1.5">
          <span
            className={onlyHub ? crumbCurrentClass : crumbMutedClass}
            aria-current={onlyHub ? "page" : undefined}
          >
            <Image src={Logo} alt="" className="h-4 w-auto shrink-0" />
            <span className="truncate">Organiser Hub</span>
          </span>
        </li>

        {!onlyHub &&
          crumbs.map((crumb, index) => {
            const isLast = index === crumbs.length - 1;
            const href = crumb.href ? welcomeAwareHref(pathname, crumb.href) : undefined;
            const Icon = crumb.icon;

            return (
              <li key={`${crumb.label}-${index}`} className="flex min-w-0 items-center gap-1.5">
                <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-foreground-muted/60" aria-hidden />
                {href && !isLast ? (
                  <Link href={href} className={crumbLinkClass}>
                    {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" aria-hidden /> : null}
                    <span className="truncate">{crumb.label}</span>
                  </Link>
                ) : (
                  <span
                    className={isLast ? crumbCurrentClass : crumbMutedClass}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {!isLast && Icon ? (
                      <Icon className="h-3.5 w-3.5 shrink-0 stroke-[1.5]" aria-hidden />
                    ) : null}
                    {crumb.label}
                  </span>
                )}
              </li>
            );
          })}
      </ol>
    </nav>
  );
}
