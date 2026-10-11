#!/usr/bin/env python3
"""Validate aggregate weekly snapshots and render comparable usage history."""

import argparse
from dataclasses import asdict, dataclass
from datetime import date, datetime, time, timedelta, timezone
import json
import math
from pathlib import Path
import sys
from tempfile import TemporaryDirectory
from urllib.parse import urlsplit


UTC = timezone.utc
DEFAULT_HISTORY = Path(__file__).resolve().parents[4] / "docs/operations/weekly"
TEAM_URL = "https://vercel.com/compass-digitals-projects/~/usage"
PROJECT_URL = "https://vercel.com/compass-digitals-projects/social-sports/usage"
GRAFANA_URL = (
    "https://compassdigitalgroup.grafana.net/d/"
    "dfa75f92-b104-48e6-ba78-cf4fc950ae9a/grafana-cloud-billing-usage"
)
VERCEL_MEASURES = (
    ("fast_data_transfer", "Fast data transfer", "GB"),
    ("fast_origin_transfer", "Fast origin transfer", "GB"),
    ("edge_requests", "Edge requests", "count"),
    ("edge_cpu", "Edge request CPU", "seconds"),
    ("isr_reads", "ISR reads", "count"),
)


@dataclass(frozen=True)
class MetricSpec:
    label: str
    unit: str
    scope: str
    source_url: str


CATALOG = {}
for prefix, label, scope, url in (
    ("vercel_team", "Vercel CDG", "compass-digitals-projects:all-projects", TEAM_URL),
    (
        "vercel_project", "Vercel SPORTSHUB",
        "compass-digitals-projects:prj_M871BOaWTRTkX8FKcUvusXpWAqXx", PROJECT_URL,
    ),
):
    for name, title, unit in VERCEL_MEASURES:
        CATALOG[f"{prefix}.{name}"] = MetricSpec(f"{label} - {title}", unit, scope, url)
CATALOG["grafana.frontend_sessions"] = MetricSpec(
    "Grafana frontend sessions", "count", "compassdigitalgroup:all-frontend-apps", GRAFANA_URL,
)


@dataclass(frozen=True)
class Metric:
    value: int | float | None
    status: str
    scope: str
    unit: str
    definition: str
    source_url: str
    method: str
    notes: str


@dataclass(frozen=True)
class Snapshot:
    start: datetime
    end: datetime
    captured_at: datetime
    metrics: dict[str, Metric]

    @property
    def week(self):
        return self.start.date()

    def json_data(self):
        return {
            "schema_version": 1,
            "period": {"start": iso(self.start), "end": iso(self.end), "timezone": "UTC"},
            "captured_at": iso(self.captured_at),
            "metrics": {key: asdict(metric) for key, metric in self.metrics.items()},
        }


def iso(value):
    return value.isoformat().replace("+00:00", "Z")


def bounds(week):
    if week.weekday() != 0:
        raise ValueError("The reporting week must start on a Monday.")
    start = datetime.combine(week, time(), UTC)
    return start, start + timedelta(days=7)


def template(week, now):
    start, end = bounds(week)
    if end > now:
        raise ValueError("Only completed UTC weeks can be recorded.")
    return Snapshot(start, end, now, {
        key: Metric(None, "missing", spec.scope, spec.unit, "unverified",
                    spec.source_url, "unavailable", "Not collected.")
        for key, spec in CATALOG.items()
    })


def require_fields(value, fields, label):
    if not isinstance(value, dict) or set(value) != set(fields):
        raise ValueError(f"{label} must contain exactly: {', '.join(fields)}.")


def utc_timestamp(value):
    if not isinstance(value, str):
        raise ValueError("Timestamps must be UTC ISO strings.")
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None or parsed.utcoffset() != timedelta():
        raise ValueError("Timestamps must include a UTC offset.")
    return parsed


