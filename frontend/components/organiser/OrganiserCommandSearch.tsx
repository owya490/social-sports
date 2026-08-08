"use client";

import {
  getCachedOrganiserCommandCatalogue,
  loadOrganiserCommandCatalogue,
  takeMatchingEntities,
  type OrganiserCommandCatalogue,
  type OrganiserCommandEntity,
  type OrganiserCommandEntityKind,
} from "@/components/organiser/organiserCommandCatalogue";
import { ORGANISER_SEARCH_DESTINATIONS, type OrganiserNavItem } from "@/components/organiser/organiserNav";
import { welcomeAwareEventHref, welcomeAwareHref } from "@/components/organiser/v2/welcome/welcomeOnboarding";
import { useUser } from "@/components/utility/UserContext";
import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import {
  ArrowPathIcon,
  CalendarIcon,
  LinkIcon,
  MagnifyingGlassIcon,
  PencilSquareIcon,
  RectangleStackIcon,
} from "@heroicons/react/24/outline";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type OrganiserCommandSearchProps = {
  open: boolean;
  onClose: () => void;
};

type FlatResult =
  | { type: "page"; key: string; item: OrganiserNavItem }
  | { type: "entity"; key: string; item: OrganiserCommandEntity };

const ENTITY_GROUP_META: {
  key: keyof OrganiserCommandCatalogue;
  kind: OrganiserCommandEntityKind;
  label: string;
  icon: typeof CalendarIcon;
}[] = [
  { key: "events", kind: "event", label: "Events", icon: CalendarIcon },
  { key: "recurring", kind: "recurring", label: "Recurring events", icon: ArrowPathIcon },
  { key: "collections", kind: "collection", label: "Collections", icon: RectangleStackIcon },
  { key: "customLinks", kind: "custom-link", label: "Custom links", icon: LinkIcon },
  { key: "forms", kind: "form", label: "Forms", icon: PencilSquareIcon },
];

const EMPTY_CATALOGUE: OrganiserCommandCatalogue = {
  events: [],
  recurring: [],
  collections: [],
  customLinks: [],
  forms: [],
};

function matchesPage(item: OrganiserNavItem, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (item.label.toLowerCase().includes(q)) return true;
  return (item.keywords ?? []).some((k) => k.toLowerCase().includes(q));
}

