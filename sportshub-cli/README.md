# Sportshub CLI

A CLI tool for Sportshub Leads to quickly create Jira tickets related to new leads.

## Features

- 🔐 Secure credential management
- 🎫 Quick Jira ticket creation
- ✅ Input validation and error handling
- 🌐 Automatic website URL formatting
- 📱 Beautiful terminal interface

## Installation

### Local Installation

1. Clone or copy the sportshub-cli directory
2. Navigate to the directory:
   ```bash
   cd sportshub-cli
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Build and link globally:
   ```bash
   npm run install-local
   ```

The CLI will now be available globally as `sportshub`.

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

### Example Output

```
🎫 Creating Jira ticket...
Summary: New Lead: Maria
✅ Lead ticket created: SH-456
🔗 https://yourcompany.atlassian.net/browse/SH-456
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
│   ├── configure.ts    # Configuration command
│   └── leads.ts        # Leads management commands
├── services/
│   └── jira.ts         # Jira API integration
├── types/
│   └── config.ts       # TypeScript type definitions
├── utils/
│   └── config.ts       # Configuration management
└── index.ts            # CLI entry point
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
