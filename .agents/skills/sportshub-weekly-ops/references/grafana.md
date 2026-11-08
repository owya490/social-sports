# Grafana retrieval

Dashboard:
<https://compassdigitalgroup.grafana.net/d/dfa75f92-b104-48e6-ba78-cf4fc950ae9a/grafana-cloud-billing-usage>.

Organization slug: `compassdigitalgroup`; dashboard organization selector:
`orgId=1`; Cloud billing organization ID: `1030328`. These identifiers have
different purposes. Preserve the dashboard's resolved variables rather than
substituting one identifier for another.

## Measurement

Collect **frontend observability sessions ingested during the reporting week**,
not log volume or unique users. The original `viewPanel=panel-92` link selects
an explanatory panel. Start from the full dashboard above.

Select UTC and explicit Monday-Sunday dates. Expand **Frontend Observability
Details** and inspect **Total Sessions Ingested by day**. Grafana documents this
panel in its [frontend billing guide](https://grafana.com/docs/grafana-cloud/platform/pricing-and-usage/frontend-observability/).
The headline "Current Frontend Observability Sessions" can be month-to-date
despite a seven-day dashboard range; it is not a weekly total.

Use the structured API/MCP response, or Inspect/Data/CSV for requested browser
reconciliation or fallback, to obtain the daily buckets. Verify
whether timestamps denote bucket starts or ends before selecting seven full
UTC days. Collect no earlier than three hours after the week ends (Monday 03:00
UTC, or 13:00 AEST / 14:00 AEDT in Sydney). This local buffer supports Monday
afternoon reports. Keep all daily coverage checks; source values can change
later. The buffer is not a vendor settlement guarantee.
Sum the seven non-overlapping
daily totals, not the panel mean/max, an ingestion rate, a running monthly
counter, or repeated samples of a rolling 24-hour total. Null/missing buckets
are incomplete coverage, not zero. A day with an explicitly reported zero is
valid data.

Record all selected app, stack and environment filters in `scope`; keep the
same scope string across weeks only when that coverage is unchanged. Notes
can explain the selection, but cannot be its only record because comparisons
do not use notes.
The initial scope is all frontend apps in this Grafana organization, including
production and preview where the panel includes both. If exporting separate
series, sum only disjoint app/environment groups; never add a total series to
its components. If the panel cannot prove the intended scope, leave the
measurement missing instead of describing it as SPORTSHUB production sessions.

## Supported API path

Grafana documents [data source queries](https://grafana.com/docs/grafana/latest/developer-resources/api-reference/http-api/api-legacy/data_source/)
through `POST /api/ds/query` on the Grafana instance. Although POST, this
endpoint queries data; it does not configure a data source. Grafana 13 is
deprecating `/api` routes in favor of `/apis`. The helper uses the documented
compatibility route; an authenticated request must still verify availability.
Do not guess a replacement route after a 404/410.

On 2026-10-11, the daily panel's supported Query Inspector resolved:

- Dashboard UID `dfa75f92-b104-48e6-ba78-cf4fc950ae9a`, panel ID `95`.
- Prometheus datasource UID `grafanacloud-usage`.
- Cloud billing `org_id="1030328"`, no app/environment filter, grouped by
  `(id, appName)`, with no panel transformations.
- Explicit query `interval: "1d"`, effective step `24h`, timezone UTC.
- Inspector request also had `intervalMs: 1800000`, `maxDataPoints: 1071`,
  `utcOffsetSec: 0` and `exemplar: false`; the helper retains these values.

```promql
sum(sum_over_time((grafanacloud_frontend_observability_instance_sessions_per_second{org_id="1030328"} offset -1d * 60)[1d:1m])) by (id, appName) or vector(0)
```

The negative offset associates each daily evaluation timestamp with the
following day. Keep the seven midnight timestamps `start <= timestamp < end`;
the range query can also return the next Monday, which must be excluded.
The values integrate per-second ingestion samples and can be fractional.
Preserve their precision and describe them as the panel's session estimate.
Do not round each day before summing. The unlabeled `or vector(0)` series is
a fallback, not another app or proof that missing app buckets are zero.

On 2026-10-12, an authenticated dashboard API read confirmed the UTC timezone,
panel ID/title, datasource, expression, daily interval and lack of transformations.
The query response had the verified 24h step, preview and production app labels,
and seven daily buckets plus the next Monday. These agree with the Inspector
contract above; no browser access is needed for routine verification.

`fetch_usage.py grafana` reads `/api/dashboards/uid/dfa75f92-b104-48e6-ba78-cf4fc950ae9a`
before executing the pinned query. A changed panel definition stops collection.
`normalize_usage.py` checks the executed query/step, daily frame schema, exact
app labels and complete seven-day coverage, then sums only the labeled app
series. It records the sorted `(id, appName)` set in `scope`; an app-set change
therefore breaks comparison. An approved missing result retains that returned
app set and lists every affected app/day gap in its notes. A missing app cannot
be discovered from a fallback
zero series alone; the report covers the labeled apps returned by the panel.
Update the pinned request deliberately if the supported source changes.

The fetch helper rejects an early Grafana collection before contacting the API.
Normalization checks Grafana evidence's own capture time, rather than the later
normalization time or the Vercel capture time. `--allow-missing-grafana` does
not bypass this delay. Recollect early evidence after the eligible timestamp;
do not edit its capture time. Older saved history predates this safeguard and
retains its capture metadata; every fresh collection and recheck must apply it.

1. Inspect the actual daily panel through MCP/dashboard metadata, or a supported
   Query Inspector export for initial reconciliation. Capture datasource UID, expression,
   resolved variables, interval/step, timezone and panel transformations.
   Do not guess PromQL or reuse the explanatory panel's query.
2. With existing authorized authentication, send that verified payload to
   `https://compassdigitalgroup.grafana.net/api/ds/query`, changing the range
   to the requested week's epoch-millisecond boundaries as required by the
   panel's bucket semantics.
3. Check both HTTP status and each query result's errors/status. Match returned
   frame fields/labels to the panel's displayed groups and apply its verified
   transformations. A 200 response with no frames is not evidence of zero.
4. Apply the verified daily contract to each backfill week independently.
   Query retention can be shorter than the desired trend window. Missing/null
   app buckets pause the run. Only after explicit approval, normalization's
   `--allow-missing-grafana` can leave that whole metric null/missing; it never
   fills absent days with zero or compares an incomplete total.

Use `weekly-daily-buckets-v1` only when that daily definition is verified.
Change the definition if aggregation or inclusion rules change. Document
rounding or estimation. API access depends on the account's existing
permissions; browser access does not establish API access. An authenticated
browser export is a valid requested fallback. If a login/CAPTCHA prevents access,
pause at the skill's access and coverage gate; do not bypass it or create a
service account without operator approval.

## Official MCP alternative

The official [Grafana MCP server](https://github.com/grafana/mcp-grafana) exposes
`get_dashboard_panel_queries` to read panel queries and datasource IDs, and
`run_panel_query` to execute them. Configure read/query access as described in
[access.md](access.md). Inspect the connected tool's schema rather than
assuming argument names or response envelopes from another server version.

Discover the dashboard above, select **Total Sessions Ingested by day**, and
verify it matches the pinned query. `run_panel_query`, or `query_prometheus`
with the resolved datasource UID, expression, explicit UTC range and 24-hour
step, must return raw labeled daily data. Reject a tool that only returns a
chart summary, silently uses a relative range, or truncates the response.
Apply exactly the same bucket, missing-data and scope checks as the API.
