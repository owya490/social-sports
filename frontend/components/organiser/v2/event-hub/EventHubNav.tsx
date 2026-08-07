"use client";

import { EVENT_HUB_SECTIONS, EventHubSection } from "./eventHubTypes";

type EventHubNavProps = {
  current: EventHubSection;
  onChange: (section: EventHubSection) => void;
};

export function EventHubNav({ current, onChange }: EventHubNavProps) {
  return (
    <nav className="bg-background" aria-label="Event sections" data-tour="event-hub-nav">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          role="tablist"
          className="flex gap-1 overflow-x-auto overflow-y-hidden no-scrollbar border-t border-border"
        >
          {EVENT_HUB_SECTIONS.map((section) => {
            const active = section === current;
            return (
              <button
                key={section}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onChange(section)}
                className={`shrink-0 px-3 py-2.5 text-sm font-sans transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-focus border-b-2 ${
                  active
                    ? "border-foreground text-foreground font-semibold"
                    : "border-transparent text-foreground-secondary hover:text-foreground hover:border-border"
                }`}
              >
                {section}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
