"use client";

import { useOrganiserBreadcrumbTitle } from "@/components/organiser/OrganiserBreadcrumbContext";
import { OrganiserBreadcrumbs } from "@/components/organiser/OrganiserBreadcrumbs";
import { EventHubEmpty, EventHubFilters } from "@/components/organiser/v2/event-hub/EventHubStage";
import { EventHubTeams } from "@/components/organiser/v2/event-hub/EventHubTeams";
import { createTeamsPreview } from "@/components/organiser/v2/event-hub/teamBoardPreview";
import { useMemo, useState } from "react";

const PREVIEW_TABS = [
  { id: "approved", label: "Approved" },
  { id: "pending", label: "Pending" },
  { id: "declined", label: "Declined" },
  { id: "teams", label: "Teams" },
];

export default function TeamsPreviewPage() {
  const preview = useMemo(() => createTeamsPreview(), []);
  const [tab, setTab] = useState("teams");
  useOrganiserBreadcrumbTitle(preview.eventName);

  return (
    <div className="min-h-screen bg-surface pb-8 text-foreground">
      <div className="border-b border-border bg-background">
        <header className="mx-auto max-w-6xl px-4 pb-5 pt-5 sm:px-6 sm:pt-7 lg:px-8">
          <OrganiserBreadcrumbs />
          <h1 className="font-sans text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
            {preview.eventName}
          </h1>
          <p className="mt-1.5 text-xs font-sans text-foreground-muted">
            Tue 29 Sep · Sample signups for the Teams tab inside Registrations
          </p>
        </header>
      </div>

      <div className="mx-auto max-w-6xl px-4 pt-6 sm:px-6 sm:pt-8 lg:px-8">
        <EventHubFilters activeId={tab} onChange={setTab} tabs={PREVIEW_TABS} />
        <div className="pt-4">
          {tab === "teams" ? (
            <EventHubTeams
              orderTicketsMap={preview.orderTicketsMap}
              eventName={preview.eventName}
              initialBoard={preview.initialBoard}
            />
          ) : (
            <EventHubEmpty>This preview only includes the Teams tab. Open an event to manage registrations.</EventHubEmpty>
          )}
        </div>
      </div>
    </div>
  );
}
