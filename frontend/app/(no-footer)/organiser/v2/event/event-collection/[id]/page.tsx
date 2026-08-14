"use client";

/**
 * THESIS: Collection hub is a container for sessions — Details leads with 16:9 cover + membership peek, not a session twin; Events owns membership; deep work opens drawers.
 * OWN-WORLD: Honest Clubhouse — surface canvas, Satoshi, 12px radius, yellow only on primary panel CTAs (Save / Add) and the Private switch when on.
 * STORY: Organiser lands on Details (cover, collection brief, In this collection peek, share, Visibility with lock/globe + toggle), jumps to Events to manage; Settings is delete-only.
 * FIRST VIEWPORT: Quiet header + peer tabs; Details equal two-column 16:9 cover | Collection brief; In this collection sneak peek; Visibility owns Private toggle with icons.
 * FORM: Membership-led overview + peek (extends Comp A/B); privacy on Details Visibility; Change photo in EventHubPanel.
 * FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, and DESIGN.md
 */

import { CollectionHubHeader } from "@/components/organiser/v2/collection-hub/CollectionHubHeader";
import { CollectionHubDetails } from "@/components/organiser/v2/collection-hub/CollectionHubDetails";
import { CollectionHubEvents } from "@/components/organiser/v2/collection-hub/CollectionHubEvents";
import { CollectionHubNav } from "@/components/organiser/v2/collection-hub/CollectionHubNav";
import { CollectionHubSettings } from "@/components/organiser/v2/collection-hub/CollectionHubSettings";
import { CollectionHubSection } from "@/components/organiser/v2/collection-hub/collectionHubTypes";
import { useUser } from "@/components/utility/UserContext";
import { EMPTY_EVENT_COLLECTION, EventCollection, EventCollectionId } from "@/interfaces/EventCollectionTypes";
import { EventData, EventId } from "@/interfaces/EventTypes";
import { RecurrenceTemplate, RecurrenceTemplateId } from "@/interfaces/RecurringEventTypes";
import { Logger } from "@/observability/logger";
import {
  deleteEventCollection,
  getEventCollectionById,
  removeEventFromCollection,
  removeRecurringTemplateFromCollection,
  updateEventCollection,
  updateEventCollectionAccessModifier,
} from "@/services/src/eventCollections/eventCollectionsService";
import { getEventById } from "@/services/src/events/eventsService";
import { getOrganiserEvents } from "@/services/src/organiser/organiserEventsService";
import {
  getOrganiserRecurrenceTemplates,
  getRecurrenceTemplate,
} from "@/services/src/recurringEvents/recurringEventsService";
import { getErrorUrl } from "@/services/src/urlUtils";
import { executeResilientPromises } from "@/utilities/promiseUtils";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";

const logger = new Logger("OrganiserCollectionHubV2");

