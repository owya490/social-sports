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
