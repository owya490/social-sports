import { JiraConfig, LeadStatus } from "../types/config";
export interface JiraIssue {
    id: string;
    key: string;
    self: string;
}
export interface CreateIssueRequest {
    summary: string;
    description: string;
    projectKey: string;
    issueType?: string;
}
export interface CreateIssueResponse {
    id: string;
    key: string;
    self: string;
}
export interface SearchRequest {
    organiserName: string;
    projectKey: string;
}
export interface JiraSearchResult {
    key: string;
    summary: string;
    description?: string;
}
export interface SearchIssuesResponse {
    issues: JiraSearchResult[];
    total: number;
}
export interface LeadWithStatus {
    key: string;
    summary: string;
    status: string;
    statusCategory: string;
}
export interface GetAllLeadsResponse {
    leads: LeadWithStatus[];
    total: number;
}
export interface IssueDetails extends JiraSearchResult {
    status: string;
    statusCategory: string;
}
export interface GetIssueResponse {
    key: string;
    summary: string;
    description?: string;
    status: string;
    statusCategory: string;
}
export interface UpdateStatusRequest {
    issueKey: string;
    status: LeadStatus;
}
export interface UpdateStatusResponse {
    success: boolean;
    message?: string;
}
export interface AddCommentRequest {
    issueKey: string;
    comment: string;
}
export interface AddCommentResponse {
    success: boolean;
    message?: string;
}
export declare class JiraService {
    private config;
    private baseUrl;
    private authHeader;
    constructor(config: JiraConfig);
    /**
     * Creates a new Jira issue
     */
    createIssue(request: CreateIssueRequest): Promise<CreateIssueResponse>;
    /**
     * Gets the URL for viewing a Jira issue
     */
    getIssueUrl(issueKey: string): string;
    /**
     * Searches for issues by organiser name
     */
    searchIssues(request: SearchRequest): Promise<SearchIssuesResponse>;
    /**
     * Gets all lead tickets from the project
     */
    getAllLeads(projectKey: string): Promise<GetAllLeadsResponse>;
    /**
     * Gets detailed information about a specific issue
     */
    getIssue(issueKey: string): Promise<GetIssueResponse>;
    /**
     * Updates the status of an issue
     */
    updateIssueStatus(request: UpdateStatusRequest): Promise<UpdateStatusResponse>;
    /**
     * Adds a comment to an issue
     */
    addComment(request: AddCommentRequest): Promise<AddCommentResponse>;
    /**
     * Tests the connection to Jira
     */
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=jira.d.ts.map