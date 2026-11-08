"use client";

import { organiserHub, type OrganiserHubCache } from "@/services/src/organiser/organiserHubCache";

export type UseEventsForOrganiserHubResult = OrganiserHubCache;

export function useEventsForOrganiserHub(): OrganiserHubCache {
  return organiserHub;
}
