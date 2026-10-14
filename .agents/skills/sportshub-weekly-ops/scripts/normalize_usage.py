#!/usr/bin/env python3
"""Normalize pinned API evidence into a weekly snapshot without saving history."""

import argparse
from dataclasses import replace
from datetime import date, datetime, timedelta
import json
import math
from pathlib import Path

import fetch_usage as fetcher
import weekly_ops as ops


VERCEL_FIELDS = {
    "api_requests": ("request_hit_count", "request_miss_count"),
    "api_incoming_bandwidth": ("bandwidth_incoming_bytes",),
    "api_outgoing_bandwidth": ("bandwidth_outgoing_bytes",),
    "api_function_invocations": tuple("function_invocation_" + outcome + "_count"
                                     for outcome in ("successful", "error", "timeout", "throttle")),
    "api_function_unsuccessful": tuple("function_invocation_" + outcome + "_count"
                                      for outcome in ("error", "timeout", "throttle")),
    "api_function_execution": tuple("function_execution_" + outcome + "_gb_hours"
                                   for outcome in ("successful", "error", "timeout")),
}


class CoverageError(ValueError):
    pass


def numeric(value, label, integer=False):
    if (type(value) not in {int, float} or not math.isfinite(value) or value < 0
            or (integer and value != int(value))):
        raise ValueError(f"{label}: expected a finite nonnegative {'integer' if integer else 'number'}.")
    return value


def evidence(path, vendor, week, now):
    data = json.loads(path.read_text(encoding="utf-8"), parse_constant=fetcher.reject_constant)
    ops.require_fields(data, ("vendor", "week", "captured_at", "responses"), "API evidence")
    if data["vendor"] != vendor or data["week"] != str(week):
        raise ValueError("API evidence vendor/week does not match the requested snapshot.")
    captured = ops.utc_timestamp(data["captured_at"])
    _, end = ops.bounds(week, now)
    if not end <= captured <= now:
        raise ValueError("Evidence must be captured after the week ends and not in the future.")
    expected = fetcher.request_plan(week, now)[vendor]["requests"]
    ops.require_fields(data["responses"], expected, "API responses")
    for name, spec in expected.items():
        entry = data["responses"][name]
        ops.require_fields(entry, ("request", "data"), "API response")
        if entry["request"] != spec:
            raise ValueError(f"{vendor}/{name}: request scope, dates or query changed; reconcile before use.")
    return data, captured


def vercel_metrics(data, snapshot, captured):
    expected = {snapshot.start + timedelta(days=offset) for offset in range(7)}
    for scope, entry in data["responses"].items():
        raw = entry["data"]
        fetcher.validate_response("vercel", raw)
        updated = ops.utc_timestamp(raw.get("lastUpdate"))
        if not snapshot.end <= updated <= captured + timedelta(minutes=5):
            raise CoverageError(f"Vercel {scope}: source lastUpdate does not cover the completed week.")
        rows = {}
        for row in raw["data"]:
            if not isinstance(row, dict):
                raise ValueError("Vercel daily usage row must be an object.")
            day = ops.utc_timestamp(row.get("date"))
            if day not in expected or day in rows:
                raise ValueError(f"Vercel {scope}: duplicate or out-of-window daily bucket.")
            rows[day] = row
        if rows.keys() != expected:
            missing = ", ".join(str(day.date()) for day in sorted(expected - rows.keys()))
            raise CoverageError(f"Vercel {scope}: missing daily buckets: {missing}. Pause for a coverage decision.")
        fields = {field for group in VERCEL_FIELDS.values() for field in group}
        for row in rows.values():
            for field in fields:
                numeric(row.get(field), f"Vercel {scope}/{field}", integer=field.endswith("_count"))
        for name, group in VERCEL_FIELDS.items():
            key = f"vercel_{scope}.{name}"
            values = [row[field] for row in rows.values() for field in group]
            value = math.fsum(values) if snapshot.metrics[key].unit == "GB-hours" else sum(values)
            if snapshot.metrics[key].unit == "GB":
                value /= 1_000_000_000
            snapshot.metrics[key] = replace(
                snapshot.metrics[key], value=value, status="complete", method="api",
                definition="vercel-usage-v2-counters-v1", source_url=fetcher.VERCEL_BASE,
                notes=(f"Seven UTC daily buckets; sum({', '.join(group)}). "
                       f"Bytes / 1,000,000,000 for decimal GB; source lastUpdate {ops.iso(updated)}. "
                       "Undocumented usage API counters; not reconciled equivalents of CDN/Fast Transfer/ISR billing metrics."),
            )


