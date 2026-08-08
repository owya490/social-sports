"use client";

import { welcomeAwareHref } from "@/components/organiser/v2/welcome/welcomeOnboarding";
import { ORGANISER_SEARCH_DESTINATIONS } from "@/components/organiser/organiserNav";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";

type OrganiserCommandSearchProps = {
  open: boolean;
  onClose: () => void;
};

function matchesQuery(
  label: string,
  keywords: string[] | undefined,
  query: string
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (label.toLowerCase().includes(q)) return true;
  return (keywords ?? []).some((k) => k.toLowerCase().includes(q));
}

export function OrganiserCommandSearch({ open, onClose }: OrganiserCommandSearchProps) {
  const pathname = usePathname();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const results = useMemo(
    () =>
      ORGANISER_SEARCH_DESTINATIONS.filter((item) =>
        matchesQuery(item.label, item.keywords, query)
      ),
    [query]
  );

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    const id = window.setTimeout(() => inputRef.current?.focus(), 10);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const goTo = (href: string) => {
    onClose();
    router.push(welcomeAwareHref(pathname, href));
  };

  return (
    <Transition show={open} as={Fragment}>
      <Dialog onClose={onClose} className="relative z-[80]">
        <TransitionChild
          as={Fragment}
          enter="ease-out duration-150"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-foreground/20" aria-hidden />
        </TransitionChild>

        <div className="fixed inset-0 overflow-y-auto p-4 sm:p-6">
          <div className="flex min-h-full items-start justify-center pt-[12vh]">
            <TransitionChild
              as={Fragment}
              enter="ease-out duration-150"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-100"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <DialogPanel className="w-full max-w-md overflow-hidden rounded-xl border border-border bg-background shadow-lg">
                <div className="flex items-center gap-2 border-b border-border px-3">
                  <MagnifyingGlassIcon className="h-4 w-4 shrink-0 text-foreground-muted" aria-hidden />
                  <input
                    ref={inputRef}
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "ArrowDown") {
                        e.preventDefault();
                        setActiveIndex((i) => Math.min(i + 1, Math.max(results.length - 1, 0)));
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setActiveIndex((i) => Math.max(i - 1, 0));
                      } else if (e.key === "Enter" && results[activeIndex]) {
                        e.preventDefault();
                        goTo(results[activeIndex].href);
                      }
                    }}
                    placeholder="Search organiser hub…"
                    className="h-11 w-full border-0 bg-transparent text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-0"
                    aria-label="Search organiser hub"
                  />
                  <kbd className="hidden sm:inline-flex rounded-md border border-border bg-surface-muted px-1.5 py-0.5 text-xs font-medium text-foreground-muted">
                    esc
                  </kbd>
                </div>

                <ul className="max-h-72 overflow-y-auto p-1.5" role="listbox">
                  {results.length === 0 ? (
                    <li className="px-3 py-6 text-center text-sm text-foreground-muted">No matches</li>
                  ) : (
                    results.map((item, index) => {
                      const Icon = item.icon;
                      const active = index === activeIndex;
                      return (
                        <li key={item.href} role="option" aria-selected={active}>
                          <button
                            type="button"
                            onClick={() => goTo(item.href)}
                            onMouseEnter={() => setActiveIndex(index)}
                            className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
                              active
                                ? "bg-surface-muted text-foreground"
                                : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
                            }`}
                          >
                            <Icon className="h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
                            <span className="truncate font-medium">{item.label}</span>
                          </button>
                        </li>
                      );
                    })
                  )}
                </ul>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}
