"use client";

import {
  CameraIcon,
  Cog6ToothIcon,
  PencilSquareIcon,
  PlusCircleIcon,
  Squares2X2Icon,
} from "@heroicons/react/24/outline";
import Link from "next/link";

const QUICK_LINKS = [
  { href: "/event/create", label: "Create event", icon: PlusCircleIcon },
  { href: "/organiser/event/dashboard", label: "Events", icon: Squares2X2Icon },
  { href: "/organiser/forms/gallery", label: "Forms", icon: PencilSquareIcon },
  { href: "/organiser/gallery", label: "Gallery", icon: CameraIcon },
  { href: "/organiser/settings", label: "Settings", icon: Cog6ToothIcon },
];

export function DashboardQuickNav() {
  return (
    <section aria-label="Shortcuts" className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-8">
      <h2 className="sr-only">Shortcuts</h2>
      <div className="grid grid-cols-5 gap-2">
        {QUICK_LINKS.map((link) => {
          const Icon = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-border bg-background px-2 py-3 hover:bg-surface-hover transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus min-h-[4.5rem]"
            >
              <Icon className="h-5 w-5 text-foreground-secondary shrink-0" aria-hidden />
              <span className="font-sans text-xs font-medium text-foreground text-center leading-tight">
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
