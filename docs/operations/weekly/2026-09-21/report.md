# SPORTSHUB weekly operations - 2026-09-21

Period: 2026-09-21T00:00:00Z inclusive to 2026-09-28T00:00:00Z exclusive.

**Coverage:** 12 of 13 measurements are complete. Grafana preview buckets are missing for September 22 and 25-27. The whole Grafana total remains missing, with operator approval.

## Priority: function failures increased

SPORTSHUB API function errors + timeouts + throttles increased from 22 to 41 (+19; +86.4%). Function invocations decreased by 855 (-3.0%).

The percentage increase starts from a small baseline. The absolute increase is 19 unsuccessful outcomes. The counters do not identify affected functions, the cause or user impact.

## Key metrics

| Measurement | This week | Previous week | Change |
| --- | --- | --- | --- |
| SPORTSHUB API requests | 149,459 | 151,934 | -1.6% |
| SPORTSHUB API function invocations | 27,975 | 28,830 | -3.0% |
| SPORTSHUB API function execution | 1.150 GB-hours | 1.070 GB-hours | +7.4% |
| SPORTSHUB API outgoing bandwidth | 1.748 GB | 1.640 GB | +6.6% |
| Team API outgoing bandwidth | 3.433 GB | 3.703 GB | -7.3% |

## Available history

Two of the four calendar weeks have comparable Vercel snapshots. One weekly comparison does not establish a four-week trend.

SPORTSHUB function execution increased while invocations decreased. The totals do not show whether a change in function mix or execution time caused this difference.

Team outgoing bandwidth decreased by 0.270 GB, while SPORTSHUB outgoing bandwidth increased by 0.108 GB. Team totals include SPORTSHUB; the scopes show different weekly changes.

## Grafana and source limits

Grafana includes preview and production apps. Preview coverage is incomplete in both available weeks, so there is no valid session comparison. Missing data is not zero.

Vercel uses undocumented API counters, not verified equivalents of the original CDN, Fast Transfer or ISR dashboard metrics. Usage alone does not prove reliability.

## Next actions

1. Review function error logs and deployments for September 21-27. Check whether the additional unsuccessful outcomes affected user requests.
2. Determine why Grafana preview buckets are absent before filling the gaps.

[Full measurements and source details](snapshot.json) | [Previous week](../2026-09-14/snapshot.json)

Generated with AI assistance.
