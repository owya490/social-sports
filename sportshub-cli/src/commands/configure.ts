import chalk from "chalk";
import inquirer from "inquirer";
import { JiraConfig } from "../types/config";
import { ConfigManager } from "../utils/config";

export async function configureCommand(): Promise<void> {
  const configManager = new ConfigManager();

  console.log(chalk.blue("🔐 Sportshub CLI Configuration"));
  console.log(chalk.gray("Please provide your Jira credentials and settings.\n"));

  // Load existing config for defaults
  const existingConfig = configManager.loadConfig();

  try {
    const answers = await inquirer.prompt([
      {
        type: "input",
        name: "jiraBaseUrl",
        message: "Jira base URL (e.g., https://yourcompany.atlassian.net):",
        default: existingConfig?.jiraBaseUrl,
        validate: (input: string) => {
          if (!input.trim()) {
            return "Jira base URL is required";
          }

          try {
            const url = new URL(input);
            if (!url.protocol.startsWith("http")) {
              return "Please provide a valid HTTP/HTTPS URL";
            }
            return true;
          } catch {
            return "Please provide a valid URL";
          }
        },
        filter: (input: string) => input.trim().replace(/\/$/, ""), // Remove trailing slash
      },
      {
        type: "input",
        name: "email",
        message: "Email address:",
        default: existingConfig?.email,
        validate: (input: string) => {
          if (!input.trim()) {
            return "Email address is required";
          }

          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(input)) {
            return "Please provide a valid email address";
          }

          return true;
        },
        filter: (input: string) => input.trim(),
      },
      {
        type: "password",
        name: "apiToken",
        message: "API Token:",
        validate: (input: string) => {
          if (!input.trim()) {
            return "API Token is required";
          }
          return true;
        },
        filter: (input: string) => input.trim(),
      },
      {
        type: "input",
        name: "defaultProjectKey",
        message: "Default project key (e.g., SH):",
        default: existingConfig?.defaultProjectKey || "SH",
        validate: (input: string) => {
          if (!input.trim()) {
            return "Project key is required";
          }

          // Jira project keys are typically 2-10 uppercase letters
          if (!/^[A-Z]{1,10}$/.test(input.trim())) {
            return "Project key should be 1-10 uppercase letters";
          }

          return true;
        },
        filter: (input: string) => input.trim().toUpperCase(),
      },
      {
        type: "password",
        name: "openRouterApiToken",
        message: "OpenRouter API Token:",
        default: existingConfig?.openRouterApiToken,
        validate: (input: string) => {
          if (!input.trim()) {
            return "OpenRouter API Token is required";
          }
          return true;
        },
        filter: (input: string) => input.trim(),
      },
    ]);

    const config: JiraConfig = {
      jiraBaseUrl: answers.jiraBaseUrl,
      email: answers.email,
      apiToken: answers.apiToken,
      defaultProjectKey: answers.defaultProjectKey,
      openRouterApiToken: answers.openRouterApiToken,
    };

    // Test the configuration by making a simple API call
    console.log(chalk.yellow("\n🔍 Testing Jira connection..."));

    const testResult = await testJiraConnection(config);
    if (!testResult.success) {
      console.log(chalk.red(`❌ Connection test failed: ${testResult.error}`));
      console.log(chalk.gray("Configuration not saved. Please check your credentials and try again."));
      return;
    }

    // Save the configuration
    configManager.saveConfig(config);

    console.log(chalk.green("✅ Configuration saved successfully!"));
    console.log(chalk.gray(`Configuration stored at: ${configManager.getConfigPath()}`));
    console.log(chalk.green("\n🎉 You can now use sportshub to create lead tickets!"));
  } catch (error) {
    if (error instanceof Error && error.message === "User force closed the prompt with 0 null") {
      console.log(chalk.yellow("\n⚠️  Configuration cancelled."));
      return;
    }

    console.error(chalk.red("❌ Configuration failed:"), error);
    process.exit(1);
  }
}

async function testJiraConnection(config: JiraConfig): Promise<{ success: boolean; error?: string }> {
  try {
    const axios = require("axios");

    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString("base64");

    const response = await axios.get(`${config.jiraBaseUrl}/rest/api/3/myself`, {
      headers: {
        Authorization: `Basic ${auth}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });

    return { success: true };
  } catch (error: any) {
    let errorMessage = "Unknown error occurred";

    if (error.response) {
      errorMessage = `${error.response.status} ${error.response.statusText}`;
      if (error.response.data) {
        errorMessage += ` - ${JSON.stringify(error.response.data)}`;
      }
    } else if (error.message) {
      errorMessage = error.message;
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}
