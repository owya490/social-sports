# Concise report contract

## Content and length

The report is a weekly operations brief. Target 300-400 words for the current
Vercel and Grafana content, excluding the title, period and footer. Use less
when there is little to report. Keep critical findings and data gaps even if
they require more space. As sources are added, remove lower-priority detail
instead of adding a full metric inventory for each section.

Start with the exact UTC period and any gap that limits the conclusions.
Then explain the main finding, selected key metrics and useful follow-ups.
Give previous values and meaningful absolute changes, not just percentages.
Use one compact table with current values, previous values and changes; usually
no more than six rows are needed. Add short paragraphs for four-week patterns
and the limits of the evidence. Omit empty sections.

Select content in this order:

1. A failure increase, verified limit risk, or data gap that needs attention.
2. A change large enough in absolute terms to affect an operational decision.
3. A repeated four-week pattern, or history that changes the interpretation of
   this week's result. A first-to-last difference alone does not prove a trend.
4. A small set of metrics that shows SPORTSHUB activity and resource use.

Evaluate the previous week and four-week history on every run. Show only the
comparisons that add useful information. Do not invent alert thresholds, SLOs
or causes. Give absolute changes for small baselines; a large percentage alone
is not enough. Verify plan allowances and billing periods before claiming a
limit risk. Usage alone does not prove reliability or business health.

Use prose to explain the table, not repeat it. Repeat a number only when it
helps explain a priority finding or a four-week pattern. Avoid a second full
history table. Do not remove useful context just to make the report shorter.
Prefer SPORTSHUB values. Include a team value when it shows a separate useful
change; team totals already include SPORTSHUB. Do not repeat identical team
and project function counters. If there is no important change, say so once.

Give a specific next action only when the findings support it. State an unknown
cause or unknown user impact when needed. Do not invent an owner or deadline.
Keep approved missing data out of comparisons. Explain why a key comparison
is unavailable instead of filling the brief with N/A rows.

## Approximately 80% ASD-STE100 style

Use these practical rules from the [ASD-STE100 writing rules](https://www.asd-ste100.org/assets/files/ASD-STE100_ISSUE9.pdf).
Treat 80% as a writing preference, not a measured compliance score.

- Prefer active sentences with one main point. Keep sentences within 25 words;
  most should be shorter. Use one topic in each paragraph or bullet.
- Use direct verbs and familiar words. Write "increased" or "decreased" for
  numeric changes. Use the same term for the same meaning throughout.
- Put the observation before its explanation. Put action instructions in a
  separate sentence. Avoid idioms, vague claims and repeated cautions.
- Retain technical nouns and names, as the [official FAQ](https://www.asd-ste100.org/STE_faq.html)
  permits. Examples include SPORTSHUB, `social-sports`, GAC, Vercel, Grafana,
  API, CDN, ISR, function invocations, frontend observability sessions, GB and
  GB-hours. Preserve preview/production scope and metric definitions.
- Keep combined metrics explicit: "function errors + timeouts + throttles"
  must not become "function errors" or an assumed error rate.

Round display values for readability: counts with separators, GB to two or
three decimals, percentages to one decimal. Identify Grafana sessions as an
estimate. Keep full precision in the snapshot. Avoid rounding a nonzero value
to zero when that would change the reader's conclusion.

## Evidence and final check

For a new week, `weekly_ops.py save` produces a numerical working draft.
Rewrite `report.md` into this brief after verifying its numbers against that
draft and history.
If `save` confirms an unchanged same-week recheck, keep the existing report
and snapshot; report the verification time without regenerating either file.
Preserve `snapshot.json`, capture time and collection definitions. Link to
`snapshot.json` and any useful baseline instead of copying all source URLs,
queries, IDs, definitions and collection notes into the report. Retain a short
source limitation when it changes interpretation, such as Vercel's API counters
not being verified equivalents of the original dashboard metrics.

Full tables remain available through `weekly_ops.py render`; see [history.md](history.md).
Leave older reports unchanged unless their revision is requested. Keep the
`Generated with AI assistance.` footer.

Before finishing, verify the selected values and changes, UTC period, actual
scope and visible gaps. Remove repeated metrics and low-priority commentary.
Keep the main issue clear when someone reads only the first few lines.
