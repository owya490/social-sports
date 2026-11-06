# SPORTSHUB weekly operations - 2026-09-28

Period: 2026-09-28T00:00:00Z inclusive to 2026-10-05T00:00:00Z exclusive.

**Coverage:** 12 of 13 measurements are complete. Grafana preview buckets are missing for September 29-October 4. The whole Grafana total remains missing, with operator approval.

## Priority: function failures increased again

SPORTSHUB API function errors + timeouts + throttles increased from 41 to 46 (+5; +12.2%). Function invocations increased by 3,922 (+14.0%).

The three available weekly failure counts are **22 -> 41 -> 46**. The combined counter increased in both comparisons. It does not identify affected functions, causes or user impact.

## Key metrics

| Measurement | This week | Previous week | Change |
| --- | --- | --- | --- |
| SPORTSHUB API requests | 154,167 | 149,459 | +3.2% |
| SPORTSHUB API function invocations | 31,897 | 27,975 | +14.0% |
| SPORTSHUB API function execution | 1.218 GB-hours | 1.150 GB-hours | +5.9% |
| SPORTSHUB API outgoing bandwidth | 1.529 GB | 1.748 GB | -12.6% |
| Team API outgoing bandwidth | 3.022 GB | 3.433 GB | -12.0% |

## Available history

Three of the four calendar weeks have comparable Vercel snapshots. A complete four-week comparison is unavailable.

Team outgoing bandwidth decreased in both weekly comparisons: 3.703 -> 3.433 -> 3.022 GB. The total decrease was 0.681 GB (-18.4%). Team totals include SPORTSHUB.

SPORTSHUB requests decreased in the second week, then increased this week. Its outgoing bandwidth moved in the opposite direction. These three weeks do not show a steady change in SPORTSHUB activity.

Function execution increased less than invocation count this week. These totals cannot identify which functions account for that difference.

## Grafana and source limits

Grafana includes preview and production apps. All three available weeks lack complete preview coverage, so no valid session comparison is available. Missing data is not zero.

Vercel uses undocumented API counters, not verified equivalents of the original CDN, Fast Transfer or ISR dashboard metrics.

## Next actions

1. Review function error logs and deployments for September 28-October 4. Check the repeated increase and whether user requests failed.
2. Determine why Grafana preview buckets are absent before filling the gaps.

[Full measurements and source details](snapshot.json) | [Previous week](../2026-09-21/snapshot.json)

Generated with AI assistance.
