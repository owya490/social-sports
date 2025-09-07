import axios from "axios";
import chalk from "chalk";
import * as cheerio from "cheerio";
import { JiraService } from "../../services/jira";
import { OpenRouterService } from "../../services/openrouter";
import { ConfigManager } from "../../utils/config";

export interface LeadsCreateOptions {
  organiserName: string;
  website?: string;
}

interface WebsiteAnalysis {
  summary?: string;
  error?: string;
}

async function scrapeWebsiteText(url: string): Promise<string> {
  try {
    console.log(chalk.gray(`🔍 Scraping website: ${url}`));

    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
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
  } catch (error) {
    console.log(
      chalk.yellow(`⚠️  Failed to scrape website: ${error instanceof Error ? error.message : "Unknown error"}`)
    );
    return "";
  }
}

export async function leadsCreateCommand(options: LeadsCreateOptions): Promise<void> {
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

    // Validate organiser name
    if (!options.organiserName || !options.organiserName.trim()) {
      console.log(chalk.red("❌ Organiser name is required"));
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
        console.log(chalk.gray(`📝 Found ${websiteText.length} characters of text content`));

        // Analyze content with AI
        console.log(chalk.gray(`🤖 Analyzing website content with AI...`));
        const analysis = await openRouterService.analyzeWebsiteContent(websiteText);

        if (analysis.summary) {
          description += `\n\nWebsite Analysis:\n${analysis.summary}`;
        } else if (analysis.error) {
          console.log(chalk.yellow(`⚠️  AI analysis failed: ${analysis.error}`));
          description += `\n\n_Note: Website content found but AI analysis unavailable_`;
        }
      } else {
        console.log(chalk.yellow(`⚠️  No meaningful content found on website`));
        description += `\n\n_Note: Website link provided but no content available for analysis_`;
      }
    }

    console.log(chalk.blue("🎫 Creating Jira ticket..."));
    console.log(chalk.gray(`Summary: ${summary}`));

    try {
      // Create the Jira ticket
      const issue = await jiraService.createIssue({
        summary,
        description,
        projectKey: config.defaultProjectKey,
        issueType: "Lead",
      });

      const issueUrl = jiraService.getIssueUrl(issue.key);

      console.log(chalk.green(`✅ Lead ticket created: ${issue.key}`));
      console.log(chalk.blue(`🔗 ${issueUrl}`));
    } catch (error) {
      console.log(chalk.red("❌ Failed to create Jira ticket"));

      if (error instanceof Error) {
        console.log(chalk.red(`Details: ${error.message}`));

        // Provide helpful suggestions based on common errors
        if (error.message.includes("401")) {
          console.log(chalk.yellow('💡 Tip: Check your credentials with "sportshub configure"'));
        } else if (error.message.includes("403")) {
          console.log(chalk.yellow("💡 Tip: Make sure you have permission to create issues in this project"));
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
