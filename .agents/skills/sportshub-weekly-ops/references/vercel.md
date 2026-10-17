# Vercel API counter retrieval

## Source and scope

- Team: `compass-digitals-projects`, ID `team_7wMqFyd9Hz1I882l0vkev0Dz`.
- Project: `social-sports`, ID `prj_M871BOaWTRTkX8FKcUvusXpWAqXx`.
- Source: `GET https://api.vercel.com/v2/usage`, bearer token authentication.

This **undocumented dashboard/legacy API** was live-tested on this Hobby team
on 2026-10-12 using its existing token, without a plan upgrade or browser cookies.
It is absent from the public [OpenAPI specification](https://vercel.com/openapi.json)
and can change without a public API compatibility guarantee. Validate responses
on every run; a schema, granularity or coverage change requires investigation.
Do not install a browser extension or extract cookies to use it.

The route was discovered through source research in
[vercel-usage-badge](https://github.com/zealot-network/vercel-usage-badge/blob/master/background.js).
That project's browser authentication and normalization are not dependencies.
The helper implements the separately verified bearer-token requests below.

Use `type=requests`, the team ID, and inclusive `from` / exclusive `to` with
**millisecond ISO UTC timestamps**. For example:

```text
from=2026-10-05T00:00:00.000Z
to=2026-10-12T00:00:00.000Z
```

This account rejects timestamps without `.000`, date-only strings and epoch
milliseconds on this route. Fetch twice: omit `projectId` for all team projects;
add the exact project ID for SPORTSHUB. Do not add an environment filter.
The helper pins these parameters and records each request in its evidence.

The project-filtered response still includes team-wide `breakdown` percentages.
**Ignore `breakdown` and `previous`**. Use the scalar counters in each separately
filtered response. Rounded project percentages cannot reconstruct project totals.
Live verification reconciled the team counters against the sum of its three
separate project responses. Team totals already include SPORTSHUB.

## Accepted report measurements

Use definition `vercel-usage-v2-counters-v1`. Each row below is reported for
both team and project, with IDs prefixed `vercel_team.` / `vercel_project.`.
Sum the listed fields over seven daily rows; divide bytes once after summing.

| Metric ID suffix | API fields / calculation | Unit |
| --- | --- | --- |
| `api_requests` | `request_hit_count` + `request_miss_count` | count |
| `api_incoming_bandwidth` | `bandwidth_incoming_bytes` / 1,000,000,000 | decimal GB |
| `api_outgoing_bandwidth` | `bandwidth_outgoing_bytes` / 1,000,000,000 | decimal GB |
| `api_function_invocations` | Sum `function_invocation_{successful,error,timeout,throttle}_count` | count |
| `api_function_unsuccessful` | Sum `function_invocation_{error,timeout,throttle}_count` | count |
| `api_function_execution` | Sum `function_execution_{successful,error,timeout}_gb_hours` | GB-hours |

These labels describe the returned fields and explicit sums. They are **not
verified equivalents** of the original Fast Data Transfer, Fast Origin
Transfer, CDN Requests, CDN Request CPU Duration or ISR Reads. In particular,
incoming bandwidth is not renamed Fast Origin Transfer, and GB-hours is not
CPU seconds. This is an intentional new measurement set accepted by the user.
Never fill old metric IDs with these values or compare them to old dashboard
values. Schema 1 remains readable; new snapshots use schema 2.

`normalize_usage.py` requires `granularity: "day"`, exactly the seven UTC
midnight `date` values inside the requested week, and `lastUpdate` covering the
completed week. Required counters must be finite and nonnegative; counts must
be integral. Missing fields, duplicate/outside buckets, empty data and coarser
granularity fail instead of becoming zero. `lastUpdate` is the API's reported
freshness, not a guarantee that billing data will never be revised.

Save the API permalink without query parameters as `source_url`. The snapshot
period and scope record the request context; raw request/response evidence stays
in `.tmp/`. Preserve precision rather than copying rounded dashboard cards.

## Why the billing API / CLI / MCP are not substitutes

The documented [FOCUS charges endpoint](https://vercel.com/docs/rest-api/billing/list-focus-billing-charges)
returned `404 costs_not_found` on this team for several completed periods,
including with correct millisecond timestamps and team ID. Vercel's own
[test fixtures](https://github.com/vercel-labs/agent-skills/blob/main/packages/vercel-optimize-tests/test/fixtures/real-cli-output/README.md#key-shape-findings)
associate that response with teams without the Costs feature enabled. This
does not establish a plan upgrade requirement or a self-service switch.

The official usage CLI and MCP billing tool use that charges source; they do
not expose these `/v2/usage` counters or fix missing Costs access. Relevant
[infrastructure metrics CLI](https://vercel.com/docs/cli/metrics) queries require
Pro/Enterprise with Observability Plus. Do not buy access, substitute USD/MIUs,
or repeatedly retry the billing endpoint as part of this report.

If the undocumented route stops working, pause and explain the specific gap.
Use another structured source only after verifying matching definitions, or
ask the operator to choose revised metrics or a dashboard fallback. Do not
silently revert to the original metric set.
