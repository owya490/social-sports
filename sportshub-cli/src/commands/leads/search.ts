import chalk from "chalk";
import { JiraService } from "../../services/jira";
import { ConfigManager } from "../../utils/config";

export interface LeadsSearchOptions {
  organiserName: string;
}

export async function leadsSearchCommand(options: LeadsSearchOptions): Promise<void> {
  try {
    // Load configuration
    const configManager = new ConfigManager();

    if (!configManager.isConfigured()) {
      console.log(chalk.red('❌ Not configured. Please run "sportshub configure" first.'));
      process.exit(1);
    }

    const config = configManager.getConfig();
    const jiraService = new JiraService(config);

    // Validate organiser name
    if (!options.organiserName || !options.organiserName.trim()) {
      console.log(chalk.red("❌ Organiser name is required"));
      process.exit(1);
    }

    const organiserName = options.organiserName.trim();

    console.log(chalk.blue("🔍 Searching for tickets..."));
    console.log(chalk.gray(`Organiser: ${organiserName}`));

    try {
      // Search for tickets
      const searchResult = await jiraService.searchIssues({
        organiserName,
        projectKey: config.defaultProjectKey,
      });

      if (searchResult.total === 0) {
        console.log(chalk.yellow("📋 No tickets found matching the search criteria."));
        return;
      }

      console.log(chalk.green(`\n✅ Found ${searchResult.total} ticket(s):\n`));

      // Display results
      searchResult.issues.forEach((issue, index) => {
        console.log(chalk.cyan(`${index + 1}. ${issue.key}`));
        console.log(chalk.white(`   Summary: ${issue.summary}`));

        // Show URL for easy access
        const issueUrl = jiraService.getIssueUrl(issue.key);
        console.log(chalk.gray(`   URL: ${issueUrl}`));
        console.log(); // Empty line for spacing
      });
    } catch (error) {
      console.log(chalk.red("❌ Failed to search Jira tickets"));

      if (error instanceof Error) {
        console.log(chalk.red(`Details: ${error.message}`));

        // Provide helpful suggestions based on common errors
        if (error.message.includes("401")) {
          console.log(chalk.yellow('💡 Tip: Check your credentials with "sportshub configure"'));
        } else if (error.message.includes("403")) {
          console.log(chalk.yellow("💡 Tip: Make sure you have permission to search issues in this project"));
        } else if (error.message.includes("404")) {
          console.log(chalk.yellow("💡 Tip: Check that your Jira base URL and project key are correct"));
        }
      }

      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red("❌ Unexpected error:"), error);
    process.exit(1);
  }
}
