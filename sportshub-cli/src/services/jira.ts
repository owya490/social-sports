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

export class JiraService {
  private config: JiraConfig;
  private baseUrl: string;
  private authHeader: string;

  constructor(config: JiraConfig) {
    this.config = config;
    this.baseUrl = `${config.jiraBaseUrl}/rest/api/3`;
    this.authHeader = `Basic ${Buffer.from(`${config.email}:${config.apiToken}`).toString("base64")}`;
  }

  /**
   * Creates a new Jira issue
   */
  async createIssue(request: CreateIssueRequest): Promise<CreateIssueResponse> {
    const axios = require("axios");

    const payload = {
      fields: {
        project: {
          key: request.projectKey,
        },
        summary: request.summary,
        description: {
          type: "doc",
          version: 1,
          content: [
            {
              type: "paragraph",
              content: [
                {
                  type: "text",
                  text: request.description,
                },
              ],
            },
          ],
        },
        issuetype: {
          name: request.issueType || "Task",
        },
      },
    };

    try {
      const response = await axios.post(`${this.baseUrl}/issue`, payload, {
        headers: {
          Authorization: this.authHeader,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      return response.data as CreateIssueResponse;
    } catch (error: any) {
      let errorMessage = `${error.response?.status || "Unknown"} ${error.response?.statusText || "Error"}`;

      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.errorMessages && errorData.errorMessages.length > 0) {
          errorMessage += ` - ${errorData.errorMessages.join(", ")}`;
        } else if (errorData.errors) {
          const errors = Object.values(errorData.errors).join(", ");
          errorMessage += ` - ${errors}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Gets the URL for viewing a Jira issue
   */
  getIssueUrl(issueKey: string): string {
    return `${this.config.jiraBaseUrl}/browse/${issueKey}`;
  }

  /**
   * Searches for issues by organiser name
   */
  async searchIssues(request: SearchRequest): Promise<SearchIssuesResponse> {
    const axios = require("axios");

    // Create JQL query to search for issues containing the organiser name
    const jql = `project = "${request.projectKey}" AND (summary ~ "${request.organiserName}" OR description ~ "${request.organiserName}") ORDER BY created DESC`;

    try {
      const response = await axios.post(
        `${this.baseUrl}/search`,
        {
          jql: jql,
          maxResults: 50,
          fields: ["key", "summary", "description"],
        },
        {
          headers: {
            Authorization: this.authHeader,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      const issues: JiraSearchResult[] = response.data.issues.map((issue: any) => ({
        key: issue.key,
        summary: issue.fields.summary,
        description: issue.fields.description?.content?.[0]?.content?.[0]?.text || issue.fields.description || "",
      }));

      return {
        issues,
        total: response.data.total,
      };
    } catch (error: any) {
      let errorMessage = `${error.response?.status || "Unknown"} ${error.response?.statusText || "Error"}`;

      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.errorMessages && errorData.errorMessages.length > 0) {
          errorMessage += ` - ${errorData.errorMessages.join(", ")}`;
        } else if (errorData.errors) {
          const errors = Object.values(errorData.errors).join(", ");
          errorMessage += ` - ${errors}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Gets all lead tickets from the project
   */
  async getAllLeads(projectKey: string): Promise<GetAllLeadsResponse> {
    const axios = require("axios");

    // Create JQL query to search for all lead tickets (assuming they contain "Lead" in summary)
    const jql = `project = "${projectKey}" ORDER BY status ASC, created DESC`;

    try {
      const response = await axios.post(
        `${this.baseUrl}/search`,
        {
          jql: jql,
          maxResults: 100,
          fields: ["key", "summary", "status"],
        },
        {
          headers: {
            Authorization: this.authHeader,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      const leads: LeadWithStatus[] = response.data.issues.map((issue: any) => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status.name,
        statusCategory: issue.fields.status.statusCategory.name,
      }));

      return {
        leads,
        total: response.data.total,
      };
    } catch (error: any) {
      let errorMessage = `${error.response?.status || "Unknown"} ${error.response?.statusText || "Error"}`;

      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.errorMessages && errorData.errorMessages.length > 0) {
          errorMessage += ` - ${errorData.errorMessages.join(", ")}`;
        } else if (errorData.errors) {
          const errors = Object.values(errorData.errors).join(", ");
          errorMessage += ` - ${errors}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Gets detailed information about a specific issue
   */
  async getIssue(issueKey: string): Promise<GetIssueResponse> {
    const axios = require("axios");

    try {
      const response = await axios.get(`${this.baseUrl}/issue/${issueKey}`, {
        headers: {
          Authorization: this.authHeader,
          Accept: "application/json",
        },
        params: {
          fields: "key,summary,description,status",
        },
      });

      const issue = response.data;
      return {
        key: issue.key,
        summary: issue.fields.summary,
        description: issue.fields.description?.content?.[0]?.content?.[0]?.text || issue.fields.description || "",
        status: issue.fields.status.name,
        statusCategory: issue.fields.status.statusCategory.name,
      };
    } catch (error: any) {
      let errorMessage = `${error.response?.status || "Unknown"} ${error.response?.statusText || "Error"}`;

      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.errorMessages && errorData.errorMessages.length > 0) {
          errorMessage += ` - ${errorData.errorMessages.join(", ")}`;
        } else if (errorData.errors) {
          const errors = Object.values(errorData.errors).join(", ");
          errorMessage += ` - ${errors}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      throw new Error(errorMessage);
    }
  }

  /**
   * Updates the status of an issue
   */
  async updateIssueStatus(request: UpdateStatusRequest): Promise<UpdateStatusResponse> {
    const axios = require("axios");

    try {
      // First, get available transitions for the issue
      const transitionsResponse = await axios.get(`${this.baseUrl}/issue/${request.issueKey}/transitions`, {
        headers: {
          Authorization: this.authHeader,
          Accept: "application/json",
        },
      });

      const transitions = transitionsResponse.data.transitions;

      // Find a transition that matches the target status
      const targetTransition = transitions.find(
        (transition: any) =>
          transition.to.name.toUpperCase() === request.status ||
          transition.name.toUpperCase() === request.status ||
          transition.to.name.toUpperCase().includes(request.status.replace(/\s+/g, "")) ||
          transition.name.toUpperCase().includes(request.status.replace(/\s+/g, ""))
      );

      if (!targetTransition) {
        return {
          success: false,
          message: `No transition found to status "${request.status}". Available transitions: ${transitions
            .map((t: any) => t.name)
            .join(", ")}`,
        };
      }

      // Perform the transition
      await axios.post(
        `${this.baseUrl}/issue/${request.issueKey}/transitions`,
        {
          transition: {
            id: targetTransition.id,
          },
        },
        {
          headers: {
            Authorization: this.authHeader,
            Accept: "application/json",
            "Content-Type": "application/json",
          },
        }
      );

      return {
        success: true,
        message: `Successfully transitioned to ${targetTransition.to.name}`,
      };
    } catch (error: any) {
      let errorMessage = `${error.response?.status || "Unknown"} ${error.response?.statusText || "Error"}`;

      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.errorMessages && errorData.errorMessages.length > 0) {
          errorMessage += ` - ${errorData.errorMessages.join(", ")}`;
        } else if (errorData.errors) {
          const errors = Object.values(errorData.errors).join(", ");
          errorMessage += ` - ${errors}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Adds a comment to an issue
   */
  async addComment(request: AddCommentRequest): Promise<AddCommentResponse> {
    const axios = require("axios");

    const payload = {
      body: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: request.comment,
              },
            ],
          },
        ],
      },
    };

    try {
      await axios.post(`${this.baseUrl}/issue/${request.issueKey}/comment`, payload, {
        headers: {
          Authorization: this.authHeader,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      return {
        success: true,
        message: "Comment added successfully",
      };
    } catch (error: any) {
      let errorMessage = `${error.response?.status || "Unknown"} ${error.response?.statusText || "Error"}`;

      if (error.response?.data) {
        const errorData = error.response.data;
        if (errorData.errorMessages && errorData.errorMessages.length > 0) {
          errorMessage += ` - ${errorData.errorMessages.join(", ")}`;
        } else if (errorData.errors) {
          const errors = Object.values(errorData.errors).join(", ");
          errorMessage += ` - ${errors}`;
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      return {
        success: false,
        message: errorMessage,
      };
    }
  }

  /**
   * Tests the connection to Jira
   */
  async testConnection(): Promise<boolean> {
    try {
      const axios = require("axios");

      const response = await axios.get(`${this.baseUrl}/myself`, {
        headers: {
          Authorization: this.authHeader,
          Accept: "application/json",
        },
      });

      return response.status === 200;
    } catch {
      return false;
    }
  }
}
