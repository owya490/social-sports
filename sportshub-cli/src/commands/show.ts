import chalk from "chalk";
import { JiraService } from "../services/jira";
import { LEAD_STATUS_ORDER } from "../types/config";
import { ConfigManager } from "../utils/config";

export async function leadsShowCommand(): Promise<void> {
  try {
    // Load configuration
    const configManager = new ConfigManager();

    if (!configManager.isConfigured()) {
      console.log(chalk.red('❌ Not configured. Please run "sportshub configure" first.'));
      process.exit(1);
    }

    const config = configManager.getConfig();
    const jiraService = new JiraService(config);

    console.log(chalk.blue("📋 Fetching all lead tickets..."));

    try {
      // Get all leads
      const allLeadsResult = await jiraService.getAllLeads(config.defaultProjectKey);

      if (allLeadsResult.total === 0) {
        console.log(chalk.yellow("📋 No lead tickets found."));
        return;
      }

      // Filter out ONBOARDED and LOST leads
      const activeLeads = allLeadsResult.leads.filter((lead) => {
        const normalizedStatus = lead.status
          .toUpperCase()
          .replace(/[^A-Z\s]/g, "")
          .trim();
        // return !normalizedStatus.includes("ONBOARD") && !normalizedStatus.includes("LOST");
        return true;
      });

      if (activeLeads.length === 0) {
        console.log(chalk.yellow("📋 No active lead tickets found (all leads are either onboarded or lost)."));
        return;
      }

      console.log(chalk.green(`\n✅ Found ${activeLeads.length} active lead(s):\n`));

      // Group leads by status in the order we want
      const groupedLeads = new Map<string, typeof activeLeads>();

      // Initialize groups with our status order
      LEAD_STATUS_ORDER.forEach((status) => {
        groupedLeads.set(status, []);
      });

      // Also create groups for any other statuses we encounter
      activeLeads.forEach((lead) => {
        const normalizedStatus = lead.status
          .toUpperCase()
          .replace(/[^A-Z\s]/g, "")
          .trim();

        // Try to match with our standard statuses
        let matchedStatus = LEAD_STATUS_ORDER.find(
          (status) =>
            status === normalizedStatus ||
            status.replace(/\s+/g, "") === normalizedStatus.replace(/\s+/g, "") ||
            normalizedStatus.includes(status.replace(/\s+/g, ""))
        );

        if (!matchedStatus) {
          // Use the original status if no match found
          const originalStatus = lead.status;
          if (!groupedLeads.has(originalStatus)) {
            groupedLeads.set(originalStatus, []);
          }
          groupedLeads.get(originalStatus)?.push(lead);
        } else {
          groupedLeads.get(matchedStatus)?.push(lead);
        }
      });

      // Display results grouped by status
      let displayedAnyGroup = false;

      // First show our standard statuses in order
      LEAD_STATUS_ORDER.forEach((status) => {
        const leadsInStatus = groupedLeads.get(status) || [];
        if (leadsInStatus.length > 0) {
          displayedAnyGroup = true;
          displayStatusGroup(status, leadsInStatus, jiraService);
        }
      });

      // Then show any other statuses
      groupedLeads.forEach((leadsInStatus, status) => {
        if (!LEAD_STATUS_ORDER.includes(status as any) && leadsInStatus.length > 0) {
          displayedAnyGroup = true;
          displayStatusGroup(status, leadsInStatus, jiraService);
        }
      });

      if (!displayedAnyGroup) {
        console.log(chalk.yellow("📋 No active leads to display."));
      }
    } catch (error) {
      console.log(chalk.red("❌ Failed to fetch lead tickets"));

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

function displayStatusGroup(status: string, leads: any[], jiraService: JiraService): void {
  // Choose colors based on status
  const statusColors = {
    OPPORTUNITY: chalk.yellow,
    CONTACTED: chalk.blue,
    "MEETING SCHEDULED": chalk.cyan,
    ONBOARDING: chalk.magenta,
  };

  const statusColor = statusColors[status as keyof typeof statusColors] || chalk.white;

  // Create a nice header for the status group
  const statusHeader = `${getStatusEmoji(status)} ${status}`;
  console.log(statusColor.bold(statusHeader));
  console.log(statusColor("─".repeat(statusHeader.length + 2)));

  leads.forEach((lead, index) => {
    const issueUrl = jiraService.getIssueUrl(lead.key);

    console.log(chalk.gray(`  ${index + 1}.`), chalk.cyan.bold(lead.key));
    console.log(chalk.gray(`     Summary:`), chalk.white(lead.summary));
    console.log(chalk.gray(`     URL:`), chalk.blue.underline(issueUrl));

    if (index < leads.length - 1) {
      console.log(); // Add spacing between items
    }
  });

  console.log(); // Add spacing between status groups
}

function getStatusEmoji(status: string): string {
  const emojiMap = {
    OPPORTUNITY: "🌱",
    CONTACTED: "📞",
    "MEETING SCHEDULED": "📅",
    ONBOARDING: "🚀",
    ONBOARDED: "✅",
    LOST: "❌",
  };

  return emojiMap[status as keyof typeof emojiMap] || "📋";
}
