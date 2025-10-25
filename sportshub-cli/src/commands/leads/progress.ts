import chalk from "chalk";
import * as fs from "fs";
import { JiraService } from "../../services/jira";
import { OpenRouterService } from "../../services/openrouter";
import { ALL_LEAD_STATUSES, LEAD_STATUS_ORDER, LeadStatus } from "../../types/config";
import { ConfigManager } from "../../utils/config";

export interface LeadsProgressOptions {
  organiserName?: string;
  ticketNumber?: string;
  status?: LeadStatus;
  file?: string;
}

async function processFileContent(filePath: string): Promise<string> {
  try {
    console.log(chalk.gray(`📁 Reading file: ${filePath}`));

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, "utf8");

    // Remove excessive whitespace and normalize text
    const cleanedContent = content
      .replace(/\s+/g, " ") // Replace multiple whitespaces with single space
      .replace(/\n\s*\n/g, "\n") // Remove empty lines
      .trim();

    if (!cleanedContent || cleanedContent.length < 10) {
      throw new Error("File contains insufficient content for analysis");
    }

    console.log(chalk.gray(`📝 Processed ${cleanedContent.length} characters from file`));
    return cleanedContent;
  } catch (error) {
    throw new Error(`Failed to process file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

function getNextStatus(currentStatus: string): LeadStatus | null {
  // Normalize current status to match our enum
  const normalizedStatus = currentStatus
    .toUpperCase()
    .replace(/[^A-Z\s]/g, "")
    .trim();

  // Find current status in our order
  const currentIndex = LEAD_STATUS_ORDER.findIndex(
    (status) =>
      status === normalizedStatus ||
      status.replace(/\s+/g, "") === normalizedStatus.replace(/\s+/g, "") ||
      normalizedStatus.includes(status.replace(/\s+/g, ""))
  );

  if (currentIndex === -1) {
    // Status not found in our progression order, might be a custom status
    return LEAD_STATUS_ORDER[0]; // Default to first status
  }

  if (currentIndex === LEAD_STATUS_ORDER.length - 1) {
    // Already at final status
    return null;
  }

  return LEAD_STATUS_ORDER[currentIndex + 1];
}

export async function leadsProgressCommand(options: LeadsProgressOptions): Promise<void> {
  try {
    // Load configuration
    const configManager = new ConfigManager();

    if (!configManager.isConfigured()) {
      console.log(chalk.red('❌ Not configured. Please run "sportshub configure" first.'));
      process.exit(1);
    }

    const config = configManager.getConfig();
    const jiraService = new JiraService(config);
    const openRouterService = new OpenRouterService(config);

    // Validate input - must provide either organiserName or ticketNumber
    if (!options.organiserName && !options.ticketNumber) {
      console.log(chalk.red("❌ Must provide either --organiserName or --ticketNumber"));
      process.exit(1);
    }

    // Validate status if provided
    if (options.status && !ALL_LEAD_STATUSES.includes(options.status)) {
      console.log(chalk.red(`❌ Invalid status. Valid statuses are: ${ALL_LEAD_STATUSES.join(", ")}`));
      process.exit(1);
    }

    let targetTicketNumber = options.ticketNumber;

    // If organiser name provided, search for tickets
    if (options.organiserName && !targetTicketNumber) {
      console.log(chalk.blue("🔍 Searching for tickets..."));
      console.log(chalk.gray(`Organiser: ${options.organiserName}`));

      try {
        const searchResult = await jiraService.searchIssues({
          organiserName: options.organiserName,
          projectKey: config.defaultProjectKey,
        });

        if (searchResult.total === 0) {
          console.log(chalk.yellow("📋 No tickets found matching the search criteria."));
          return;
        }

        if (searchResult.total === 1) {
          targetTicketNumber = searchResult.issues[0].key;
          console.log(chalk.green(`✅ Found ticket: ${targetTicketNumber}`));
        } else {
          console.log(chalk.yellow(`⚠️  Found ${searchResult.total} tickets. Please specify which one to update:\n`));

          searchResult.issues.forEach((issue, index) => {
            console.log(chalk.cyan(`${index + 1}. ${issue.key}`));
            console.log(chalk.white(`   Summary: ${issue.summary}`));
            console.log();
          });

          console.log(chalk.gray("Use --ticketNumber to specify which ticket to update."));
          return;
        }
      } catch (error) {
        console.log(chalk.red("❌ Failed to search for tickets"));
        if (error instanceof Error) {
          console.log(chalk.red(`Details: ${error.message}`));
        }
        process.exit(1);
      }
    }

    if (!targetTicketNumber) {
      console.log(chalk.red("❌ No ticket number available to update"));
      process.exit(1);
    }

    console.log(chalk.blue(`📋 Processing ticket: ${targetTicketNumber}`));

    try {
      // Get current ticket details
      const issueDetails = await jiraService.getIssue(targetTicketNumber);
      console.log(chalk.white(`Current status: ${issueDetails.status}`));

      let targetStatus: LeadStatus;

      if (options.status) {
        // Use provided status
        targetStatus = options.status;
      } else {
        // Determine next status
        const nextStatus = getNextStatus(issueDetails.status);
        if (!nextStatus) {
          console.log(chalk.yellow("⚠️  Ticket is already at the final status or status progression not available."));
          console.log(chalk.gray(`Current status: ${issueDetails.status}`));
          return;
        }
        targetStatus = nextStatus;
      }

      console.log(chalk.yellow(`🔄 Transitioning to: ${targetStatus}`));

      // Update the ticket status
      const updateResult = await jiraService.updateIssueStatus({
        issueKey: targetTicketNumber,
        status: targetStatus,
      });

      if (updateResult.success) {
        console.log(chalk.green(`✅ ${updateResult.message}`));

        const issueUrl = jiraService.getIssueUrl(targetTicketNumber);
        console.log(chalk.blue(`🔗 ${issueUrl}`));

        // Process file if provided
        if (options.file) {
          try {
            console.log(chalk.blue("\n📄 Processing file for summary..."));

            const fileContent = await processFileContent(options.file);

            console.log(chalk.gray("🤖 Generating summary with AI..."));
            const analysis = await openRouterService.summarizeFileContent(fileContent);

            if (analysis.summary) {
              console.log(chalk.gray("💬 Adding summary as comment to ticket..."));

              const commentResult = await jiraService.addComment({
                issueKey: targetTicketNumber,
                comment: `📋 **${new Date().toDateString()} Summary**:\n\n${analysis.summary}`,
              });

              if (commentResult.success) {
                console.log(chalk.green("✅ File summary added as comment"));
              } else {
                console.log(chalk.yellow(`⚠️  Failed to add comment: ${commentResult.message}`));
              }
            } else if (analysis.error) {
              console.log(chalk.yellow(`⚠️  AI analysis failed: ${analysis.error}`));
              console.log(chalk.gray("File content was processed but could not be summarized"));
            }
          } catch (error) {
            console.log(
              chalk.yellow(`⚠️  File processing failed: ${error instanceof Error ? error.message : "Unknown error"}`)
            );
          }
        }
      } else {
        console.log(chalk.red(`❌ Failed to update status: ${updateResult.message}`));
        process.exit(1);
      }
    } catch (error) {
      console.log(chalk.red("❌ Failed to update ticket status"));

      if (error instanceof Error) {
        console.log(chalk.red(`Details: ${error.message}`));

        // Provide helpful suggestions based on common errors
        if (error.message.includes("401")) {
          console.log(chalk.yellow('💡 Tip: Check your credentials with "sportshub configure"'));
        } else if (error.message.includes("403")) {
          console.log(chalk.yellow("💡 Tip: Make sure you have permission to update issues in this project"));
        } else if (error.message.includes("404")) {
          console.log(chalk.yellow("💡 Tip: Check that the ticket number exists"));
        }
      }

      process.exit(1);
    }
  } catch (error) {
    console.error(chalk.red("❌ Unexpected error:"), error);
    process.exit(1);
  }
}
