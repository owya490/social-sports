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
exports.leadsCreateCommand = leadsCreateCommand;
const axios_1 = __importDefault(require("axios"));
const chalk_1 = __importDefault(require("chalk"));
const cheerio = __importStar(require("cheerio"));
const jira_1 = require("../../services/jira");
const openrouter_1 = require("../../services/openrouter");
const config_1 = require("../../utils/config");
async function scrapeWebsiteText(url) {
    try {
        console.log(chalk_1.default.gray(`🔍 Scraping website: ${url}`));
        const response = await axios_1.default.get(url, {
            timeout: 10000,
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
            },
        });
        const $ = cheerio.load(response.data);
        // Remove script and style elements
        $("script").remove();
        $("style").remove();
        $("nav").remove();
        $("footer").remove();
        // Extract text from common content areas
        const titleText = $("title").text().trim();
        const headingText = $("h1, h2, h3")
            .map((_, el) => $(el).text().trim())
            .get()
            .join(" ");
        const paragraphText = $("p")
            .map((_, el) => $(el).text().trim())
            .get()
            .join(" ");
        const mainText = $("main").text().trim();
        const articleText = $("article").text().trim();
        // Combine all text
        const allText = [titleText, headingText, paragraphText, mainText, articleText]
            .filter((text) => text.length > 0)
            .join(" ")
            .replace(/\s+/g, " ")
            .trim();
        return allText;
    }
    catch (error) {
        console.log(chalk_1.default.yellow(`⚠️  Failed to scrape website: ${error instanceof Error ? error.message : "Unknown error"}`));
        return "";
    }
}
async function leadsCreateCommand(options) {
    try {
        // Load configuration
        const configManager = new config_1.ConfigManager();
        if (!configManager.isConfigured()) {
            console.log(chalk_1.default.red('❌ Not configured. Please run "sportshub configure" first.'));
            process.exit(1);
        }
        const config = configManager.getConfig();
        const jiraService = new jira_1.JiraService(config);
        const openRouterService = new openrouter_1.OpenRouterService(config);
        // Validate organiser name
        if (!options.organiserName || !options.organiserName.trim()) {
            console.log(chalk_1.default.red("❌ Organiser name is required"));
            process.exit(1);
        }
        const organiserName = options.organiserName.trim();
        // Build ticket summary and description
        const summary = `${organiserName}`;
        let description = `📌 Organiser Name: ${organiserName}`;
        // Process website if provided
        if (options.website && options.website.trim()) {
            let website = options.website.trim();
            // Add protocol if missing
            if (!website.startsWith("http://") && !website.startsWith("https://")) {
                website = `https://${website}`;
            }
            description += `\nWebsite: ${website}`;
            // Scrape and analyze website content
            const websiteText = await scrapeWebsiteText(website);
            if (websiteText && websiteText.length > 50) {
                console.log(chalk_1.default.gray(`📝 Found ${websiteText.length} characters of text content`));
                // Analyze content with AI
                console.log(chalk_1.default.gray(`🤖 Analyzing website content with AI...`));
                const analysis = await openRouterService.analyzeWebsiteContent(websiteText);
                if (analysis.summary) {
                    description += `\n\nWebsite Analysis:\n${analysis.summary}`;
                }
                else if (analysis.error) {
                    console.log(chalk_1.default.yellow(`⚠️  AI analysis failed: ${analysis.error}`));
                    description += `\n\n_Note: Website content found but AI analysis unavailable_`;
                }
            }
            else {
                console.log(chalk_1.default.yellow(`⚠️  No meaningful content found on website`));
                description += `\n\n_Note: Website link provided but no content available for analysis_`;
            }
        }
        console.log(chalk_1.default.blue("🎫 Creating Jira ticket..."));
        console.log(chalk_1.default.gray(`Summary: ${summary}`));
        try {
            // Create the Jira ticket
            const issue = await jiraService.createIssue({
                summary,
                description,
                projectKey: config.defaultProjectKey,
                issueType: "Lead",
            });
            const issueUrl = jiraService.getIssueUrl(issue.key);
            console.log(chalk_1.default.green(`✅ Lead ticket created: ${issue.key}`));
            console.log(chalk_1.default.blue(`🔗 ${issueUrl}`));
        }
        catch (error) {
            console.log(chalk_1.default.red("❌ Failed to create Jira ticket"));
            if (error instanceof Error) {
                console.log(chalk_1.default.red(`Details: ${error.message}`));
                // Provide helpful suggestions based on common errors
                if (error.message.includes("401")) {
                    console.log(chalk_1.default.yellow('💡 Tip: Check your credentials with "sportshub configure"'));
                }
                else if (error.message.includes("403")) {
                    console.log(chalk_1.default.yellow("💡 Tip: Make sure you have permission to create issues in this project"));
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
//# sourceMappingURL=create.js.map