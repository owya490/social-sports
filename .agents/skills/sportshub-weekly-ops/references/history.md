# Weekly history contract

Run from the repository root with Python 3.10 or newer. No vendor SDK, database
or package install is needed. Commands below use the repository's RTK wrapper.

```bash
rtk proxy mkdir -p .tmp
rtk proxy python3 .agents/skills/sportshub-weekly-ops/scripts/weekly_ops.py init > .tmp/ops-input.json
```

`init` selects the last completed UTC week. Use `init --week YYYY-MM-DD` for a
specific Monday. The JSON includes the exact inclusive start and exclusive
end, capture time, and all thirteen schema 2 measurements initially missing.
It is an input scaffold, not a collected report.

For every metric, fill these fields:

| Field | Contract |
| --- | --- |
| `value` | Finite nonnegative number; `null` for missing data. Current units: decimal GB, count, GB-hours. Schema 1 also used seconds. |
| `status` | `complete`, `partial`, `stale`, or `missing`. Only complete measurements participate in comparisons. |
| `scope` | Actual team/project/stack/app/environment coverage, including all selected filters. Template scopes describe the intended defaults; change scope when coverage changes. |
| `unit` | Unit actually normalized and verified. A unit change prevents comparison. |
| `definition` | Stable measurement/aggregation version. Bump it when meaning changes. |
| `source_url` | Credential-free HTTPS dashboard/API permalink without query or fragment. The period is recorded separately. |
| `method` | `api`, `mcp`, `cli`, `browser`, or `unavailable`. Complete data must name a retrieval method. |
| `notes` | Rounding, source freshness, missing-data reason or correction explanation. Coverage-changing filters belong in `scope` because notes do not control comparisons. |

`complete` means the whole period and scope were covered; it does not promise
more precision than the source. Explain rounded card values in `notes`.
Update `captured_at` after collection. For partial/stale values, preserve an
observed number only when useful and explain why it cannot be compared.
API and MCP transport changes do not break comparison when scope, units and
measurement definition have been reconciled. Keep those fields unchanged only
when the measurements actually retain their meaning.

The normal API path uses `normalize_usage.py` to fill this contract from both
evidence bundles; see [access.md](access.md). `init` is useful for inspecting the
contract or an approved alternate/partial collection. It does not authorize
continuing past the skill's access and coverage gate.

Schema 2 replaces Vercel's original five dashboard measurements per scope with
six explicitly labelled API counters per scope. It uses different metric IDs
and definition `vercel-usage-v2-counters-v1`. Schema 1 snapshots remain readable
and render with their original labels. Vercel comparisons across this boundary
are N/A. Retain the old snapshots; never rewrite their measurements as new API
counters. Grafana comparisons still require matching actual app scope, units
and daily definition, regardless of schema version.

```bash
rtk proxy python3 .agents/skills/sportshub-weekly-ops/scripts/weekly_ops.py save --input .tmp/ops-input.json
rtk proxy python3 .agents/skills/sportshub-weekly-ops/scripts/weekly_ops.py check
```

`save` creates `docs/operations/weekly/YYYY-MM-DD/snapshot.json` and a numerical
working draft in `report.md`. Verify that draft, then rewrite `report.md` as the
concise brief specified in [reporting.md](reporting.md). Keep all measurements
and source details in `snapshot.json`. The brief selects the important results;
it does not need every generated row or collection note.
The helper's default history path is anchored to this repository, independent
of the shell working directory. `--history PATH` selects an isolated history
directory for a test or another checkout. Keep experimental data in `.tmp/`.

The numerical draft compares the exact previous week. It shows values for four
consecutive calendar weeks and calculates first-to-last change only when all
four values are comparable. Different scopes, units, definitions, missing weeks and
non-complete statuses prevent those comparisons. With a zero baseline, show
the absolute change and percentage N/A. Do not interpret a large percentage
without considering the absolute quantity.

To inspect full tables or a longer window, print a detailed rendering without
replacing the concise report or saved history:

```bash
rtk proxy python3 .agents/skills/sportshub-weekly-ops/scripts/weekly_ops.py render --input docs/operations/weekly/2026-09-28/snapshot.json --trend-weeks 12 > .tmp/ops-long-trend.md
```

For a same-week recheck, pass the freshly normalized input to `save` as usual.
It compares the schema, UTC period, metric IDs, values, coverage statuses,
scopes, units and definitions against the saved snapshot. When these match,
it returns the existing folder without changing either file. Original capture
time, provenance and the agent's assessment remain intact. New capture time,
retrieval method, source URL and notes are collection metadata; changes to them
alone do not require a correction. Keep the new raw evidence and normalized
input in `.tmp/`, and state the recheck time in the response. Do not rewrite the
existing report just because it was rechecked.

Rechecks do not bypass access, freshness or coverage validation. Changed
measurements, contracts, schema or malformed existing history still fail
without overwriting either file. To correct an existing week, propose the
correction, edit that snapshot and its `notes` deliberately, use `render` into
`.tmp/`, and update
the corresponding report in the same reviewed change. Later saved reports are
historical assessments as of their capture date; regenerate affected reports
explicitly if a correction should change those assessments.

Use [reporting.md](reporting.md) for content selection, length and ASD-STE100
style. Keep findings sourced; include unresolved coverage and useful follow-ups.
Snapshots are the numerical history, not prose extracted from prior reports.
Only publish through the repository's approved PR workflow. Do not merge or
commit directly to `master`, and do not schedule runs as part of collection.
