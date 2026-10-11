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

The [skill](../../.agents/skills/sportshub-weekly-ops/SKILL.md) describes vendor
retrieval and history validation. Reports and structured snapshots live in
`weekly/YYYY-MM-DD/`; history belongs on `master` through approved PRs.
There is no scheduled collector, automatic PR publishing or spreadsheet write.

Initial coverage is Vercel team usage, `social-sports` project usage and
Grafana frontend sessions. The skill records missing access/data explicitly,
tries a comparable historical backfill, and never invents a baseline. Only
aggregate data belongs in this directory; raw exports stay in `.tmp/` and
credentials stay outside Git.

The functions deployment workflow excludes changes confined to this guide,
the weekly report directory and the skill. Application changes still trigger
the existing deployment workflow. App CI remains unchanged.

Local verification:

```bash
rtk proxy python3 -m unittest discover -s .agents/skills/sportshub-weekly-ops/scripts -p 'test_*.py'
rtk proxy python3 .agents/skills/sportshub-weekly-ops/scripts/weekly_ops.py check
```
