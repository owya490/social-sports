# SPORTSHUB weekly operations - 2026-09-14

Period: 2026-09-14T00:00:00Z inclusive to 2026-09-21T00:00:00Z exclusive.
Captured: 2026-10-12T11:40:04.249696Z. Reporting timezone: UTC.

## Assessment

- **Partial coverage:** Vercel counters are complete. Grafana's preview app lacks daily values for September 17-19; the whole Grafana total is missing, with operator approval. Missing values are not zero.
- SPORTSHUB recorded 151,934 API requests, 1.64038 GB of API outgoing bandwidth and 28,830 API function invocations. The combined function error, timeout and throttle counter was 22.
- This is the first week in this backfill batch; no earlier comparable snapshot is available. These API counters establish a new baseline and do not reproduce the original Vercel dashboard metric set.
- Follow up on Grafana preview data coverage before interpreting session changes. Usage counters alone do not establish service reliability or business health.

## Coverage

12/13 measurements complete. Missing, partial and stale data are not zero.
Vercel uses undocumented API counters, not verified equivalents of CDN/Fast Transfer/ISR metrics.
Vercel team totals already include SPORTSHUB; do not add them together.
Previous calendar week: 2026-09-07. Trend window: 4 calendar weeks including this week.

## Weekly changes

| Measurement | This week | Previous week | Change | Status |
| --- | --- | --- | --- | --- |
| Vercel CDG - API requests (hits + misses) | 153,486 count | N/A | N/A | complete |
| Vercel CDG - API incoming bandwidth | 0.231257 GB | N/A | N/A | complete |
| Vercel CDG - API outgoing bandwidth | 3.70287 GB | N/A | N/A | complete |
| Vercel CDG - API function invocations (all outcomes) | 28,830 count | N/A | N/A | complete |
| Vercel CDG - API function errors + timeouts + throttles | 22 count | N/A | N/A | complete |
| Vercel CDG - API function execution | 1.07045 GB-hours | N/A | N/A | complete |
| Vercel SPORTSHUB - API requests (hits + misses) | 151,934 count | N/A | N/A | complete |
| Vercel SPORTSHUB - API incoming bandwidth | 0.229531 GB | N/A | N/A | complete |
| Vercel SPORTSHUB - API outgoing bandwidth | 1.64038 GB | N/A | N/A | complete |
| Vercel SPORTSHUB - API function invocations (all outcomes) | 28,830 count | N/A | N/A | complete |
| Vercel SPORTSHUB - API function errors + timeouts + throttles | 22 count | N/A | N/A | complete |
| Vercel SPORTSHUB - API function execution | 1.07045 GB-hours | N/A | N/A | complete |
| Grafana frontend sessions | N/A | N/A | N/A | missing |

## 4-week history

Week order: 2026-08-24 -> 2026-08-31 -> 2026-09-07 -> 2026-09-14.

| Measurement | Comparable values, oldest to newest | Window change |
| --- | --- | --- |
| Vercel CDG - API requests (hits + misses) | N/A -> N/A -> N/A -> 153,486 | N/A (1/4 comparable weeks) |
| Vercel CDG - API incoming bandwidth | N/A -> N/A -> N/A -> 0.231257 | N/A (1/4 comparable weeks) |
| Vercel CDG - API outgoing bandwidth | N/A -> N/A -> N/A -> 3.70287 | N/A (1/4 comparable weeks) |
| Vercel CDG - API function invocations (all outcomes) | N/A -> N/A -> N/A -> 28,830 | N/A (1/4 comparable weeks) |
| Vercel CDG - API function errors + timeouts + throttles | N/A -> N/A -> N/A -> 22 | N/A (1/4 comparable weeks) |
| Vercel CDG - API function execution | N/A -> N/A -> N/A -> 1.07045 | N/A (1/4 comparable weeks) |
| Vercel SPORTSHUB - API requests (hits + misses) | N/A -> N/A -> N/A -> 151,934 | N/A (1/4 comparable weeks) |
| Vercel SPORTSHUB - API incoming bandwidth | N/A -> N/A -> N/A -> 0.229531 | N/A (1/4 comparable weeks) |
| Vercel SPORTSHUB - API outgoing bandwidth | N/A -> N/A -> N/A -> 1.64038 | N/A (1/4 comparable weeks) |
| Vercel SPORTSHUB - API function invocations (all outcomes) | N/A -> N/A -> N/A -> 28,830 | N/A (1/4 comparable weeks) |
| Vercel SPORTSHUB - API function errors + timeouts + throttles | N/A -> N/A -> N/A -> 22 | N/A (1/4 comparable weeks) |
| Vercel SPORTSHUB - API function execution | N/A -> N/A -> N/A -> 1.07045 | N/A (1/4 comparable weeks) |
| Grafana frontend sessions | N/A -> N/A -> N/A -> N/A | N/A (0/4 comparable weeks) |