def parse_snapshot(data, now):
    require_fields(data, ("schema_version", "period", "captured_at", "metrics"), "Snapshot")
    if type(data["schema_version"]) is not int or data["schema_version"] != 1:
        raise ValueError("Unsupported snapshot schema_version.")
    period = data["period"]
    require_fields(period, ("start", "end", "timezone"), "Period")
    start, end = utc_timestamp(period["start"]), utc_timestamp(period["end"])
    if period["timezone"] != "UTC" or (start, end) != bounds(start.date()):
        raise ValueError("Period must be a complete Monday-to-Monday UTC week.")
    captured = utc_timestamp(data["captured_at"])
    if not end <= captured <= now:
        raise ValueError("captured_at must be after the week ends and not in the future.")
    require_fields(data["metrics"], CATALOG, "Metrics")
    metrics = {}
    for key, raw in data["metrics"].items():
        require_fields(raw, Metric.__dataclass_fields__, key)
        for field in ("status", "scope", "unit", "definition", "source_url", "method", "notes"):
            if not isinstance(raw[field], str) or (field != "notes" and not raw[field].strip()):
                raise ValueError(f"{key}.{field} must be a nonempty string.")
        metric = Metric(**raw)
        if metric.status not in {"complete", "partial", "stale", "missing"}:
            raise ValueError(f"{key}: invalid status.")
        if metric.method not in {"api", "cli", "browser", "unavailable"}:
            raise ValueError(f"{key}: invalid retrieval method.")
        if metric.value is not None:
            if type(metric.value) not in {int, float} or not math.isfinite(metric.value) or metric.value < 0:
                raise ValueError(f"{key}: value must be finite, nonnegative and numeric.")
            if metric.method == "unavailable":
                raise ValueError(f"{key}: observed values require a retrieval method.")
        if metric.status == "complete":
            if metric.value is None or metric.definition == "unverified" or metric.method == "unavailable":
                raise ValueError(f"{key}: complete data requires a value, method and verified definition.")
        elif not metric.notes.strip():
            raise ValueError(f"{key}: explain incomplete coverage in notes.")
        if metric.status == "missing" and metric.value is not None:
            raise ValueError(f"{key}: missing data must have a null value.")
        url = urlsplit(metric.source_url)
        if (url.scheme != "https" or url.hostname not in {
                "vercel.com", "api.vercel.com", "compassdigitalgroup.grafana.net"}
                or url.username or url.password or url.query or url.fragment):
            raise ValueError(f"{key}: use a credential-free HTTPS source permalink without query/fragment.")
        metrics[key] = metric
    return Snapshot(start, end, captured, metrics)


def load_snapshot(path, now):
    try:
        return parse_snapshot(json.loads(path.read_text(encoding="utf-8")), now)
    except (ValueError, TypeError, OverflowError) as error:
        raise ValueError(f"{path}: {error}") from error


def load_week(folder, now):
    if not folder.is_dir() or {path.name for path in folder.iterdir()} != {"snapshot.json", "report.md"}:
        raise ValueError(f"{folder}: each weekly folder must contain only snapshot.json and report.md.")
    if not (folder / "report.md").is_file():
        raise ValueError(f"{folder}: report.md must be a file.")
    snapshot = load_snapshot(folder / "snapshot.json", now)
    if str(snapshot.week) != folder.name:
        raise ValueError(f"{folder}: directory and snapshot week differ.")
    return snapshot


def history_window(history, snapshot, weeks, now):
    if not 2 <= weeks <= 52:
        raise ValueError("trend-weeks must be between 2 and 52.")
    result = {}
    for offset in range(weeks - 1, 0, -1):
        week = snapshot.week - timedelta(weeks=offset)
        folder = history / str(week)
        result[week] = load_week(folder, now) if folder.exists() else None
    result[snapshot.week] = snapshot
    return result


def comparable(current, previous):
    return (previous is not None and current.status == previous.status == "complete"
            and (current.scope, current.unit, current.definition)
            == (previous.scope, previous.unit, previous.definition))


def number(value):
    return f"{value:,.6g}"


def change(current, previous):
    if not comparable(current, previous):
        return "N/A"
    delta = current.value - previous.value
    percent = f"{delta / previous.value * 100:+.1f}%" if previous.value else "N/A: zero baseline"
    return f"{delta:+,.6g} {current.unit} ({percent})"


def cell(text):
    return str(text).replace("\r", " ").replace("\n", " ").replace("|", "\\|")


