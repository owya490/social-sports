export interface JiraConfig {
    jiraBaseUrl: string;
    email: string;
    apiToken: string;
    defaultProjectKey: string;
    openRouterApiToken: string;
}
export interface ConfigFile {
    jiraBaseUrl?: string;
    email?: string;
    apiToken?: string;
    defaultProjectKey?: string;
    openRouterApiToken?: string;
}
export type LeadStatus = "OPPORTUNITY" | "CONTACTED" | "MEETING SCHEDULED" | "ONBOARDING" | "ONBOARDED" | "LOST";
export declare const LEAD_STATUS_ORDER: LeadStatus[];
export declare const ALL_LEAD_STATUSES: LeadStatus[];
//# sourceMappingURL=config.d.ts.map