"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadsSearchCommand = leadsSearchCommand;
const chalk_1 = __importDefault(require("chalk"));
const jira_1 = require("../../services/jira");
const config_1 = require("../../utils/config");
async function leadsSearchCommand(options) {
    try {
        // Load configuration
        const configManager = new config_1.ConfigManager();
        if (!configManager.isConfigured()) {
            console.log(chalk_1.default.red('❌ Not configured. Please run "sportshub configure" first.'));
            process.exit(1);
        }
        const config = configManager.getConfig();
        const jiraService = new jira_1.JiraService(config);
        // Validate organiser name
        if (!options.organiserName || !options.organiserName.trim()) {
            console.log(chalk_1.default.red("❌ Organiser name is required"));
            process.exit(1);
        }
        const organiserName = options.organiserName.trim();
        console.log(chalk_1.default.blue("🔍 Searching for tickets..."));
        console.log(chalk_1.default.gray(`Organiser: ${organiserName}`));
        try {
            // Search for tickets
            const searchResult = await jiraService.searchIssues({
                organiserName,
                projectKey: config.defaultProjectKey,
            });
            if (searchResult.total === 0) {
                console.log(chalk_1.default.yellow("📋 No tickets found matching the search criteria."));
                return;
            }
            console.log(chalk_1.default.green(`\n✅ Found ${searchResult.total} ticket(s):\n`));
            // Display results
            searchResult.issues.forEach((issue, index) => {
                console.log(chalk_1.default.cyan(`${index + 1}. ${issue.key}`));
                console.log(chalk_1.default.white(`   Summary: ${issue.summary}`));
                // Show URL for easy access
                const issueUrl = jiraService.getIssueUrl(issue.key);
                console.log(chalk_1.default.gray(`   URL: ${issueUrl}`));
                console.log(); // Empty line for spacing
            });
        }
        catch (error) {
            console.log(chalk_1.default.red("❌ Failed to search Jira tickets"));
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
//# sourceMappingURL=search.js.map