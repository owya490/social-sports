export interface JiraConfig {
  jiraBaseUrl: string;
  email: string;
  apiToken: string;
  defaultProjectKey: string;
}

export interface ConfigFile {
  jiraBaseUrl?: string;
  email?: string;
  apiToken?: string;
  defaultProjectKey?: string;
}

export type LeadStatus = "OPPORTUNITY" | "CONTACTED" | "MEETING SCHEDULED" | "ONBOARDING" | "ONBOARDED" | "LOST";

export const LEAD_STATUS_ORDER: LeadStatus[] = [
  "OPPORTUNITY",
  "CONTACTED",
  "MEETING SCHEDULED",
  "ONBOARDING",
  "ONBOARDED",
];

export const ALL_LEAD_STATUSES: LeadStatus[] = [...LEAD_STATUS_ORDER, "LOST"];