def render_report(snapshot, history, weeks, now):
    window = history_window(history, snapshot, weeks, now)
    previous_week = snapshot.week - timedelta(weeks=1)
    previous = window[previous_week]
    complete = sum(metric.status == "complete" for metric in snapshot.metrics.values())
    lines = [
        f"# SPORTSHUB weekly operations - {snapshot.week}", "",
        f"Period: {iso(snapshot.start)} inclusive to {iso(snapshot.end)} exclusive.",
        f"Captured: {iso(snapshot.captured_at)}. Reporting timezone: UTC.", "",
        "## Coverage", "",
        f"{complete}/{len(CATALOG)} measurements complete. Missing, partial and stale data are not zero.",
        f"Previous calendar week: {previous_week}. Trend window: {weeks} calendar weeks including this week.", "",
        "## Weekly changes", "",
        "| Measurement | This week | Previous week | Change | Status |",
        "| --- | --- | --- | --- | --- |",
    ]
    for key, spec in CATALOG.items():
        current = snapshot.metrics[key]
        baseline = previous.metrics[key] if previous else None
        value = f"{number(current.value)} {current.unit}" if current.value is not None else "N/A"
        old_value = f"{number(baseline.value)} {baseline.unit}" if comparable(current, baseline) else "N/A"
        lines.append("| " + " | ".join(map(cell, (
            spec.label, value, old_value, change(current, baseline), current.status,
        ))) + " |")
    lines += [
        "", f"## {weeks}-week history", "",
        "Week order: " + " -> ".join(map(str, window)) + ".", "",
        "| Measurement | Comparable values, oldest to newest | Window change |",
        "| --- | --- | --- |",
    ]
    for key, spec in CATALOG.items():
        current = snapshot.metrics[key]
        series = [entry.metrics[key] if entry else None for entry in window.values()]
        matched = [comparable(current, entry) for entry in series]
        values = " -> ".join(number(entry.value) if valid else "N/A" for entry, valid in zip(series, matched))
        trend = change(current, series[0]) if all(matched) else f"N/A ({sum(matched)}/{weeks} comparable weeks)"
        lines.append(f"| {cell(spec.label)} | {values} | {cell(trend)} |")
    lines += [
        "", "N/A comparisons indicate absent/incomplete data or a scope, unit or definition change.",
        "Window change compares first and last weeks only; it does not establish a sustained trend.",
        "Tables use up to six significant digits; snapshots preserve source precision.", "",
        "## Sources and collection notes", "",
    ]
    for key, spec in CATALOG.items():
        metric = snapshot.metrics[key]
        lines.append(f"- {cell(spec.label)}: {metric.source_url} ({metric.method}); "
                     f"scope: {cell(metric.scope)}; definition: {cell(metric.definition)}; {cell(metric.notes)}")
    lines += ["", "Generated with AI assistance.", ""]
    return "\n".join(lines)


def save_report(snapshot, history, weeks, now):
    destination = history / str(snapshot.week)
    if destination.exists():
        if load_week(destination, now) == snapshot:
            return destination
        raise ValueError(f"{destination}: existing history differs or is incomplete; review a correction explicitly.")
    report = render_report(snapshot, history, weeks, now)
    history.mkdir(parents=True, exist_ok=True)
    with TemporaryDirectory(prefix=".weekly-", dir=history) as temporary:
        staging = Path(temporary) / str(snapshot.week)
        staging.mkdir()
        (staging / "snapshot.json").write_text(json.dumps(snapshot.json_data(), indent=2, allow_nan=False) + "\n", encoding="utf-8")
        (staging / "report.md").write_text(report, encoding="utf-8")
        staging.rename(destination)
    return destination


def check_history(history, now):
    count = 0
    if not history.exists():
        return count
    for folder in sorted(history.iterdir()):
        load_week(folder, now)
        count += 1
    return count


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    initialize = commands.add_parser("init", help="Print a missing-data input scaffold.")
    initialize.add_argument("--week", type=date.fromisoformat, help="Completed week's Monday, YYYY-MM-DD.")
    for name in ("save", "render"):
        command = commands.add_parser(name)
        command.add_argument("--input", type=Path, required=True)
        command.add_argument("--history", type=Path, default=DEFAULT_HISTORY)
        command.add_argument("--trend-weeks", type=int, default=4)
    check = commands.add_parser("check", help="Validate all saved snapshots and report presence.")
    check.add_argument("--history", type=Path, default=DEFAULT_HISTORY)
    args = parser.parse_args()
    now = datetime.now(UTC)
    try:
        if args.command == "init":
            monday = now.date() - timedelta(days=now.weekday() + 7)
            print(json.dumps(template(args.week or monday, now).json_data(), indent=2))
        elif args.command == "check":
            print(f"Validated {check_history(args.history, now)} weekly snapshots.")
        else:
            snapshot = load_snapshot(args.input, now)
            if args.command == "render":
                print(render_report(snapshot, args.history, args.trend_weeks, now), end="")
            else:
                print(save_report(snapshot, args.history, args.trend_weeks, now))
    except (ValueError, OSError) as error:
        parser.exit(1, f"error: {error}\n")


if __name__ == "__main__":
    main()