export default function OrganiserCollectionHubV2Page() {
  const params = useParams<{ id: string }>();
  const collectionId = params.id as EventCollectionId;
  const { user } = useUser();
  const router = useRouter();

  const [section, setSection] = useState<CollectionHubSection>("Details");
  const [sectionReady, setSectionReady] = useState(true);
  const [loading, setLoading] = useState(true);
  const [collection, setCollection] = useState<EventCollection>(EMPTY_EVENT_COLLECTION);
  const [events, setEvents] = useState<EventData[]>([]);
  const [templates, setTemplates] = useState<RecurrenceTemplate[]>([]);

  const [addOpen, setAddOpen] = useState(false);
  const [addFilter, setAddFilter] = useState<"events" | "recurring">("events");
  const [loadingCatalogue, setLoadingCatalogue] = useState(false);
  const [savingAdd, setSavingAdd] = useState(false);
  const [allOrganiserEvents, setAllOrganiserEvents] = useState<EventData[]>([]);
  const [allOrganiserTemplates, setAllOrganiserTemplates] = useState<RecurrenceTemplate[]>([]);
  const [selectedEventIds, setSelectedEventIds] = useState<Set<EventId>>(new Set());
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<RecurrenceTemplateId>>(new Set());

  const [privacyUpdating, setPrivacyUpdating] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const itemCount = collection.eventIds.length + collection.recurringEventTemplateIds.length;

  const handleSectionChange = useCallback((next: CollectionHubSection) => {
    if (next === section) return;
    setSectionReady(false);
    window.setTimeout(() => {
      setSection(next);
      setSectionReady(true);
    }, 120);
  }, [section]);

  useEffect(() => {
    if (!user.userId) return;
    let active = true;

    const fetchData = async () => {
      try {
        const nextCollection = await getEventCollectionById(collectionId);
        if (!active) return;

        if (nextCollection.organiserId && nextCollection.organiserId !== user.userId) {
          router.push("/organiser/v2/event/event-collection");
          return;
        }

        setCollection(nextCollection);

        const eventPromises = nextCollection.eventIds.map((eventId: EventId) => getEventById(eventId));
        const { successful: loadedEvents } = await executeResilientPromises(
          eventPromises,
          nextCollection.eventIds,
          logger
        );

        const templatePromises = nextCollection.recurringEventTemplateIds.map((templateId: RecurrenceTemplateId) =>
          getRecurrenceTemplate(templateId)
        );
        const { successful: loadedTemplates } = await executeResilientPromises(
          templatePromises,
          nextCollection.recurringEventTemplateIds,
          logger
        );

        if (!active) return;

        loadedEvents.sort((a, b) => b.startDate.toDate().getTime() - a.startDate.toDate().getTime());
        loadedTemplates.sort(
          (a, b) => b.eventData.startDate.toMillis() - a.eventData.startDate.toMillis()
        );

        setEvents(loadedEvents);
        setTemplates(loadedTemplates);
        setLoading(false);
      } catch (error) {
        logger.error(`Failed to load collection hub: ${error}`);
        router.push(getErrorUrl(error));
      }
    };

    void fetchData();
    return () => {
      active = false;
    };
  }, [collectionId, router, user.userId]);

  const persistCollection = async (data: Partial<EventCollection>) => {
    await updateEventCollection(collectionId, collection.isPrivate, data);
    setCollection((prev) => ({ ...prev, ...data }));
  };

  const handleOpenAdd = async (filter: "events" | "recurring") => {
    setAddFilter(filter);
    setSelectedEventIds(new Set(collection.eventIds));
    setSelectedTemplateIds(new Set(collection.recurringEventTemplateIds));
    setAddOpen(true);
    setLoadingCatalogue(true);
    try {
      const [organiserEvents, organiserTemplates] = await Promise.all([
        getOrganiserEvents(user.userId),
        getOrganiserRecurrenceTemplates(user.userId),
      ]);
      organiserEvents.sort((a, b) => b.startDate.toDate().getTime() - a.startDate.toDate().getTime());
      organiserTemplates.sort(
        (a, b) => b.eventData.startDate.toMillis() - a.eventData.startDate.toMillis()
      );
      setAllOrganiserEvents(organiserEvents);
      setAllOrganiserTemplates(organiserTemplates);
    } catch (error) {
      logger.error(`Failed to load organiser catalogue: ${error}`);
    } finally {
      setLoadingCatalogue(false);
    }
  };

  const handleSaveMembership = async (eventIds: EventId[], templateIds: RecurrenceTemplateId[]) => {
    setSavingAdd(true);
    try {
      await updateEventCollection(collectionId, collection.isPrivate, {
        eventIds,
        recurringEventTemplateIds: templateIds,
      });

      const updatedEvents = allOrganiserEvents.filter((event) => eventIds.includes(event.eventId));
      const updatedTemplates = allOrganiserTemplates.filter((template) =>
        templateIds.includes(template.recurrenceTemplateId)
      );
      updatedEvents.sort((a, b) => b.startDate.toDate().getTime() - a.startDate.toDate().getTime());
      updatedTemplates.sort(
        (a, b) => b.eventData.startDate.toMillis() - a.eventData.startDate.toMillis()
      );

      setEvents(updatedEvents);
      setTemplates(updatedTemplates);
      setCollection((prev) => ({
        ...prev,
        eventIds,
        recurringEventTemplateIds: templateIds,
      }));
      setAddOpen(false);
    } catch (error) {
      logger.error(`Failed to save membership: ${error}`);
      router.push(getErrorUrl(error));
    } finally {
      setSavingAdd(false);
    }
  };

  const header = useMemo(
    () => (
      <div className="bg-background border-b border-border">
        <CollectionHubHeader
          loading={loading}
          collectionId={collectionId}
          name={collection.name}
          itemCount={itemCount}
          isPrivate={collection.isPrivate}
        />
        <CollectionHubNav current={section} onChange={handleSectionChange} />
      </div>
    ),
    [loading, collectionId, collection.name, collection.isPrivate, itemCount, section, handleSectionChange]
  );

  return (
    <div className="min-h-screen bg-surface text-foreground pb-10">
      {header}

      <div
        className={`px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pt-6 sm:pt-8 transition-opacity duration-200 ease-out ${
          sectionReady ? "opacity-100" : "opacity-0"
        }`}
      >
        {section === "Details" && (
          <CollectionHubDetails
            loading={loading}
            collectionId={collectionId}
            name={collection.name}
            description={collection.description}
            image={collection.image}
            itemCount={itemCount}
            eventCount={collection.eventIds.length}
            templateCount={collection.recurringEventTemplateIds.length}
            isPrivate={collection.isPrivate}
            privacyUpdating={privacyUpdating}
            events={events}
            templates={templates}
            onSaveDetails={async ({ name, description }) => {
              await persistCollection({ name, description });
            }}
            onSaveImage={async (image) => {
              await persistCollection({ image });
            }}
            onTogglePrivacy={async (nextPrivate) => {
              if (nextPrivate === collection.isPrivate) return;
              setPrivacyUpdating(true);
              try {
                await updateEventCollectionAccessModifier(collectionId, user.userId, nextPrivate);
                setCollection((prev) => ({ ...prev, isPrivate: nextPrivate }));
              } catch (error) {
                logger.error(`Failed to toggle privacy: ${error}`);
                router.push(getErrorUrl(error));
              } finally {
                setPrivacyUpdating(false);
              }
            }}
            onOpenEvents={() => handleSectionChange("Events")}
          />
        )}

        {section === "Events" && (
          <CollectionHubEvents
            loading={loading}
            events={events}
            templates={templates}
            allOrganiserEvents={allOrganiserEvents}
            allOrganiserTemplates={allOrganiserTemplates}
            loadingCatalogue={loadingCatalogue}
            onOpenAdd={handleOpenAdd}
            onSaveMembership={handleSaveMembership}
            onRemoveEvent={async (eventId) => {
              try {
                await removeEventFromCollection(collectionId, eventId, collection.isPrivate);
                setEvents((prev) => prev.filter((event) => event.eventId !== eventId));
                setCollection((prev) => ({
                  ...prev,
                  eventIds: prev.eventIds.filter((id) => id !== eventId),
                }));
              } catch (error) {
                logger.error(`Failed to remove event: ${error}`);
                router.push(getErrorUrl(error));
              }
            }}
            onRemoveTemplate={async (templateId) => {
              try {
                await removeRecurringTemplateFromCollection(collectionId, templateId, collection.isPrivate);
                setTemplates((prev) => prev.filter((template) => template.recurrenceTemplateId !== templateId));
                setCollection((prev) => ({
                  ...prev,
                  recurringEventTemplateIds: prev.recurringEventTemplateIds.filter((id) => id !== templateId),
                }));
              } catch (error) {
                logger.error(`Failed to remove recurring template: ${error}`);
                router.push(getErrorUrl(error));
              }
            }}
            selectedEventIds={selectedEventIds}
            selectedTemplateIds={selectedTemplateIds}
            onToggleEvent={(eventId) => {
              setSelectedEventIds((prev) => {
                const next = new Set(prev);
                if (next.has(eventId)) next.delete(eventId);
                else next.add(eventId);
                return next;
              });
            }}
            onToggleTemplate={(templateId) => {
              setSelectedTemplateIds((prev) => {
                const next = new Set(prev);
                if (next.has(templateId)) next.delete(templateId);
                else next.add(templateId);
                return next;
              });
            }}
            addOpen={addOpen}
            onCloseAdd={() => setAddOpen(false)}
            addFilter={addFilter}
            savingAdd={savingAdd}
          />
        )}

        {section === "Settings" && (
          <CollectionHubSettings
            name={collection.name}
            deleteLoading={deleteLoading}
            onDelete={async () => {
              setDeleteLoading(true);
              try {
                await deleteEventCollection(collectionId, user.userId, collection.isPrivate);
                router.push("/organiser/v2/event/event-collection");
              } catch (error) {
                logger.error(`Failed to delete collection: ${error}`);
                router.push(getErrorUrl(error));
              } finally {
                setDeleteLoading(false);
              }
            }}
          />
        )}
      </div>
    </div>
  );
}
