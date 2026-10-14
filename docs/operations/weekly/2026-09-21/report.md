# SPORTSHUB weekly operations - 2026-09-21

Period: 2026-09-21T00:00:00Z inclusive to 2026-09-28T00:00:00Z exclusive.
Captured: 2026-10-12T11:40:04.795734Z. Reporting timezone: UTC.

## Assessment

- **Partial coverage:** Vercel counters are complete. Grafana's preview app lacks daily values for September 22 and 25-27; the whole Grafana total is missing, with operator approval. Session comparisons are unavailable.
- SPORTSHUB API requests decreased from 151,934 to 149,459 (-1.6%). API outgoing bandwidth increased from 1.64038 to 1.74843 GB (+6.6%). These are different resource counters and can move in different directions.
- The combined function error, timeout and throttle counter increased from 22 to 41 while invocations decreased from 28,830 to 27,975. Inspect function error logs if the increase persists; these counts do not identify a cause.
- Two weeks are available in the backfill batch. A four-week trend is not yet established.

## Coverage

12/13 measurements complete. Missing, partial and stale data are not zero.
Vercel uses undocumented API counters, not verified equivalents of CDN/Fast Transfer/ISR metrics.
Vercel team totals already include SPORTSHUB; do not add them together.
Previous calendar week: 2026-09-14. Trend window: 4 calendar weeks including this week.

## Weekly changes

| Measurement | This week | Previous week | Change | Status |
| --- | --- | --- | --- | --- |
| Vercel CDG - API requests (hits + misses) | 151,512 count | 153,486 count | -1,974 count (-1.3%) | complete |
| Vercel CDG - API incoming bandwidth | 0.226727 GB | 0.231257 GB | -0.00452993 GB (-2.0%) | complete |
| Vercel CDG - API outgoing bandwidth | 3.4325 GB | 3.70287 GB | -0.270367 GB (-7.3%) | complete |
| Vercel CDG - API function invocations (all outcomes) | 27,975 count | 28,830 count | -855 count (-3.0%) | complete |
| Vercel CDG - API function errors + timeouts + throttles | 41 count | 22 count | +19 count (+86.4%) | complete |
| Vercel CDG - API function execution | 1.14965 GB-hours | 1.07045 GB-hours | +0.0792021 GB-hours (+7.4%) | complete |
| Vercel SPORTSHUB - API requests (hits + misses) | 149,459 count | 151,934 count | -2,475 count (-1.6%) | complete |
| Vercel SPORTSHUB - API incoming bandwidth | 0.224636 GB | 0.229531 GB | -0.00489508 GB (-2.1%) | complete |
| Vercel SPORTSHUB - API outgoing bandwidth | 1.74843 GB | 1.64038 GB | +0.108048 GB (+6.6%) | complete |
| Vercel SPORTSHUB - API function invocations (all outcomes) | 27,975 count | 28,830 count | -855 count (-3.0%) | complete |
| Vercel SPORTSHUB - API function errors + timeouts + throttles | 41 count | 22 count | +19 count (+86.4%) | complete |
| Vercel SPORTSHUB - API function execution | 1.14965 GB-hours | 1.07045 GB-hours | +0.0792021 GB-hours (+7.4%) | complete |
| Grafana frontend sessions | N/A | N/A | N/A | missing |

## 4-week history

Week order: 2026-08-31 -> 2026-09-07 -> 2026-09-14 -> 2026-09-21.

| Measurement | Comparable values, oldest to newest | Window change |
| --- | --- | --- |
| Vercel CDG - API requests (hits + misses) | N/A -> N/A -> 153,486 -> 151,512 | N/A (2/4 comparable weeks) |
| Vercel CDG - API incoming bandwidth | N/A -> N/A -> 0.231257 -> 0.226727 | N/A (2/4 comparable weeks) |
| Vercel CDG - API outgoing bandwidth | N/A -> N/A -> 3.70287 -> 3.4325 | N/A (2/4 comparable weeks) |
| Vercel CDG - API function invocations (all outcomes) | N/A -> N/A -> 28,830 -> 27,975 | N/A (2/4 comparable weeks) |
| Vercel CDG - API function errors + timeouts + throttles | N/A -> N/A -> 22 -> 41 | N/A (2/4 comparable weeks) |
| Vercel CDG - API function execution | N/A -> N/A -> 1.07045 -> 1.14965 | N/A (2/4 comparable weeks) |
| Vercel SPORTSHUB - API requests (hits + misses) | N/A -> N/A -> 151,934 -> 149,459 | N/A (2/4 comparable weeks) |
| Vercel SPORTSHUB - API incoming bandwidth | N/A -> N/A -> 0.229531 -> 0.224636 | N/A (2/4 comparable weeks) |
| Vercel SPORTSHUB - API outgoing bandwidth | N/A -> N/A -> 1.64038 -> 1.74843 | N/A (2/4 comparable weeks) |
| Vercel SPORTSHUB - API function invocations (all outcomes) | N/A -> N/A -> 28,830 -> 27,975 | N/A (2/4 comparable weeks) |
| Vercel SPORTSHUB - API function errors + timeouts + throttles | N/A -> N/A -> 22 -> 41 | N/A (2/4 comparable weeks) |
| Vercel SPORTSHUB - API function execution | N/A -> N/A -> 1.07045 -> 1.14965 | N/A (2/4 comparable weeks) |
| Grafana frontend sessions | N/A -> N/A -> N/A -> N/A | N/A (0/4 comparable weeks) |

