import { getAllOrganiserCustomEventLinks } from "@/services/src/events/customEventLinks/customEventLinksService";
import { getOrganiserEvents } from "@/services/src/events/eventsService";
import { getOrganiserCollections } from "@/services/src/eventCollections/eventCollectionsService";
import { getFormsForUser } from "@/services/src/forms/formsServices";
import { getOrganiserRecurrenceTemplates } from "@/services/src/recurringEvents/recurringEventsService";
import type { UserId } from "@/interfaces/UserTypes";

export type OrganiserCommandEntityKind =
  | "event"
  | "recurring"
  | "collection"
  | "custom-link"
  | "form";

export type OrganiserCommandEntity = {
  id: string;
  kind: OrganiserCommandEntityKind;
  label: string;
  subtitle?: string;
  href: string;
  keywords?: string[];
};

export type OrganiserCommandCatalogue = {
  events: OrganiserCommandEntity[];
  recurring: OrganiserCommandEntity[];
  collections: OrganiserCommandEntity[];
  customLinks: OrganiserCommandEntity[];
  forms: OrganiserCommandEntity[];
};

const CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_RESULTS_PER_GROUP = 8;

type CacheEntry = {
  userId: string;
  fetchedAt: number;
  catalogue: OrganiserCommandCatalogue;
};

let cache: CacheEntry | null = null;
let inflight: Promise<OrganiserCommandCatalogue> | null = null;
let inflightUserId: string | null = null;

function matchesHaystack(haystack: string, query: string): boolean {
  return haystack.toLowerCase().includes(query);
}

export function entityMatchesQuery(entity: OrganiserCommandEntity, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (matchesHaystack(entity.label, q)) return true;
  if (entity.subtitle && matchesHaystack(entity.subtitle, q)) return true;
  return (entity.keywords ?? []).some((keyword) => matchesHaystack(keyword, q));
}

export function takeMatchingEntities(
  entities: OrganiserCommandEntity[],
  query: string,
  limit = MAX_RESULTS_PER_GROUP
): OrganiserCommandEntity[] {
  const matched: OrganiserCommandEntity[] = [];
  for (const entity of entities) {
    if (!entityMatchesQuery(entity, query)) continue;
    matched.push(entity);
    if (matched.length >= limit) break;
  }
  return matched;
}

function buildCatalogue(
  events: Awaited<ReturnType<typeof getOrganiserEvents>>,
  templates: Awaited<ReturnType<typeof getOrganiserRecurrenceTemplates>>,
  collections: Awaited<ReturnType<typeof getOrganiserCollections>>,
  links: Awaited<ReturnType<typeof getAllOrganiserCustomEventLinks>>,
  forms: Awaited<ReturnType<typeof getFormsForUser>>
): OrganiserCommandCatalogue {
  return {
    events: events
      .map((event) => ({
        id: event.eventId,
        kind: "event" as const,
        label: event.name?.trim() || "Untitled event",
        subtitle: [event.sport, event.location].filter(Boolean).join(" · ") || undefined,
        href: `/organiser/v2/event/${event.eventId}`,
        keywords: [event.sport, event.location, event.eventLink].filter(Boolean) as string[],
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    recurring: templates
      .map((template) => {
        const name = template.eventData?.name?.trim() || "Untitled series";
        const sport = template.eventData?.sport;
        const location = template.eventData?.location;
        return {
          id: template.recurrenceTemplateId,
          kind: "recurring" as const,
          label: name,
          subtitle: [sport, location].filter(Boolean).join(" · ") || undefined,
          href: `/organiser/v2/event/recurring-events/${template.recurrenceTemplateId}`,
          keywords: [sport, location].filter(Boolean) as string[],
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label)),
    collections: collections
      .filter((collection) => collection.eventCollectionId)
      .map((collection) => ({
        id: collection.eventCollectionId as string,
        kind: "collection" as const,
        label: collection.name?.trim() || "Untitled collection",
        subtitle: collection.isPrivate ? "Private" : "Public",
        href: `/organiser/v2/event/event-collection/${collection.eventCollectionId}`,
        keywords: [collection.description].filter(Boolean) as string[],
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    customLinks: links
      .map((link) => ({
        id: link.id,
        kind: "custom-link" as const,
        label: link.customEventLinkName?.trim() || link.customEventLink || "Untitled link",
        subtitle: link.referenceName?.trim()
          ? `Opens ${link.referenceName.trim()}`
          : `/${link.customEventLink}`,
        href: "/organiser/v2/event/custom-links",
        keywords: [link.customEventLink, link.referenceName ?? ""].filter(Boolean),
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
    forms: forms
      .map((form) => ({
        id: form.formId,
        kind: "form" as const,
        label: (form.title as string)?.trim() || "Untitled form",
        subtitle: form.formActive ? "Active" : "Inactive",
        href: `/organiser/forms/${form.formId}/editor?returnTo=/organiser/v2/forms/gallery`,
        keywords: [(form.description as string) ?? ""].filter(Boolean),
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  };
}

export function getCachedOrganiserCommandCatalogue(userId: string): OrganiserCommandCatalogue | null {
  if (!cache || cache.userId !== userId) return null;
  if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) return null;
  return cache.catalogue;
}

export function bustOrganiserCommandCatalogueCache(userId?: string) {
  if (!userId || cache?.userId === userId) {
    cache = null;
  }
}

export async function loadOrganiserCommandCatalogue(userId: UserId): Promise<OrganiserCommandCatalogue> {
  if (!userId) {
    return { events: [], recurring: [], collections: [], customLinks: [], forms: [] };
  }

  const cached = getCachedOrganiserCommandCatalogue(userId);
  if (cached) return cached;

  if (inflight && inflightUserId === userId) {
    return inflight;
  }

  inflightUserId = userId;
  inflight = (async () => {
    const [events, templates, collections, links, forms] = await Promise.all([
      getOrganiserEvents(userId),
      getOrganiserRecurrenceTemplates(userId),
      getOrganiserCollections(userId),
      getAllOrganiserCustomEventLinks(userId),
      getFormsForUser(userId),
    ]);

    const catalogue = buildCatalogue(events, templates, collections, links, forms);
    cache = { userId, fetchedAt: Date.now(), catalogue };
    return catalogue;
  })();

  try {
    return await inflight;
  } finally {
    inflight = null;
    inflightUserId = null;
  }
}
