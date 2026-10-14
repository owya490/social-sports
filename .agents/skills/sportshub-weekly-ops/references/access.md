# Structured source access

API access and the new Vercel counters were live-tested on this account on
2026-10-12. Vercel's chosen usage route is undocumented; other accounts still
need their own permission and coverage check. Browser login does not establish
API/MCP access. No MCP server is required for the Python API helper. It does not configure
credentials, install tools, schedule work or publish reports.

## Local setup for any AI client

1. Use a checkout containing `.agents/skills/sportshub-weekly-ops/`. Read the
   repository's `AGENTS.md`. Python 3.10 or newer is required; Python 3.11
   matches CI. No pip packages, vendor SDKs, Vercel CLI, Grafana CLI or MCP
   server are needed for the API path. The examples use the repository's RTK
   wrapper; the Python scripts themselves do not depend on RTK. Follow the
   machine's agent instructions for command wrapping.
2. Check whether the operator already has appropriate credentials in their
   approved local secret setup. Ask for file locations only, not token values.
   If access must be created or expanded, pause for operator approval and
   assist with the following provider setup. Do not share Brian's personal
   credentials with other developers.
3. **Vercel:** Follow the [access token guide](https://vercel.com/kb/guide/how-do-i-use-a-vercel-api-access-token).
   In personal account settings, open Tokens and create a named token scoped
   to `compass-digitals-projects`, **All Projects**, with an expiration. A token
   limited to `social-sports` cannot supply the team total. The operator must
   belong to the team with a role permitted to read its usage. A team
   token can carry write privileges too; it is not inherently read-only. The
   helper uses only the two usage GET requests, not deployment or billing writes.
4. **Grafana:** Follow the [service account guide](https://grafana.com/docs/grafana/latest/administration/service-accounts/).
   In `compassdigitalgroup.grafana.net`, organization `1`, use Administration >
   Users and access > Service accounts. An authorized operator can create a
   named service account, assign Viewer or narrower read/query permissions,
   and generate an expiring token. It needs `datasources:read` and
   `datasources:query` for UID `grafanacloud-usage`, plus read access to the
   billing dashboard for reconciliation/MCP discovery. Check datasource
   permissions if Viewer is denied; do not automatically grant Editor/Admin.
   Use a **Grafana instance service account token**, not a Grafana Cloud access
   policy token for direct metrics ingestion/query endpoints.
5. Store each token as one line in a private local file outside the repository,
   for example `~/.config/sportshub-ops/vercel-token` and
   `~/.config/sportshub-ops/grafana-token`. Create the files through the operator's
   editor or secret manager; never put token literals in shell commands,
   prompts, screenshots or reports. On macOS/Linux, restrict the directory to
   mode `700` and the files to `600`; on Windows, use equivalent user-only file
   permissions. Keep expiration and rotation ownership in the secret manager.
6. Run the local preflight and request preview, then verify one completed week
   against the source contracts before attempting backfill or saving history.

```bash
rtk proxy python3 --version
rtk proxy python3 .agents/skills/sportshub-weekly-ops/scripts/fetch_usage.py preflight --vercel-token-file "$HOME/.config/sportshub-ops/vercel-token" --grafana-token-file "$HOME/.config/sportshub-ops/grafana-token"
rtk proxy python3 .agents/skills/sportshub-weekly-ops/scripts/fetch_usage.py plan --week 2026-09-28
```

Preflight checks token availability/readability without network access or
printing values. It does not establish vendor permissions or metric coverage.
If anything required is missing, follow the skill's access and coverage gate:
try existing authorized access, prompt with the specific remedy, and wait.
Do not generate an empty report or silently continue other collection steps.

Token-file flags work even when the AI process did not inherit newly exported
environment variables. On Windows, replace the example `$HOME` paths with
the operator's local file paths and invoke Python using the installed launcher.

## Direct API collection

Run from the repository root:

```bash
rtk proxy python3 .agents/skills/sportshub-weekly-ops/scripts/fetch_usage.py plan --week 2026-09-28
```

`plan` prints credential-free URLs and the exact Grafana query body without
network access. Fetch commands use the same completed Monday-to-Monday UTC
interval. Use the explicit token-file flags below, or credentials already
provided through `VERCEL_TOKEN` and `GRAFANA_SERVICE_ACCOUNT_TOKEN` or their
corresponding `*_FILE` variables. Explicit file flags take precedence. Token
values are never command arguments; only file paths are passed to the helper.

```bash
rtk proxy python3 .agents/skills/sportshub-weekly-ops/scripts/fetch_usage.py vercel --week 2026-09-28 --vercel-token-file "$HOME/.config/sportshub-ops/vercel-token" --output .tmp/ops-2026-09-28-vercel.json
rtk proxy python3 .agents/skills/sportshub-weekly-ops/scripts/fetch_usage.py grafana --week 2026-09-28 --grafana-token-file "$HOME/.config/sportshub-ops/grafana-token" --output .tmp/ops-2026-09-28-grafana.json
```

Vercel fetches team and project independently. Grafana first reads the billing
dashboard metadata and verifies daily panel 95, then queries that definition.
The helper rejects redirects, malformed responses, changed panel definitions,
query errors and existing output files. Evidence bundles include credential-free
requests, responses and capture times. They stay in `.tmp/` and are not history.

Normalize both bundles locally, then inspect the draft and coverage:

```bash
rtk proxy python3 .agents/skills/sportshub-weekly-ops/scripts/normalize_usage.py --week 2026-09-28 --vercel .tmp/ops-2026-09-28-vercel.json --grafana .tmp/ops-2026-09-28-grafana.json --output .tmp/ops-2026-09-28-input.json
```

Normalization validates request provenance, daily coverage, units and panel
semantics before producing a schema 2 draft. It never saves history or replaces
existing output. `--allow-missing-grafana` is only for an explicitly approved
Grafana daily-coverage gap: it leaves that whole measurement null/missing and
keeps it out of comparisons. It does not bypass changed queries or schemas.
After a transient failure,
retry once; for denied access, unsupported routes or repeated failures, pause
and prompt for the required setup or an explicit decision about partial coverage.

| Symptom | Next step |
| --- | --- |
| Missing Python or skill files | Help the operator install a supported Python or obtain the correct checkout, then rerun preflight. |
| Missing/unreadable token file | Ask for its local path or guide approved token setup. Do not print the file. |
| HTTP 401/403 | Check expiration, team/org scope and usage/dashboard/datasource permissions with the operator. |
| Grafana HTTP 404/410 | Verify the supported query route in current vendor documentation; `/api` routes are being deprecated. |
| Vercel 404, changed schema, missing fields/days or non-daily granularity | The undocumented usage source may have changed or lack coverage; investigate and prompt, never assume zero or retry via the billing CLI/MCP. |
| Missing/null Grafana app/day buckets | Explain the affected coverage and wait for a decision; the fallback zero series does not fill those gaps. |

## Using the skill in another AI

Clients that discover repository `.agents/skills` can invoke
`$sportshub-weekly-ops`. For a client without that discovery convention, give
it the repository path and ask it to read the entrypoint explicitly:

```text
Read AGENTS.md and .agents/skills/sportshub-weekly-ops/SKILL.md in this checkout.
Follow that skill to prepare the last completed UTC week's report using the
local API helper. My token files are ~/.config/sportshub-ops/vercel-token and
~/.config/sportshub-ops/grafana-token. If access or required data is missing,
help me set it up and wait for my response. Leave changes uncommitted.
```

Provide only actual local paths. Each AI runtime needs filesystem access to
those files and HTTPS access to `api.vercel.com` and
`compassdigitalgroup.grafana.net`. A remote/cloud agent cannot read token files
on a developer's laptop; configure that runtime's approved secret mechanism
separately. Do not upload local token files as chat attachments.

## Official Grafana MCP alternative

| Source | Connection | Retrieval tools |
| --- | --- | --- |
| Grafana | Official `grafana/mcp-grafana` server pointed at `https://compassdigitalgroup.grafana.net` | `get_dashboard_panel_queries`, `run_panel_query`, or `query_prometheus` |

Follow [Grafana's server instructions](https://github.com/grafana/mcp-grafana) when
setup is requested. Pin the local Grafana server version at setup. Configure
`GRAFANA_URL`, `GRAFANA_ORG_ID=1` and a
[service account token](https://grafana.com/docs/grafana/latest/developer-resources/mcp/configure/authentication/)
with the dashboard read and datasource read/query permissions needed for the
billing usage datasource. Prefer a token file through
`GRAFANA_SERVICE_ACCOUNT_TOKEN_FILE`. Do not request Editor/Admin just to read
this report. New credentials or OAuth grants require operator approval.

For Grafana, enable only the needed categories and disable writes:

```bash
rtk proxy mcp-grafana --disable-write --enabled-tools dashboard,datasource,prometheus,runpanelquery
```

`runpanelquery` is not enabled by default in the currently documented server.
Do not use `--disable-query`, which disables the queries this report needs.
Inspect the connected tool schema before calling it: installed versions may
differ from the current documentation. Vercel's official MCP billing tool is
not an alternative for the accepted usage counters; see [vercel.md](vercel.md).

Keep the API's measurement definition, dates, filters,
query and aggregation when using MCP; record `method: "mcp"` and the underlying
vendor dashboard/API permalink. Do not store the MCP server URL as the source.
