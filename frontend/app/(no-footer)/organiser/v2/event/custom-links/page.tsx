"use client";

import { CustomLinksHeader } from "@/components/organiser/v2/custom-links/CustomLinksHeader";
import {
  CustomLinksPanel,
  CustomLinksPanelHandle,
} from "@/components/organiser/v2/custom-links/CustomLinksPanel";
import { useUser } from "@/components/utility/UserContext";
import { CustomEventLink } from "@/interfaces/CustomLinkTypes";
import { EventData, EventId } from "@/interfaces/EventTypes";
import { RecurrenceTemplate } from "@/interfaces/RecurringEventTypes";
import { Logger } from "@/observability/logger";
import { getAllOrganiserCustomEventLinks } from "@/services/src/events/customEventLinks/customEventLinksService";
import { getEventById } from "@/services/src/events/eventsService";
import { getRecurrenceTemplate } from "@/services/src/recurringEvents/recurringEventsService";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";

const logger = new Logger("OrganiserCustomLinksV2");

export default function OrganiserCustomLinksV2Page() {
  const { user } = useUser();
  const panelRef = useRef<CustomLinksPanelHandle>(null);
  const [activeEvents, setActiveEvents] = useState<EventData[]>([]);
  const [activeRecurringTemplates, setActiveRecurringTemplates] = useState<RecurrenceTemplate[]>([]);
  const [links, setLinks] = useState<Record<string, CustomEventLink>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const fetchData = async () => {
    if (!user.userId) {
      return;
    }
    setError(false);
    setLoading(true);
    try {
      const [events, templates, linkList] = await Promise.all([
        Promise.all(
          user.publicUpcomingOrganiserEvents.map(async (eventId: string) => await getEventById(eventId as EventId)),
        ),
        Promise.all(user.recurrenceTemplates.map(async (templateId) => await getRecurrenceTemplate(templateId))),
        getAllOrganiserCustomEventLinks(user.userId),
      ]);
      const filteredTemplates = templates.filter((template) => template.recurrenceData.recurrenceEnabled);

      setActiveEvents(events);
      setActiveRecurringTemplates(filteredTemplates);
      setLinks(Object.fromEntries(linkList.map((link) => [link.id, link])));
    } catch (fetchError) {
      logger.error(`Failed to load custom event links: ${fetchError}`);
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, [user]);

  return (
    <>
      {/* THESIS: Manage vanity event URLs as tappable cards—click opens a side panel, not inline edit.
          OWN-WORLD: Honest Clubhouse tokens—outlined list rows, Event Hub drawer grammar, accent Save.
          STORY: See what each short URL opens; edit name, slug, and destination in one panel; copy in one tap.
          FIRST VIEWPORT: Title + add CTA, format hint, stack of clickable link cards with “Opens …” destination.
          FORM: Established v2 operate extension; panel editor replaces inline form.
          FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md */}
      <div className="min-h-screen bg-surface text-foreground pb-2">
        <CustomLinksHeader
          linkCount={Object.keys(links).length}
          loading={loading}
          username={user.username}
          onAdd={() => panelRef.current?.addLink()}
        />

        {error ? (
          <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto mt-6">
            <div className="rounded-xl border border-border bg-background p-6 text-center">
              <p className="text-sm font-semibold text-foreground font-sans">Could not load custom links</p>
              <p className="mt-1 text-xs text-foreground-muted font-sans">
                Check your connection and try again.
              </p>
              <button
                type="button"
                onClick={() => {
                  void fetchData();
                }}
                className="mt-4 inline-flex items-center justify-center rounded-xl bg-accent px-4 py-2 text-sm font-semibold text-accent-contrast font-sans hover:brightness-95 transition-[filter] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
              >
                Retry
              </button>
            </div>
          </div>
        ) : loading ? (
          <div className="px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-10">
            <Skeleton height={14} width="55%" className="mb-4" />
            <div className="rounded-xl border border-border bg-background overflow-hidden divide-y divide-border">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="p-3 sm:p-4 space-y-2">
                  <div className="flex justify-between gap-3">
                    <Skeleton height={14} width="40%" />
                    <Skeleton height={18} width={64} />
                  </div>
                  <Skeleton height={12} width="70%" />
                  <Skeleton height={12} width="45%" />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <CustomLinksPanel
            ref={panelRef}
            user={user}
            activeEvents={activeEvents}
            activeRecurringTemplates={activeRecurringTemplates}
            links={links}
            setLinks={setLinks}
          />
        )}
      </div>
    </>
  );
}
