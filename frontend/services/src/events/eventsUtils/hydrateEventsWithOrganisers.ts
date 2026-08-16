import {
  EmptyEventData,
  EventData,
  EventDataWithoutOrganiser,
} from "@/interfaces/EventTypes";
import { PublicUserData, UserId } from "@/interfaces/UserTypes";
import { applyGeneralAdmissionInventoryFields } from "./eventTicketTypesUtils";

export async function hydrateEventsWithOrganisers(
  eventsWithoutOrganiser: EventDataWithoutOrganiser[],
  fetchOrganiser: (organiserId: UserId) => Promise<PublicUserData>
): Promise<EventData[]> {
  const uniqueOrganiserIds = [
    ...new Set(eventsWithoutOrganiser.map((event) => event.organiserId).filter((organiserId) => Boolean(organiserId))),
  ];
  const organiserEntries = await Promise.all(
    uniqueOrganiserIds.map(async (organiserId) => {
      try {
        const organiser = await fetchOrganiser(organiserId);
        return [organiserId, organiser] as const;
      } catch {
        return [organiserId, null] as const;
      }
    })
  );
  const organiserById = new Map(organiserEntries);

  const eventsData: EventData[] = [];
  for (const event of eventsWithoutOrganiser) {
    const organiser = organiserById.get(event.organiserId);
    if (!organiser) {
      continue;
    }
    eventsData.push(
      applyGeneralAdmissionInventoryFields({
        ...EmptyEventData,
        ...event,
        organiser,
      })
    );
  }
  return eventsData;
}