N/A comparisons indicate absent/incomplete data or a scope, unit or definition change.
Window change compares first and last weeks only; it does not establish a sustained trend.
Tables use up to six significant digits; snapshots preserve source precision.

## Sources and collection notes

- Vercel CDG - API requests (hits + misses): https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:all-projects; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(request_hit_count, request_miss_count). source lastUpdate 2026-10-12T11:40:03.456000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel CDG - API incoming bandwidth: https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:all-projects; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(bandwidth_incoming_bytes). Bytes / 1,000,000,000 for decimal GB; source lastUpdate 2026-10-12T11:40:03.456000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel CDG - API outgoing bandwidth: https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:all-projects; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(bandwidth_outgoing_bytes). Bytes / 1,000,000,000 for decimal GB; source lastUpdate 2026-10-12T11:40:03.456000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel CDG - API function invocations (all outcomes): https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:all-projects; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(function_invocation_successful_count, function_invocation_error_count, function_invocation_timeout_count, function_invocation_throttle_count). source lastUpdate 2026-10-12T11:40:03.456000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel CDG - API function errors + timeouts + throttles: https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:all-projects; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(function_invocation_error_count, function_invocation_timeout_count, function_invocation_throttle_count). source lastUpdate 2026-10-12T11:40:03.456000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel CDG - API function execution: https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:all-projects; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(function_execution_successful_gb_hours, function_execution_error_gb_hours, function_execution_timeout_gb_hours). source lastUpdate 2026-10-12T11:40:03.456000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel SPORTSHUB - API requests (hits + misses): https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:prj_M871BOaWTRTkX8FKcUvusXpWAqXx; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(request_hit_count, request_miss_count). source lastUpdate 2026-10-12T11:40:04.331000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel SPORTSHUB - API incoming bandwidth: https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:prj_M871BOaWTRTkX8FKcUvusXpWAqXx; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(bandwidth_incoming_bytes). Bytes / 1,000,000,000 for decimal GB; source lastUpdate 2026-10-12T11:40:04.331000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel SPORTSHUB - API outgoing bandwidth: https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:prj_M871BOaWTRTkX8FKcUvusXpWAqXx; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(bandwidth_outgoing_bytes). Bytes / 1,000,000,000 for decimal GB; source lastUpdate 2026-10-12T11:40:04.331000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel SPORTSHUB - API function invocations (all outcomes): https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:prj_M871BOaWTRTkX8FKcUvusXpWAqXx; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(function_invocation_successful_count, function_invocation_error_count, function_invocation_timeout_count, function_invocation_throttle_count). source lastUpdate 2026-10-12T11:40:04.331000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel SPORTSHUB - API function errors + timeouts + throttles: https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:prj_M871BOaWTRTkX8FKcUvusXpWAqXx; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(function_invocation_error_count, function_invocation_timeout_count, function_invocation_throttle_count). source lastUpdate 2026-10-12T11:40:04.331000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Vercel SPORTSHUB - API function execution: https://api.vercel.com/v2/usage (api); scope: compass-digitals-projects:prj_M871BOaWTRTkX8FKcUvusXpWAqXx; definition: vercel-usage-v2-counters-v1; Seven UTC daily buckets; sum(function_execution_successful_gb_hours, function_execution_error_gb_hours, function_execution_timeout_gb_hours). source lastUpdate 2026-10-12T11:40:04.331000Z. Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics.
- Grafana frontend sessions: https://compassdigitalgroup.grafana.net/d/dfa75f92-b104-48e6-ba78-cf4fc950ae9a/grafana-cloud-billing-usage (api); scope: compassdigitalgroup:all-frontend-apps; definition: unverified; Operator approved missing Grafana coverage. Grafana [Preview] Sports Hub: missing/null daily buckets: 2026-09-22, 2026-09-25, 2026-09-26, 2026-09-27. The fallback zero series does not fill these gaps.

Generated with AI assistance.
