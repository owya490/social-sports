#!/usr/bin/env node

import chalk from "chalk";
import { Command } from "commander";
import { configureCommand } from "./commands/configure";
import { leadsCreateCommand } from "./commands/leads";

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

// Add help examples
program.addHelpText(
  "after",
  `
Examples:
  $ sportshub configure
  $ sportshub leads create --organiserName "Syrio Volleyball Academy" --website "syrio.com"
  $ sportshub leads create --organiserName "Owen"
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
