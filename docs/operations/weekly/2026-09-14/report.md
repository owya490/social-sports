# SPORTSHUB weekly operations - 2026-09-14

Period: 2026-09-14T00:00:00Z inclusive to 2026-09-21T00:00:00Z exclusive.

**Coverage:** 12 of 13 measurements are complete. Grafana preview buckets are missing for September 17-19. The whole Grafana total remains missing, with operator approval.

## First comparable baseline

SPORTSHUB recorded 151,934 API requests and 28,830 API function invocations. The combined function errors + timeouts + throttles counter was 22.

This is the first week in the backfill batch. No earlier comparable snapshot is available. These values establish a baseline; they do not show whether activity increased or decreased.

## Key metrics

| Measurement | This week |
| --- | --- |
| SPORTSHUB API requests | 151,934 |
| SPORTSHUB API function invocations | 28,830 |
| SPORTSHUB API function execution | 1.070 GB-hours |
| SPORTSHUB API outgoing bandwidth | 1.640 GB |
| Team API outgoing bandwidth | 3.703 GB |

Team totals include SPORTSHUB. Keep the two scopes separate when reviewing resource use.

## History and source limits

The previous-week comparison and four-week pattern are unavailable. Only one of the four calendar weeks has a snapshot. Later backfilled weeks are not a baseline for this report.

Grafana covers preview and production frontend apps. Missing preview buckets prevent a complete session estimate. They do not prove zero sessions or a tracking failure.

Vercel uses undocumented API counters. They are not verified equivalents of the original CDN, Fast Transfer or ISR dashboard metrics. This baseline must retain its API definitions for later comparisons.

The function counters do not identify affected functions, causes or user impact. These usage totals alone do not establish service reliability or business health.

## Next action

Check why Grafana preview data is absent before interpreting session changes or filling the gap. Collect the next completed UTC week with the same definitions.

[Full measurements and source details](snapshot.json)

Generated with AI assistance.
