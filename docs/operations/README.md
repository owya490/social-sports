# Weekly operations reports

Use the repository skill:

```text
Use $sportshub-weekly-ops to collect the last completed week's Vercel and
Grafana usage, compare the previous week and four-week trend, and leave
the snapshot and report uncommitted for review.
```

For a specific week, supply its Monday date. Ask for a 12-week trend when
useful. Reporting weeks run Monday 00:00 UTC to the following Monday 00:00 UTC
exclusively, so daily billing buckets remain comparable across Sydney DST.

The final report uses mostly ASD-STE100 style with SPORTSHUB terminology.
It targets 300-400 words for Vercel and Grafana, with important changes,
previous values, useful four-week context and data gaps. Full values and source
definitions stay in `snapshot.json`.
Use `weekly_ops.py render` for detailed tables. See the
[report contract](../../.agents/skills/sportshub-weekly-ops/references/reporting.md).

The [skill](../../.agents/skills/sportshub-weekly-ops/SKILL.md) describes vendor
retrieval and history validation. It uses the API helper, with an optional
official Grafana MCP path; [source setup](../../.agents/skills/sportshub-weekly-ops/references/access.md)
lists the authentication requirements and API helper commands. A credential-free
request preview is available before setup:

```bash
rtk proxy python3 .agents/skills/sportshub-weekly-ops/scripts/fetch_usage.py plan
```

The API collector and deterministic normalizer are implemented. The free
Vercel route was live-tested with this team's existing token; it is undocumented
and supplies explicitly labelled request, bandwidth and function counters,
not verified equivalents of the original CDN/Fast Transfer/ISR dashboard metrics.
Grafana's daily session query is checked against dashboard metadata via API.
See the skill's source references and local setup for exact definitions and
commands. Reports and structured snapshots live in
`weekly/YYYY-MM-DD/`; history belongs on `master` through approved PRs.
There is no scheduled collector, automatic PR publishing or spreadsheet write.

Initial coverage is Vercel team usage, `social-sports` project usage and
Grafana frontend sessions. The skill checks local prerequisites and pauses for
setup when access or required data is missing. It continues with gaps only on
explicit approval, tries a comparable historical backfill, and never invents
a baseline. Only aggregate data belongs in this directory; raw exports stay in `.tmp/` and
credentials stay outside Git.

The functions deployment workflow excludes changes confined to this guide,
the weekly report directory and the skill. Application changes still trigger
the existing deployment workflow. App CI remains unchanged.

Local verification:

```bash
rtk proxy python3 -m unittest discover -s .agents/skills/sportshub-weekly-ops/scripts -p 'test_*.py'
rtk proxy python3 .agents/skills/sportshub-weekly-ops/scripts/weekly_ops.py check
```
