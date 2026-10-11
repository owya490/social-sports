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

Use panel Inspect/Data or its CSV export to obtain the daily buckets. Verify
whether timestamps denote bucket starts or ends before selecting seven full
UTC days. Check that the newest bucket has settled. Sum the seven non-overlapping
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
endpoint queries data; it does not configure a data source.

1. Inspect the actual daily panel's query through the UI or a supported
   dashboard/Query Inspector export. Capture the datasource UID, expression,
   resolved variables, interval/step, timezone and panel transformations.
   Do not guess PromQL or reuse the explanatory panel's query.
2. With existing authorized authentication, send that verified payload to
   `https://compassdigitalgroup.grafana.net/api/ds/query`, changing the range
   to the requested week's epoch-millisecond boundaries as required by the
   panel's bucket semantics.
3. Check both HTTP status and each query result's errors/status. Match returned
   frame fields/labels to the panel's displayed groups and apply its verified
   transformations. A 200 response with no frames is not evidence of zero.
4. Reconcile against the same weekly panel before reusing the query for
   backfill. Query retention can be shorter than the desired trend window.

Use `weekly-daily-buckets-v1` only when that daily definition is verified.
Change the definition if aggregation or inclusion rules change. Document
rounding or estimation. API access depends on the account's existing
permissions; browser access does not establish API access. An authenticated
browser export is a valid fallback. If a login/CAPTCHA prevents access, report
the gap and continue with Vercel; do not bypass it or create a service account.
