# SPORTSHUB weekly operations - 2026-10-05

Period: 2026-10-05T00:00:00Z inclusive to 2026-10-12T00:00:00Z exclusive.

**Coverage:** All 13 current measurements are complete. Comparisons use four API-collected snapshots. Grafana history is incomplete.

## Priority: function failures increased

SPORTSHUB API function errors + timeouts + throttles increased from 46 to 105 (+59; +128.3%). Function invocations decreased by 4,930 (-15.5%) over the same period.

The four-week failure counts are **22 -> 41 -> 46 -> 105**. This is the third consecutive weekly increase.

The counters do not identify affected functions, the cause, or user impact.

## Key metrics

| Measurement | This week | Previous week | Change |
| --- | --- | --- | --- |
| SPORTSHUB API requests | 133,474 | 154,167 | -13.4% |
| SPORTSHUB API function invocations | 26,967 | 31,897 | -15.5% |
| SPORTSHUB API function execution | 1.144 GB-hours | 1.218 GB-hours | -6.1% |
| SPORTSHUB API outgoing bandwidth | 1.362 GB | 1.529 GB | -10.9% |
| Team API outgoing bandwidth | 2.854 GB | 3.022 GB | -5.6% |
| Grafana frontend observability sessions (estimate) | 2,546.15 | Missing | N/A |

## Four-week context

SPORTSHUB request counts fluctuated before this week's decrease. The four weeks do not show a steady decrease in requests.

Team API outgoing bandwidth decreased in each weekly comparison, by 0.849 GB (-22.9%) overall. SPORTSHUB outgoing bandwidth increased in the second week, then decreased in the last two weeks. Team totals include SPORTSHUB.

Function execution decreased less than invocation count this week. These totals do not show which functions account for the difference.

## Grafana and source limits

Grafana includes preview and production apps. Preview daily buckets are missing in the preceding three weeks. No valid Grafana weekly or four-week comparison is available. Missing data is not zero.

Vercel uses undocumented API counters. They are not verified equivalents of the original CDN, Fast Transfer or ISR dashboard metrics.

## Next actions

1. Review SPORTSHUB function error logs and deployments for October 5-11. Identify affected functions and verify whether user requests failed.
2. Determine whether Grafana's absent preview buckets reflect no sessions or unavailable historical data before filling the gaps.

[Full measurements and source details](snapshot.json) | [Previous week](../2026-09-28/snapshot.json)

Generated with AI assistance.