def grafana_metric(data, snapshot):
    fetcher.validate_panel(data["responses"]["panel"]["data"])
    raw = data["responses"]["query"]["data"]
    fetcher.validate_response("grafana", raw)
    expected = {int((snapshot.start + timedelta(days=day)).timestamp() * 1000) for day in range(7)}
    end = int(snapshot.end.timestamp() * 1000)
    series = {}
    executed = set()
    for frame in raw["results"]["A"]["frames"]:
        if not isinstance(frame, dict) or not isinstance(frame.get("schema"), dict):
            raise ValueError("Grafana frame has no supported schema.")
        schema = frame["schema"]
        fields = schema.get("fields", [])
        if (len(fields) != 2 or fields[0].get("type") != "time" or fields[1].get("type") != "number"
                or fields[0].get("config", {}).get("interval") != 86400000):
            raise ValueError("Grafana frame must contain one daily time/value series.")
        query = schema.get("meta", {}).get("executedQueryString")
        if query:
            executed.add(query)
        values = frame.get("data", {}).get("values")
        if (not isinstance(values, list) or len(values) != 2
                or not all(isinstance(column, list) for column in values) or len(values[0]) != len(values[1])):
            raise ValueError("Grafana frame time/value columns differ or are malformed.")
        labels = fields[1].get("labels", {})
        if not isinstance(labels, dict):
            raise ValueError("Grafana series labels must be an object.")
        rows = {}
        for timestamp, value in zip(*values):
            numeric(timestamp, "Grafana timestamp", integer=True)
            if timestamp not in expected | {end} or timestamp in rows:
                raise ValueError("Grafana has duplicate, misaligned or out-of-window daily buckets.")
            rows[timestamp] = value
        if not labels:
            if any(type(value) not in {int, float} or value != 0 for value in rows.values()):
                raise ValueError("Grafana unlabeled fallback contains nonzero or invalid values.")
            continue
        if set(labels) != {"id", "appName"} or any(not isinstance(v, str) or not v for v in labels.values()):
            raise ValueError("Grafana app labels changed; reconcile series scope before use.")
        identity = (labels["id"], labels["appName"])
        if identity in series:
            raise ValueError("Grafana returned duplicate app series.")
        for day in expected & rows.keys():
            if rows[day] is not None:
                numeric(rows[day], "Grafana session estimate")
        series[identity] = rows
    if executed != {"Expr: " + fetcher.GRAFANA_EXPR + "\nStep: 24h0m0s"}:
        raise ValueError("Grafana executed query/step differs from the verified daily panel.")
    if not series:
        raise CoverageError("Grafana returned no labeled app series; zero usage is unverified.")
    for identity, rows in series.items():
        missing = ", ".join(str(datetime.fromtimestamp(day / 1000, ops.UTC).date())
                            for day in sorted(expected) if rows.get(day) is None)
        if missing:
            raise CoverageError(f"Grafana {identity[1]}: missing/null daily buckets: {missing}. "
                                "The fallback zero series does not fill these gaps.")
    metric = snapshot.metrics["grafana.frontend_sessions"]
    return replace(
        metric, value=math.fsum(rows[day] for rows in series.values() for day in sorted(expected)),
        status="complete", method="api",
        scope="compassdigitalgroup:org_id=1030328:all-frontend-apps:" + json.dumps(sorted(series)),
        definition="weekly-daily-buckets-v1",
        notes=("Verified daily panel 95 via dashboard API; seven UTC bucket-start evaluations per app. "
               "Fractional session estimate preserved; next Monday and unlabeled fallback excluded."),
    )


def normalize(vercel, grafana, week, now, allow_missing_grafana=False):
    snapshot = ops.template(week, now)
    vercel_data, vercel_capture = evidence(vercel, "vercel", week, now)
    grafana_data, grafana_capture = evidence(grafana, "grafana", week, now)
    vercel_metrics(vercel_data, snapshot, vercel_capture)
    try:
        snapshot.metrics["grafana.frontend_sessions"] = grafana_metric(grafana_data, snapshot)
    except CoverageError as error:
        if not allow_missing_grafana:
            raise
        snapshot.metrics["grafana.frontend_sessions"] = replace(
            snapshot.metrics["grafana.frontend_sessions"],
            notes="Operator approved missing Grafana coverage. " + str(error), method="api",
        )
    snapshot = replace(snapshot, captured_at=max(vercel_capture, grafana_capture))
    return ops.parse_snapshot(snapshot.json_data(), now)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--week", type=date.fromisoformat, required=True)
    parser.add_argument("--vercel", type=Path, required=True)
    parser.add_argument("--grafana", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True, help="New snapshot input below .tmp/.")
    parser.add_argument("--allow-missing-grafana", action="store_true",
                        help="Only after operator approval: leave incomplete Grafana coverage missing.")
    args = parser.parse_args()
    try:
        output = args.output.resolve()
        if not output.is_relative_to(fetcher.SCRATCH.resolve()) or output == fetcher.SCRATCH.resolve():
            raise ValueError("Snapshot drafts must be saved below this repository's .tmp/ directory.")
        if output.exists():
            raise ValueError("Output already exists; choose a new snapshot draft.")
        snapshot = normalize(args.vercel, args.grafana, args.week, datetime.now(ops.UTC), args.allow_missing_grafana)
        output.parent.mkdir(parents=True, exist_ok=True)
        with output.open("x", encoding="utf-8") as destination:
            destination.write(json.dumps(snapshot.json_data(), indent=2, allow_nan=False) + "\n")
        print(f"Normalized {sum(m.status == 'complete' for m in snapshot.metrics.values())}/"
              f"{len(snapshot.metrics)} measurements to {args.output}. No report history was saved.")
    except (ValueError, OSError, TypeError, KeyError, AttributeError, OverflowError) as error:
        parser.exit(1, f"error: {error}\nPause and resolve access/coverage before saving history.\n")


if __name__ == "__main__":
    main()
