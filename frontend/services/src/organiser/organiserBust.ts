import { bustOrganiserCommandCatalogueCache } from "@/components/organiser/organiserCommandCatalogue";
import { bustOrganiserDashboardMetricsCache } from "./organiserDashboardMetricsService";
import { flushOrganiserHubCache } from "./organiserHubCache";

export function bustOrganiserHubCache(): void {
  flushOrganiserHubCache();
  bustOrganiserDashboardMetricsCache();
  bustOrganiserCommandCatalogueCache();
}
