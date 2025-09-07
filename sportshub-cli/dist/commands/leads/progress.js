"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.leadsProgressCommand = leadsProgressCommand;
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const jira_1 = require("../../services/jira");
const openrouter_1 = require("../../services/openrouter");
const config_1 = require("../../types/config");
const config_2 = require("../../utils/config");
async function processFileContent(filePath) {
    try {
        console.log(chalk_1.default.gray(`📁 Reading file: ${filePath}`));
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
        console.log(chalk_1.default.gray(`📝 Processed ${cleanedContent.length} characters from file`));
        return cleanedContent;
    }
    catch (error) {
        throw new Error(`Failed to process file: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
}
function getNextStatus(currentStatus) {
    // Normalize current status to match our enum
    const normalizedStatus = currentStatus
        .toUpperCase()
        .replace(/[^A-Z\s]/g, "")
        .trim();
    // Find current status in our order
    const currentIndex = config_1.LEAD_STATUS_ORDER.findIndex((status) => status === normalizedStatus ||
        status.replace(/\s+/g, "") === normalizedStatus.replace(/\s+/g, "") ||
        normalizedStatus.includes(status.replace(/\s+/g, "")));
    if (currentIndex === -1) {
        // Status not found in our progression order, might be a custom status
        return config_1.LEAD_STATUS_ORDER[0]; // Default to first status
    }
    if (currentIndex === config_1.LEAD_STATUS_ORDER.length - 1) {
        // Already at final status
        return null;
    }
    return config_1.LEAD_STATUS_ORDER[currentIndex + 1];
}
async function leadsProgressCommand(options) {
    try {
        // Load configuration
        const configManager = new config_2.ConfigManager();
        if (!configManager.isConfigured()) {
            console.log(chalk_1.default.red('❌ Not configured. Please run "sportshub configure" first.'));
            process.exit(1);
        }
        const config = configManager.getConfig();
        const jiraService = new jira_1.JiraService(config);
        const openRouterService = new openrouter_1.OpenRouterService(config);
        // Validate input - must provide either organiserName or ticketNumber
        if (!options.organiserName && !options.ticketNumber) {
            console.log(chalk_1.default.red("❌ Must provide either --organiserName or --ticketNumber"));
            process.exit(1);
        }
        // Validate status if provided
        if (options.status && !config_1.ALL_LEAD_STATUSES.includes(options.status)) {
            console.log(chalk_1.default.red(`❌ Invalid status. Valid statuses are: ${config_1.ALL_LEAD_STATUSES.join(", ")}`));
            process.exit(1);
        }
        let targetTicketNumber = options.ticketNumber;
        // If organiser name provided, search for tickets
        if (options.organiserName && !targetTicketNumber) {
            console.log(chalk_1.default.blue("🔍 Searching for tickets..."));
            console.log(chalk_1.default.gray(`Organiser: ${options.organiserName}`));
            try {
                const searchResult = await jiraService.searchIssues({
                    organiserName: options.organiserName,
                    projectKey: config.defaultProjectKey,
                });
                if (searchResult.total === 0) {
                    console.log(chalk_1.default.yellow("📋 No tickets found matching the search criteria."));
                    return;
                }
                if (searchResult.total === 1) {
                    targetTicketNumber = searchResult.issues[0].key;
                    console.log(chalk_1.default.green(`✅ Found ticket: ${targetTicketNumber}`));
                }
                else {
                    console.log(chalk_1.default.yellow(`⚠️  Found ${searchResult.total} tickets. Please specify which one to update:\n`));
                    searchResult.issues.forEach((issue, index) => {
                        console.log(chalk_1.default.cyan(`${index + 1}. ${issue.key}`));
                        console.log(chalk_1.default.white(`   Summary: ${issue.summary}`));
                        console.log();
                    });
                    console.log(chalk_1.default.gray("Use --ticketNumber to specify which ticket to update."));
                    return;
                }
            }
            catch (error) {
                console.log(chalk_1.default.red("❌ Failed to search for tickets"));
                if (error instanceof Error) {
                    console.log(chalk_1.default.red(`Details: ${error.message}`));
                }
                process.exit(1);
            }
        }
        if (!targetTicketNumber) {
            console.log(chalk_1.default.red("❌ No ticket number available to update"));
            process.exit(1);
        }
        console.log(chalk_1.default.blue(`📋 Processing ticket: ${targetTicketNumber}`));
        try {
            // Get current ticket details
            const issueDetails = await jiraService.getIssue(targetTicketNumber);
            console.log(chalk_1.default.white(`Current status: ${issueDetails.status}`));
            let targetStatus;
            if (options.status) {
                // Use provided status
                targetStatus = options.status;
            }
            else {
                // Determine next status
                const nextStatus = getNextStatus(issueDetails.status);
                if (!nextStatus) {
                    console.log(chalk_1.default.yellow("⚠️  Ticket is already at the final status or status progression not available."));
                    console.log(chalk_1.default.gray(`Current status: ${issueDetails.status}`));
                    return;
                }
                targetStatus = nextStatus;
            }
            console.log(chalk_1.default.yellow(`🔄 Transitioning to: ${targetStatus}`));
            // Update the ticket status
            const updateResult = await jiraService.updateIssueStatus({
                issueKey: targetTicketNumber,
                status: targetStatus,
            });
            if (updateResult.success) {
                console.log(chalk_1.default.green(`✅ ${updateResult.message}`));
                const issueUrl = jiraService.getIssueUrl(targetTicketNumber);
                console.log(chalk_1.default.blue(`🔗 ${issueUrl}`));
                // Process file if provided
                if (options.file) {
                    try {
                        console.log(chalk_1.default.blue("\n📄 Processing file for summary..."));
                        const fileContent = await processFileContent(options.file);
                        console.log(chalk_1.default.gray("🤖 Generating summary with AI..."));
                        const analysis = await openRouterService.summarizeFileContent(fileContent);
                        if (analysis.summary) {
                            console.log(chalk_1.default.gray("💬 Adding summary as comment to ticket..."));
                            const commentResult = await jiraService.addComment({
                                issueKey: targetTicketNumber,
                                comment: `📋 **${new Date().toDateString()} Summary**:\n\n${analysis.summary}`,
                            });
                            if (commentResult.success) {
                                console.log(chalk_1.default.green("✅ File summary added as comment"));
                            }
                            else {
                                console.log(chalk_1.default.yellow(`⚠️  Failed to add comment: ${commentResult.message}`));
                            }
                        }
                        else if (analysis.error) {
                            console.log(chalk_1.default.yellow(`⚠️  AI analysis failed: ${analysis.error}`));
                            console.log(chalk_1.default.gray("File content was processed but could not be summarized"));
                        }
                    }
                    catch (error) {
                        console.log(chalk_1.default.yellow(`⚠️  File processing failed: ${error instanceof Error ? error.message : "Unknown error"}`));
                    }
                }
            }
            else {
                console.log(chalk_1.default.red(`❌ Failed to update status: ${updateResult.message}`));
                process.exit(1);
            }
        }
        catch (error) {
            console.log(chalk_1.default.red("❌ Failed to update ticket status"));
            if (error instanceof Error) {
                console.log(chalk_1.default.red(`Details: ${error.message}`));
                // Provide helpful suggestions based on common errors
                if (error.message.includes("401")) {
                    console.log(chalk_1.default.yellow('💡 Tip: Check your credentials with "sportshub configure"'));
                }
                else if (error.message.includes("403")) {
                    console.log(chalk_1.default.yellow("💡 Tip: Make sure you have permission to update issues in this project"));
                }
                else if (error.message.includes("404")) {
                    console.log(chalk_1.default.yellow("💡 Tip: Check that the ticket number exists"));
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
//# sourceMappingURL=progress.js.map