export function OrganiserCommandSearch({ open, onClose }: OrganiserCommandSearchProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [catalogue, setCatalogue] = useState<OrganiserCommandCatalogue>(EMPTY_CATALOGUE);
  const [catalogueLoading, setCatalogueLoading] = useState(false);
  const [catalogueError, setCatalogueError] = useState(false);

  const pages = useMemo(
    () => ORGANISER_SEARCH_DESTINATIONS.filter((item) => matchesPage(item, query)),
    [query]
  );

  const entityGroups = useMemo(() => {
    const q = query.trim();
    // Empty query keeps the palette as a page switcher; entities appear once you type.
    if (!q) return [];

    return ENTITY_GROUP_META.map((group) => ({
      ...group,
      items: takeMatchingEntities(catalogue[group.key], q),
    })).filter((group) => group.items.length > 0);
  }, [catalogue, query]);

  const flatResults = useMemo((): FlatResult[] => {
    const results: FlatResult[] = pages.map((item) => ({
      type: "page",
      key: `page:${item.href}`,
      item,
    }));

    for (const group of entityGroups) {
      for (const item of group.items) {
        results.push({
          type: "entity",
          key: `${item.kind}:${item.id}`,
          item,
        });
      }
    }

    return results;
  }, [pages, entityGroups]);

  const resultIndexByKey = useMemo(() => {
    const map = new Map<string, number>();
    flatResults.forEach((result, index) => map.set(result.key, index));
    return map;
  }, [flatResults]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActiveIndex(0);
    setCatalogueError(false);
    const id = window.setTimeout(() => inputRef.current?.focus(), 10);
    return () => window.clearTimeout(id);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, flatResults.length]);

  useEffect(() => {
    if (!open || !user.userId) return;

    const cached = getCachedOrganiserCommandCatalogue(user.userId);
    if (cached) {
      setCatalogue(cached);
      setCatalogueLoading(false);
      setCatalogueError(false);
      return;
    }

    let cancelled = false;
    setCatalogueLoading(true);
    setCatalogueError(false);

    void loadOrganiserCommandCatalogue(user.userId)
      .then((data) => {
        if (cancelled) return;
        setCatalogue(data);
      })
      .catch(() => {
        if (cancelled) return;
        setCatalogueError(true);
        setCatalogue(EMPTY_CATALOGUE);
      })
      .finally(() => {
        if (!cancelled) setCatalogueLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, user.userId]);

  const goTo = (href: string) => {
    onClose();
    router.push(welcomeAwareHref(pathname, href));
  };

  const goToResult = (result: FlatResult) => {
    if (result.type === "entity" && result.item.kind === "event") {
      onClose();
      router.push(welcomeAwareEventHref(pathname, result.item.id));
      return;
    }
    goTo(result.item.href);
  };

  const hasQuery = query.trim().length > 0;
  const showEntityLoading = hasQuery && catalogueLoading && entityGroups.length === 0 && !catalogueError;
  const noMatches = flatResults.length === 0 && !showEntityLoading;

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
                        setActiveIndex((i) => Math.min(i + 1, Math.max(flatResults.length - 1, 0)));
                      } else if (e.key === "ArrowUp") {
                        e.preventDefault();
                        setActiveIndex((i) => Math.max(i - 1, 0));
                      } else if (e.key === "Enter" && flatResults[activeIndex]) {
                        e.preventDefault();
                        goToResult(flatResults[activeIndex]);
                      }
                    }}
                    placeholder="Search events, forms, pages…"
                    className="h-11 w-full border-0 bg-transparent text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-0"
                    aria-label="Search organiser hub"
                    aria-autocomplete="list"
                    aria-controls="organiser-command-results"
                  />
                  <kbd className="hidden sm:inline-flex rounded-md border border-border bg-surface-muted px-1.5 py-0.5 text-xs font-medium text-foreground-muted">
                    esc
                  </kbd>
                </div>

                <div
                  id="organiser-command-results"
                  className="max-h-80 overflow-y-auto p-1.5"
                  role="listbox"
                >
                  {noMatches ? (
                    <p className="px-3 py-6 text-center text-sm text-foreground-muted">
                      {catalogueError && hasQuery
                        ? "Couldn’t load your catalogue. Try again."
                        : "No matches"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {pages.length > 0 && (
                        <ResultGroup label="Pages">
                          {pages.map((item) => {
                            const flatIndex = resultIndexByKey.get(`page:${item.href}`) ?? -1;
                            const active = flatIndex === activeIndex;
                            const Icon = item.icon;
                            return (
                              <ResultButton
                                key={item.href}
                                active={active}
                                onClick={() => goTo(item.href)}
                                onMouseEnter={() => {
                                  if (flatIndex >= 0) setActiveIndex(flatIndex);
                                }}
                                icon={Icon}
                                label={item.label}
                              />
                            );
                          })}
                        </ResultGroup>
                      )}

                      {entityGroups.map((group) => {
                        const Icon = group.icon;
                        return (
                          <ResultGroup key={group.key} label={group.label}>
                            {group.items.map((item) => {
                              const key = `${item.kind}:${item.id}`;
                              const flatIndex = resultIndexByKey.get(key) ?? -1;
                              const active = flatIndex === activeIndex;
                              return (
                                <ResultButton
                                  key={key}
                                  active={active}
                                  onClick={() =>
                                    goToResult({ type: "entity", key, item })
                                  }
                                  onMouseEnter={() => {
                                    if (flatIndex >= 0) setActiveIndex(flatIndex);
                                  }}
                                  icon={Icon}
                                  label={item.label}
                                  subtitle={item.subtitle}
                                />
                              );
                            })}
                          </ResultGroup>
                        );
                      })}

                      {showEntityLoading && (
                        <p className="px-2.5 py-2 text-xs text-foreground-muted">Loading your catalogue…</p>
                      )}
                    </div>
                  )}
                </div>
              </DialogPanel>
            </TransitionChild>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
}

function ResultGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <p className="px-2.5 pb-1 pt-1 text-xs font-medium text-foreground-muted">{label}</p>
      <ul className="space-y-0.5">{children}</ul>
    </div>
  );
}

function ResultButton({
  active,
  onClick,
  onMouseEnter,
  icon: Icon,
  label,
  subtitle,
}: {
  active: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  icon: typeof CalendarIcon;
  label: string;
  subtitle?: string;
}) {
  return (
    <li role="option" aria-selected={active}>
      <button
        type="button"
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors ${
          active
            ? "bg-surface-muted text-foreground"
            : "text-foreground-secondary hover:bg-surface-hover hover:text-foreground"
        }`}
      >
        <Icon className="h-4 w-4 shrink-0 stroke-[1.5]" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="block truncate font-medium">{label}</span>
          {subtitle ? (
            <span className="mt-0.5 block truncate text-xs font-normal text-foreground-muted">{subtitle}</span>
          ) : null}
        </span>
      </button>
    </li>
  );
}
