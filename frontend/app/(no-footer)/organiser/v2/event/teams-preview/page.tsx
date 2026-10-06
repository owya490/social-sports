"use client";

import { useOrganiserBreadcrumbTitle } from "@/components/organiser/OrganiserBreadcrumbContext";
import { OrganiserBreadcrumbs } from "@/components/organiser/OrganiserBreadcrumbs";
import { EventHubNav } from "@/components/organiser/v2/event-hub/EventHubNav";
import { EventHubEmpty } from "@/components/organiser/v2/event-hub/EventHubStage";
import { EventHubTeams } from "@/components/organiser/v2/event-hub/EventHubTeams";
import { EventHubSection } from "@/components/organiser/v2/event-hub/eventHubTypes";
import { createTeamsPreview } from "@/components/organiser/v2/event-hub/teamBoardPreview";
import { useMemo, useState } from "react";

export default function TeamsPreviewPage() {
  const preview = useMemo(() => createTeamsPreview(), []);
  const [section, setSection] = useState<EventHubSection>("Teams");
  const [sectionReady, setSectionReady] = useState(true);
  useOrganiserBreadcrumbTitle(preview.eventName);

  const handleSectionChange = (next: EventHubSection) => {
    if (next === section) return;
    setSectionReady(false);
    window.setTimeout(() => {
      setSection(next);
      setSectionReady(true);
    }, 120);
  };

  return (
    <div className="min-h-screen bg-surface pb-8 text-foreground">
      <div className="border-b border-border bg-background">
        <header className="mx-auto max-w-6xl px-4 pb-3 pt-5 sm:px-6 sm:pt-7 lg:px-8">
          <OrganiserBreadcrumbs />
          <h1 className="font-sans text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
            {preview.eventName}
          </h1>
          <p className="mt-1.5 text-xs font-sans text-foreground-muted">
            Tue 29 Sep · Sample signups so you can try the Teams tab
          </p>
        </header>
        <EventHubNav current={section} onChange={handleSectionChange} disabled={false} />
      </div>

      <div
        className={`mx-auto max-w-6xl px-4 pt-6 transition-opacity duration-200 ease-out sm:px-6 sm:pt-8 lg:px-8 ${
          sectionReady ? "opacity-100" : "opacity-0"
        }`}
      >
        {section === "Teams" ? (
          <EventHubTeams
            orderTicketsMap={preview.orderTicketsMap}
            eventName={preview.eventName}
            initialBoard={preview.initialBoard}
          />
        ) : (
          <EventHubEmpty>This preview is the Teams tab. Open an event to use the other sections.</EventHubEmpty>
        )}
      </div>
    </div>
  );
}