N/A comparisons indicate absent/incomplete data or a scope, unit or definition change.
Window change compares first and last weeks only; it does not establish a sustained trend.
Tables use up to six significant digits; snapshots preserve source precision.

## Sources and collection notes

- Vercel CDG - API requests (hits + misses): https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:all-projects; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(request_hit_count, request_miss_count). Bytes / 1,000,000,000 for decimal GB; source lastUpdate 2026-10-12T11:40:03.077000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel CDG - API incoming bandwidth: https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:all-projects; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(bandwidth_incoming_bytes). Bytes / 1,000,000,000 for decimal GB; source lastUpdate 2026-10-12T11:40:03.077000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel CDG - API outgoing bandwidth: https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:all-projects; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(bandwidth_outgoing_bytes). Bytes / 1,000,000,000 for decimal GB; source lastUpdate 2026-10-12T11:40:03.077000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel CDG - API function invocations (all outcomes): https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:all-projects; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(function_invocation_successful_count, function_invocation_error_count, function_invocation_timeout_count, function_invocation_throttle_count). Bytes / 1,000,000,000 for decimal GB; source lastUpdate 2026-10-12T11:40:03.077000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel CDG - API function errors + timeouts + throttles: https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:all-projects; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(function_invocation_error_count, function_invocation_timeout_count, function_invocation_throttle_count). Bytes / 1,000,000,000 for decimal GB; source lastUpdate 2026-10-12T11:40:03.077000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel CDG - API function execution: https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:all-projects; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(function_execution_successful_gb_hours, function_execution_error_gb_hours, function_execution_timeout_gb_hours). Bytes / 1,000,000,000 for decimal GB; source lastUpdate 2026-10-12T11:40:03.077000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel SPORTSHUB - API requests (hits + misses): https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:prj_M871BOaWTRTkX8FKcUvusXpWAqXx; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(request_hit_count, request_miss_count). Bytes / 1,000,000,000 for decimal GB; source lastUpdate 2026-10-12T11:40:04.156000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel SPORTSHUB - API incoming bandwidth: https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:prj_M871BOaWTRTkX8FKcUvusXpWAqXx; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(bandwidth_incoming_bytes). Bytes / 1,000,000,000 for decimal GB; source lastUpdate 2026-10-12T11:40:04.156000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel SPORTSHUB - API outgoing bandwidth: https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:prj_M871BOaWTRTkX8FKcUvusXpWAqXx; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(bandwidth_outgoing_bytes). Bytes / 1,000,000,000 for decimal GB; source lastUpdate 2026-10-12T11:40:04.156000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel SPORTSHUB - API function invocations (all outcomes): https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:prj_M871BOaWTRTkX8FKcUvusXpWAqXx; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(function_invocation_successful_count, function_invocation_error_count, function_invocation_timeout_count, function_invocation_throttle_count). Bytes / 1,000,000,000 for decimal GB; source lastUpdate 2026-10-12T11:40:04.156000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel SPORTSHUB - API function errors + timeouts + throttles: https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:prj_M871BOaWTRTkX8FKcUvusXpWAqXx; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(function_invocation_error_count, function_invocation_timeout_count, function_invocation_throttle_count). Bytes / 1,000,000,000 for decimal GB; source lastUpdate 2026-10-12T11:40:04.156000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel SPORTSHUB - API function execution: https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:prj_M871BOaWTRTkX8FKcUvusXpWAqXx; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(function_execution_successful_gb_hours, function_execution_error_gb_hours, function_execution_timeout_gb_hours). Bytes / 1,000,000,000 for decimal GB; source lastUpdate 2026-10-12T11:40:04.156000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Grafana frontend sessions: https://compassdigitalgroup.grafana.net/d/dfa75f92-b104-48e6-ba78-cf4fc950ae9a/grafana-cloud-billing-usage (api); scope: compassdigitalgroup:all-frontend-apps; definition: unverified; Operator approved missing Grafana coverage. Grafana [Preview] Sports Hub: missing/null daily buckets: 2026-09-17, 2026-09-18, 2026-09-19. The fallback zero series does not fill these gaps.

Generated with AI assistance.
