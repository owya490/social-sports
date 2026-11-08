import { bustOrganiserCommandCatalogueCache } from "@/components/organiser/organiserCommandCatalogue";
import { flushOrganiserHubCache } from "./organiserHubCache";

export function bustOrganiserHubCache(): void {
  flushOrganiserHubCache();
  bustOrganiserCommandCatalogueCache();
}
