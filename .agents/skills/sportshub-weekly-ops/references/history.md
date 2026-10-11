# Weekly history contract

Run from the repository root with Python 3.10 or newer. No vendor SDK, database
or package install is needed. Commands below use the repository's RTK wrapper.

```bash
rtk proxy mkdir -p .tmp
rtk proxy python3 .agents/skills/sportshub-weekly-ops/scripts/weekly_ops.py init > .tmp/ops-input.json
```

`init` selects the last completed UTC week. Use `init --week YYYY-MM-DD` for a
specific Monday. The JSON includes the exact inclusive start and exclusive
end, capture time, and all eleven expected measurements initially missing.
It is an input scaffold, not a collected report.

For every metric, fill these fields:

| Field | Contract |
| --- | --- |
| `value` | Finite nonnegative number; `null` for missing data. Canonical units: decimal GB, count, seconds. |
| `status` | `complete`, `partial`, `stale`, or `missing`. Only complete measurements participate in comparisons. |
| `scope` | Actual team/project/stack/app/environment coverage, including all selected filters. Template scopes describe the intended defaults; change scope when coverage changes. |
| `unit` | Unit actually normalized and verified. A unit change prevents comparison. |
| `definition` | Stable measurement/aggregation version. Bump it when meaning changes. |
| `source_url` | Credential-free HTTPS dashboard/API permalink without query or fragment. The period is recorded separately. |
| `method` | `api`, `cli`, `browser`, or `unavailable`. Complete data must name a retrieval method. |
| `notes` | Rounding, source freshness, missing-data reason or correction explanation. Coverage-changing filters belong in `scope` because notes do not control comparisons. |

`complete` means the whole period and scope were covered; it does not promise
more precision than the source. Explain rounded card values in `notes`.
Update `captured_at` after collection. For partial/stale values, preserve an
observed number only when useful and explain why it cannot be compared.

```bash
rtk proxy python3 .agents/skills/sportshub-weekly-ops/scripts/weekly_ops.py save --input .tmp/ops-input.json
rtk proxy python3 .agents/skills/sportshub-weekly-ops/scripts/weekly_ops.py check
```

`save` creates `docs/operations/weekly/YYYY-MM-DD/snapshot.json` and `report.md`.
The helper's default history path is anchored to this repository, independent
of the shell working directory. `--history PATH` selects an isolated history
directory for a test or another checkout. Keep experimental data in `.tmp/`.

Reports compare the exact previous week. They show values for four consecutive
calendar weeks and calculate first-to-last change only when all four values
are comparable. Different scopes, units, definitions, missing weeks and
non-complete statuses prevent those comparisons. With a zero baseline, show
the absolute change and percentage N/A. Do not interpret a large percentage
without considering the absolute quantity.

For a longer report, print a new rendering without replacing saved history:

```bash
rtk proxy python3 .agents/skills/sportshub-weekly-ops/scripts/weekly_ops.py render --input docs/operations/weekly/2026-09-28/snapshot.json --trend-weeks 12 > .tmp/ops-long-trend.md
```

Re-saving identical data preserves the existing report, including the agent's
assessment. A conflicting snapshot or incomplete existing folder fails instead
of overwriting it. To correct an existing week, propose the correction, edit
that snapshot and its `notes` deliberately, use `render` into `.tmp/`, and update
the corresponding report in the same reviewed change. Later saved reports are
historical assessments as of their capture date; regenerate affected reports
explicitly if a correction should change those assessments.

Append an assessment after inspecting the generated numbers. Keep findings
short and sourced; include unresolved coverage and actionable follow-ups.
Snapshots are the numerical history, not prose extracted from prior reports.
Only publish through the repository's approved PR workflow. Do not merge or
commit directly to `master`, and do not schedule runs as part of collection.
