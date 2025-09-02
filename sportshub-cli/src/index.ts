#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";
import { configureCommand } from "./commands/configure";
import { leadsCreateCommand, leadsSearchCommand } from "./commands/leads";
import { leadsProgressCommand } from "./commands/progress";
import { leadsShowCommand } from "./commands/show";

const program = new Command();

// Read version from package.json
const packageJson = require("../package.json");

program
  .name("sportshub")
  .description("CLI tool for Sportshub Leads to create Jira tickets")
  .version(packageJson.version);

// Configure command
program
  .command("configure")
  .description("Configure Jira credentials and settings")
  .action(async () => {
    try {
      await configureCommand();
    } catch (error) {
      console.error(chalk.red("❌ Configuration failed:"), error);
      process.exit(1);
    }
  });

// Leads command group
const leadsCommand = program.command("leads").description("Manage lead-related operations");

// Leads create subcommand
leadsCommand
  .command("create")
  .description("Create a new lead ticket in Jira")
  .requiredOption("--organiserName <name>", "Name of the organiser")
  .option("--website <url>", "Website of the organiser/company")
  .action(async (options) => {
    try {
      await leadsCreateCommand({
        organiserName: options.organiserName,
        website: options.website,
      });
    } catch (error) {
      console.error(chalk.red("❌ Failed to create lead ticket:"), error);
      process.exit(1);
    }
  });

// Leads search subcommand
leadsCommand
  .command("search")
  .description("Search for existing lead tickets by organiser name")
  .requiredOption("--organiserName <name>", "Name of the organiser to search for")
  .action(async (options) => {
    try {
      await leadsSearchCommand({
        organiserName: options.organiserName,
      });
    } catch (error) {
      console.error(chalk.red("❌ Failed to search lead tickets:"), error);
      process.exit(1);
    }
  });

// Leads progress subcommand
leadsCommand
  .command("progress")
  .description("Progress a lead ticket to the next status")
  .option("--organiserName <name>", "Name of the organiser to find ticket for")
  .option("--ticketNumber <number>", "Specific ticket number to update")
  .option(
    "--status <status>",
    "Specific status to transition to (OPPORTUNITY, CONTACTED, MEETING SCHEDULED, ONBOARDING, ONBOARDED, LOST)"
  )
  .action(async (options) => {
    try {
      await leadsProgressCommand({
        organiserName: options.organiserName,
        ticketNumber: options.ticketNumber,
        status: options.status,
      });
    } catch (error) {
      console.error(chalk.red("❌ Failed to progress lead ticket:"), error);
      process.exit(1);
    }
  });

// Leads show subcommand
leadsCommand
  .command("show")
  .description("Show all active lead tickets grouped by status")
  .action(async () => {
    try {
      await leadsShowCommand();
    } catch (error) {
      console.error(chalk.red("❌ Failed to show lead tickets:"), error);
      process.exit(1);
    }
  });

// Add help examples
program.addHelpText(
  "after",
  `
Examples:
  $ sportshub configure
  $ sportshub leads create --organiserName "Syrio Volleyball Academy" --website "syrio.com"
  $ sportshub leads create --organiserName "Owen"
  $ sportshub leads search --organiserName "syrio volleyball"
  $ sportshub leads progress --organiserName "syrio volleyball"
  $ sportshub leads progress --ticketNumber "SO-123"
  $ sportshub leads progress --ticketNumber "SO-123" --status "CONTACTED"
  $ sportshub leads show
`
);

// Handle cases where no command is provided
program.action(() => {
  console.log(chalk.blue("🏃‍♂️ Sportshub CLI"));
  console.log(chalk.gray("Use --help to see available commands\n"));
  program.help();
});

// Parse command line arguments
program.parse();

// If no arguments provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
