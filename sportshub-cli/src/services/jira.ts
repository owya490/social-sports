import { JiraConfig } from "../types/config";

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
