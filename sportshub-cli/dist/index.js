#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const commander_1 = require("commander");
const configure_1 = require("./commands/configure");
const create_1 = require("./commands/leads/create");
const progress_1 = require("./commands/leads/progress");
const search_1 = require("./commands/leads/search");
const show_1 = require("./commands/leads/show");
const program = new commander_1.Command();
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
        await (0, configure_1.configureCommand)();
    }
    catch (error) {
        console.error(chalk_1.default.red("❌ Configuration failed:"), error);
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
        await (0, create_1.leadsCreateCommand)({
            organiserName: options.organiserName,
            website: options.website,
        });
    }
    catch (error) {
        console.error(chalk_1.default.red("❌ Failed to create lead ticket:"), error);
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
        await (0, search_1.leadsSearchCommand)({
            organiserName: options.organiserName,
        });
    }
    catch (error) {
        console.error(chalk_1.default.red("❌ Failed to search lead tickets:"), error);
        process.exit(1);
    }
});
// Leads progress subcommand
leadsCommand
    .command("progress")
    .description("Progress a lead ticket to the next status")
    .option("--organiserName <name>", "Name of the organiser to find ticket for")
    .option("--ticketNumber <number>", "Specific ticket number to update")
    .option("--status <status>", "Specific status to transition to (OPPORTUNITY, CONTACTED, MEETING SCHEDULED, ONBOARDING, ONBOARDED, LOST)")
    .option("-f, --file <path>", "Text file to analyze and summarize as a comment")
    .action(async (options) => {
    try {
        await (0, progress_1.leadsProgressCommand)({
            organiserName: options.organiserName,
            ticketNumber: options.ticketNumber,
            status: options.status,
            file: options.file,
        });
    }
    catch (error) {
        console.error(chalk_1.default.red("❌ Failed to progress lead ticket:"), error);
        process.exit(1);
    }
});
// Leads show subcommand
leadsCommand
    .command("show")
    .description("Show all active lead tickets grouped by status")
    .action(async () => {
    try {
        await (0, show_1.leadsShowCommand)();
    }
    catch (error) {
        console.error(chalk_1.default.red("❌ Failed to show lead tickets:"), error);
        process.exit(1);
    }
});
// Add help examples
program.addHelpText("after", `
Examples:
  $ sportshub configure
  $ sportshub leads create --organiserName "Syrio Volleyball Academy" --website "syrio.com"
  $ sportshub leads create --organiserName "Owen"
  $ sportshub leads search --organiserName "syrio volleyball"
  $ sportshub leads progress --organiserName "syrio volleyball"
  $ sportshub leads progress --ticketNumber "SO-123"
  $ sportshub leads progress --ticketNumber "SO-123" --status "CONTACTED"
  $ sportshub leads progress --ticketNumber "SO-123" -f meeting-notes.txt
  $ sportshub leads show
`);
// Handle cases where no command is provided
program.action(() => {
    console.log(chalk_1.default.blue("🏃‍♂️ Sportshub CLI"));
    console.log(chalk_1.default.gray("Use --help to see available commands\n"));
    program.help();
});
// Parse command line arguments
program.parse();
// If no arguments provided, show help
if (!process.argv.slice(2).length) {
    program.outputHelp();
}
//# sourceMappingURL=index.js.map