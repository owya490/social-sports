# Sportshub CLI

A CLI tool for Sportshub Leads to quickly create Jira tickets related to new leads.

## Features

- 🔐 Secure credential management
- 🎫 Quick Jira ticket creation
- ✅ Input validation and error handling
- 🌐 Automatic website URL formatting
- 📱 Beautiful terminal interface
- 🤖 AI-powered text summarization for meeting notes

## Installation

### Quick Installation

1. Navigate to the sportshub-cli directory:
   ```bash
   cd sportshub-cli
   ```
2. Run the install script:
   ```bash
   ./install.sh
   ```

The CLI will now be available globally as `sportshub`.

### Manual Installation

If you prefer manual installation or the install script doesn't work:

1. Install dependencies:
   ```bash
   npm install
   ```
2. Build and link globally:
   ```bash
   npm run build
   npm link
   ```

### Manual Installation on Other Computers

1. Copy the built `dist` folder to the target computer
2. Copy `package.json` to the same location
3. Run:
   ```bash
   npm install -g .
   ```

## Configuration

Before using the CLI, configure your Jira credentials:

```bash
sportshub configure
```

You'll be prompted for:

- Jira base URL (e.g., https://yourcompany.atlassian.net)
- Email address
- API Token
- Default project key (e.g., SH)

Configuration is stored securely at: `~/.config/sportshub-cli/config.json`

## Usage

### Create a Lead Ticket

```bash
# With website
sportshub leads create --organiserName "Syrio Volleyball Academy" --website "syrio.com"

# Without website
sportshub leads create --organiserName "Owen"
```

### Search for Existing Lead Tickets

```bash
# Search for tickets by organiser name
sportshub leads search --organiserName "syrio volleyball"
```

### Progress Lead Tickets

```bash
# Progress to next status by organiser name (if only one ticket found)
sportshub leads progress --organiserName "syrio volleyball"

# Progress specific ticket to next status
sportshub leads progress --ticketNumber "SH-123"

# Set specific status
sportshub leads progress --ticketNumber "SH-123" --status "CONTACTED"

# Add meeting notes or file summary when progressing
sportshub leads progress --ticketNumber "SH-123" -f meeting-notes.txt
```

**Status progression order:**

1. OPPORTUNITY
2. CONTACTED
3. MEETING SCHEDULED
4. ONBOARDING
5. ONBOARDED
6. LOST (end status)

### Show All Active Leads

```bash
# Display all active leads grouped by status (excludes ONBOARDED and LOST)
sportshub leads show
```

### Example Output

**Creating a ticket:**

```
🎫 Creating Jira ticket...
Summary: New Lead: Maria
✅ Lead ticket created: SH-456
🔗 https://yourcompany.atlassian.net/browse/SH-456
```

**Searching for tickets:**

```
🔍 Searching for tickets...
Organiser: syrio volleyball

✅ Found 2 ticket(s):

1. SH-123
   Summary: New Lead: Syrio Volleyball Academy
   URL: https://yourcompany.atlassian.net/browse/SH-123

2. SH-456
   Summary: Follow-up: Syrio Volleyball Training Program
   URL: https://yourcompany.atlassian.net/browse/SH-456
```

**Progressing a ticket:**

```
🔍 Searching for tickets...
Organiser: syrio volleyball
✅ Found ticket: SH-123
📋 Processing ticket: SH-123
Current status: Opportunity
🔄 Transitioning to: CONTACTED
✅ Successfully transitioned to Contacted
🔗 https://yourcompany.atlassian.net/browse/SH-123
```

**Showing all active leads:**

```
📋 Fetching all lead tickets...

✅ Found 5 active lead(s):

🌱 OPPORTUNITY
─────────────
  1. SH-234
     Summary: New Lead: Basketball Academy
     URL: https://yourcompany.atlassian.net/browse/SH-234

  2. SH-567
     Summary: New Lead: Tennis Club
     URL: https://yourcompany.atlassian.net/browse/SH-567

📞 CONTACTED
────────────
  1. SH-123
     Summary: New Lead: Syrio Volleyball Academy
     URL: https://yourcompany.atlassian.net/browse/SH-123

📅 MEETING SCHEDULED
────────────────────
  1. SH-345
     Summary: New Lead: Soccer Training Center
     URL: https://yourcompany.atlassian.net/browse/SH-345

🚀 ONBOARDING
─────────────
  1. SH-678
     Summary: New Lead: Swimming Academy
     URL: https://yourcompany.atlassian.net/browse/SH-678
```

## Development

### Scripts

- `npm run build` - Compile TypeScript to JavaScript
- `npm run dev` - Run in development mode with ts-node
- `npm run clean` - Remove dist folder
- `npm run install-local` - Build and install locally

### Project Structure

```
src/
├── commands/
│   ├── configure.ts       # Configuration command
│   └── leads/
│       ├── create.ts      # Create lead tickets
│       ├── progress.ts    # Progress lead status
│       ├── search.ts      # Search lead tickets
│       └── show.ts        # Show all active leads
├── services/
│   ├── jira.ts           # Jira API integration
│   └── openrouter.ts     # AI-powered text summarization
├── types/
│   └── config.ts         # TypeScript type definitions
├── utils/
│   └── config.ts         # Configuration management
└── index.ts              # CLI entry point
```

## Error Handling

The CLI provides helpful error messages and suggestions:

- **401 Unauthorized**: Check credentials with `sportshub configure`
- **403 Forbidden**: Verify project permissions
- **404 Not Found**: Check Jira URL and project key

## Requirements

- Node.js 16.0.0 or higher
- Valid Jira account with API access
- Internet connection for Jira API calls

## Security

- Credentials are stored locally in `~/.config/sportshub-cli/`
- API tokens are used instead of passwords
- Configuration includes connection testing
