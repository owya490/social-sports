"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadsShowCommand = leadsShowCommand;
const chalk_1 = __importDefault(require("chalk"));
const jira_1 = require("../../services/jira");
const config_1 = require("../../types/config");
const config_2 = require("../../utils/config");
async function leadsShowCommand() {
    try {
        // Load configuration
        const configManager = new config_2.ConfigManager();
        if (!configManager.isConfigured()) {
            console.log(chalk_1.default.red('❌ Not configured. Please run "sportshub configure" first.'));
            process.exit(1);
        }
        const config = configManager.getConfig();
        const jiraService = new jira_1.JiraService(config);
        console.log(chalk_1.default.blue("📋 Fetching all lead tickets..."));
        try {
            // Get all leads
            const allLeadsResult = await jiraService.getAllLeads(config.defaultProjectKey);
            if (allLeadsResult.total === 0) {
                console.log(chalk_1.default.yellow("📋 No lead tickets found."));
                return;
            }
            // Filter out ONBOARDED and LOST leads
            const activeLeads = allLeadsResult.leads.filter((lead) => {
                const normalizedStatus = lead.status
                    .toUpperCase()
                    .replace(/[^A-Z\s]/g, "")
                    .trim();
                return !normalizedStatus.includes("LOST");
            });
            if (activeLeads.length === 0) {
                console.log(chalk_1.default.yellow("📋 No active lead tickets found (all leads are either onboarded or lost)."));
                return;
            }
            console.log(chalk_1.default.green(`\n✅ Found ${activeLeads.length} active lead(s):\n`));
            // Group leads by status in the order we want
            const groupedLeads = new Map();
            // Initialize groups with our status order
            config_1.LEAD_STATUS_ORDER.forEach((status) => {
                groupedLeads.set(status, []);
            });
            // Also create groups for any other statuses we encounter
            activeLeads.forEach((lead) => {
                const normalizedStatus = lead.status
                    .toUpperCase()
                    .replace(/[^A-Z\s]/g, "")
                    .trim();
                // Try to match with our standard statuses
                let matchedStatus = config_1.LEAD_STATUS_ORDER.find((status) => status === normalizedStatus ||
                    status.replace(/\s+/g, "") === normalizedStatus.replace(/\s+/g, "") ||
                    normalizedStatus.includes(status.replace(/\s+/g, "")));
                if (!matchedStatus) {
                    // Use the original status if no match found
                    const originalStatus = lead.status;
                    if (!groupedLeads.has(originalStatus)) {
                        groupedLeads.set(originalStatus, []);
                    }
                    groupedLeads.get(originalStatus)?.push(lead);
                }
                else {
                    groupedLeads.get(matchedStatus)?.push(lead);
                }
            });
            // Display results grouped by status
            let displayedAnyGroup = false;
            // First show our standard statuses in order
            config_1.LEAD_STATUS_ORDER.reverse().forEach((status) => {
                const leadsInStatus = groupedLeads.get(status) || [];
                if (leadsInStatus.length > 0) {
                    displayedAnyGroup = true;
                    displayStatusGroup(status, leadsInStatus, jiraService);
                }
            });
            // Then show any other statuses
            groupedLeads.forEach((leadsInStatus, status) => {
                if (!config_1.LEAD_STATUS_ORDER.includes(status) && leadsInStatus.length > 0) {
                    displayedAnyGroup = true;
                    displayStatusGroup(status, leadsInStatus, jiraService);
                }
            });
            if (!displayedAnyGroup) {
                console.log(chalk_1.default.yellow("📋 No active leads to display."));
            }
        }
        catch (error) {
            console.log(chalk_1.default.red("❌ Failed to fetch lead tickets"));
            if (error instanceof Error) {
                console.log(chalk_1.default.red(`Details: ${error.message}`));
                // Provide helpful suggestions based on common errors
                if (error.message.includes("401")) {
                    console.log(chalk_1.default.yellow('💡 Tip: Check your credentials with "sportshub configure"'));
                }
                else if (error.message.includes("403")) {
                    console.log(chalk_1.default.yellow("💡 Tip: Make sure you have permission to search issues in this project"));
                }
                else if (error.message.includes("404")) {
                    console.log(chalk_1.default.yellow("💡 Tip: Check that your Jira base URL and project key are correct"));
                }
            }
            process.exit(1);
        }
    }
    catch (error) {
        console.error(chalk_1.default.red("❌ Unexpected error:"), error);
        process.exit(1);
    }
}
function displayStatusGroup(status, leads, jiraService) {
    // Choose colors based on status
    const statusColors = {
        OPPORTUNITY: chalk_1.default.yellow,
        CONTACTED: chalk_1.default.blue,
        "MEETING SCHEDULED": chalk_1.default.cyan,
        ONBOARDING: chalk_1.default.magenta,
    };
    const statusColor = statusColors[status] || chalk_1.default.white;
    // Create a nice header for the status group
    const statusHeader = `${getStatusEmoji(status)} ${status}`;
    console.log(statusColor.bold(statusHeader));
    console.log(statusColor("─".repeat(statusHeader.length + 2)));
    leads.forEach((lead, index) => {
        const issueUrl = jiraService.getIssueUrl(lead.key);
        console.log(chalk_1.default.gray(`  ${index + 1}.`), chalk_1.default.cyan.bold(lead.key));
        console.log(chalk_1.default.gray(`     Summary:`), chalk_1.default.white(lead.summary));
        console.log(chalk_1.default.gray(`     URL:`), chalk_1.default.blue.underline(issueUrl));
        if (index < leads.length - 1) {
            console.log(); // Add spacing between items
        }
    });
    console.log(); // Add spacing between status groups
}
function getStatusEmoji(status) {
    const emojiMap = {
        OPPORTUNITY: "🌱",
        CONTACTED: "📞",
        "MEETING SCHEDULED": "📅",
        ONBOARDING: "🚀",
        ONBOARDED: "✅",
        LOST: "❌",
    };
    return emojiMap[status] || "📋";
}
//# sourceMappingURL=show.js.map