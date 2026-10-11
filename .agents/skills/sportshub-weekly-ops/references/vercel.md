# Vercel retrieval

## Accounts and measurements

- Team: `compass-digitals-projects`.
- Project: `social-sports`, project ID `prj_M871BOaWTRTkX8FKcUvusXpWAqXx`.
- Team dashboard: <https://vercel.com/compass-digitals-projects/~/usage>.
- Project dashboard: <https://vercel.com/compass-digitals-projects/social-sports/usage>.

Collect Fast Data Transfer (decimal GB), Fast Origin Transfer (decimal GB),
Edge Requests (count), Edge Request CPU Duration (seconds), and ISR Reads
(count), separately for the team and project. Do not add legacy "Bandwidth" as
another measurement of Fast Data Transfer.

The originally supplied team URL contains a project filter and old fixed dates.
Start from the clean URL above: confirm **all projects** for the team and only
`social-sports` for the project. Set both to the same explicit UTC interval.
Do not trust `range=last-7-days` when fixed timestamps are also present.

## Official API or CLI

Verified against official documentation on 2026-10-11:

- [FOCUS billing charges API](https://vercel.com/docs/rest-api/billing/list-focus-billing-charges)
  exposes `GET https://api.vercel.com/v1/billing/charges` with `slug`, `from`
  (inclusive UTC ISO timestamp) and `to` (exclusive UTC ISO timestamp).
  It returns JSONL charge records with consumption units and project tags.
- [Official usage CLI](https://vercel.com/docs/cli/usage) accepts `--since`,
  `--until`, `--breakdown daily` and `--format json`. Inspect the installed
  command's help first. Date-only CLI arguments use Pacific boundaries; pass
  complete UTC ISO timestamps. Older `--from`/`--to` flags are deprecated.

Use existing authenticated tooling; do not print tokens, install a CLI or
create credentials just to attempt collection. For a CLI already available:

```bash
rtk proxy vercel usage --scope compass-digitals-projects --since 2026-09-28T00:00:00Z --until 2026-10-05T00:00:00Z --format json > .tmp/vercel-usage.json
```

For the API, construct the query with the requested week's exact timestamps
and team slug. Use an existing secret supplied through the tool's supported
authentication mechanism. Keep the response in `.tmp/`, not in history.

Before mapping billing records to dashboard measurements:

- Confirm the account actually exposes free/included consumption, not just paid
  charges. Empty charge results do not prove zero usage on a Hobby account.
- Inspect actual `ServiceName`, `SkuId`, `ConsumedQuantity`, `ConsumedUnit`,
  charge category and project tag keys. Do not hardcode guessed SKU/tag names.
- Use consumption quantities, not pricing quantities, USD or legacy MIUs.
  Do not add monetary adjustments/credits to resource counts.
- Restrict project data by the verified project ID tag; include unallocated
  consumption in team totals where appropriate. A CLI team summary without
  project tags cannot supply project totals.
- Verify each record's charge interval is wholly inside the requested week.
  Use daily consumption once per bucket; do not prorate cross-boundary charges
  or sum both totals and their component rows.
- Reconcile the first API/CLI mapping against the dashboard for the same
  scope and week. If metric coverage or units differ, use the browser for that
  measurement and disclose the limitation.

## Authenticated browser fallback

Open the two dashboards, select explicit dates and confirm scope and timezone.
For a UI whose end is inclusive, select Sunday 23:59:59.999 UTC; the saved
interval still ends at the following Monday 00:00 UTC exclusively. Verify the
rendered dates rather than assuming query parameters were honored. Prefer
table/detail exports over rounded cards when available. Never read hidden
application state or extract browser authentication tokens.

Normalize decimal MB / 1,000 to GB, bytes / 1,000,000,000 to GB, and K counts
times 1,000. Confirm the displayed units before conversion; GiB and GB differ.
If a card is rounded, retain that precision and mention it in `notes`.

Use definition `weekly-consumption-v1` only for reconciled measurements with
the same meaning. If a source/query/filter change alters meaning, change
`definition` and retain the old snapshots. Retrieval method alone need not
break comparison when the measurements have been reconciled.
