#!/usr/bin/env python3
"""Print the weekly MHR Loops section.

Loops' metrics API returns all-time deliveries and bounces, with no date
filter. Each run stores those totals and, from the second run on, prints the
change since the previous reading. That change is the Payment, Reminder, and
Event block in the weekly sheet.

The same command also counts sends our production logs recorded for a Sydney
week. Those counts are accepted API calls, not Loops bounce data.
"""

from __future__ import annotations

import argparse
import json
import os
import subprocess
import sys
import urllib.error
import urllib.request
from concurrent.futures import ThreadPoolExecutor
from datetime import date, datetime, timedelta
from pathlib import Path
from zoneinfo import ZoneInfo

SYDNEY = ZoneInfo("Australia/Sydney")
LOOPS_API = "https://app.loops.so/api/v1"
USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36"
)
PROJECT = "socialsportsprod"
LOG_LIMIT = 20000
# A Monday run should sit about seven days after the previous one. Younger
# readings are not a full week, and older ones fold missed weeks into one delta.
MIN_BASELINE_AGE = timedelta(days=6)
MAX_BASELINE_AGE = timedelta(days=10)

# Sheet rows, in order. Each id is one Loops transactional email.
SECTIONS = (
    ("Loops Payment", ("cm4r78nk301ehx79nrrxaijgl",)),  # SPORTSHUB Payment Confirmation
    ("Loops Reminder", ("cm5dwlbsj034sasyzg1w6sg39",)),  # SPORTSHUB Event Reminder
    ("Loops Event", ("cmd2y9sms12mxux0i3tcmdp9v",)),  # SPORTSHUB Event Creation Notification
)

METRIC_FIELDS = ("sends", "deliveries", "spamReports", "hardBounces", "softBounces")


def sydney_midnight(day: date) -> datetime:
    return datetime(day.year, day.month, day.day, tzinfo=SYDNEY)


def last_complete_week(now: datetime) -> tuple[datetime, datetime]:
    """Monday 00:00 to the next Monday 00:00, ending at the current week's Monday."""
    local = now.astimezone(SYDNEY)
    this_monday = sydney_midnight(local.date() - timedelta(days=local.weekday()))
    return this_monday - timedelta(days=7), this_monday


def week_containing(day: date) -> tuple[datetime, datetime]:
    monday = day - timedelta(days=day.weekday())
    start = sydney_midnight(monday)
    return start, start + timedelta(days=7)


def percent(part: int, whole: int) -> int:
    if whole <= 0:
        return 0
    return (part * 100 + whole // 2) // whole


def delivery_row(successful: int, unsuccessful: int) -> dict[str, int]:
    total = successful + unsuccessful
    if total == 0:
        return {
            "successful_sends": 0,
            "successful_deliverability": 100,
            "unsuccessful_sends": 0,
            "unsuccessful_deliverability": 0,
        }
    successful_pct = percent(successful, total)
    return {
        "successful_sends": successful,
        "successful_deliverability": successful_pct,
        "unsuccessful_sends": unsuccessful,
        "unsuccessful_deliverability": 100 - successful_pct,
    }


def empty_metrics() -> dict[str, int]:
    return {field: 0 for field in METRIC_FIELDS}


def add_metrics(left: dict[str, int], right: dict[str, int]) -> dict[str, int]:
    return {field: left.get(field, 0) + right.get(field, 0) for field in METRIC_FIELDS}


def section_totals(snapshot: dict, template_ids: tuple[str, ...]) -> dict[str, int]:
    templates = snapshot.get("templates") or {}
    total = empty_metrics()
    for template_id in template_ids:
        total = add_metrics(total, templates.get(template_id) or empty_metrics())
    return total


def section_delta(before: dict, after: dict, template_ids: tuple[str, ...]) -> dict[str, int]:
    previous = section_totals(before, template_ids)
    current = section_totals(after, template_ids)
    delta = {field: current[field] - previous[field] for field in METRIC_FIELDS}
    # Delivered sends are the sheet's successful row. Bounces are the unsuccessful row.
    row = delivery_row(delta["deliveries"], delta["hardBounces"] + delta["softBounces"])
    row["sends"] = delta["sends"]
    return row


def format_section(name: str, row: dict[str, int]) -> str:
    return "\n".join(
        (
            name,
            f"  Successful Sends: {row['successful_sends']}",
            f"  Successful Deliverability (%): {row['successful_deliverability']}",
            f"  Unsuccessful Sends: {row['unsuccessful_sends']}",
            f"  Unsuccessful Deliverability (%): {row['unsuccessful_deliverability']}",
        )
    )


def load_api_key(env_file: Path) -> str:
    if os.environ.get("LOOPS_API_KEY"):
        return os.environ["LOOPS_API_KEY"]
    if not env_file.is_file():
        raise SystemExit(f"LOOPS_API_KEY is not set and {env_file} was not found.")
    for line in env_file.read_text().splitlines():
        if line.startswith("LOOPS_API_KEY="):
            return line.split("=", 1)[1].strip().strip('"').strip("'")
    raise SystemExit(f"LOOPS_API_KEY is missing from {env_file}.")


def loops_get(api_key: str, path: str) -> dict:
    request = urllib.request.Request(
        LOOPS_API + path,
        headers={
            "Authorization": "Bearer " + api_key,
            "Accept": "application/json",
            "User-Agent": USER_AGENT,
        },
    )
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return json.load(response)
    except urllib.error.HTTPError as error:
        detail = error.read().decode("utf-8", errors="replace")[:300]
        raise SystemExit(f"Loops {path} returned {error.code}: {detail}") from error


def fetch_snapshot(api_key: str, taken_at: datetime) -> dict:
    listed = loops_get(api_key, "/transactional?perPage=50")
    names = {item["id"]: item.get("name") or item["id"] for item in listed.get("data") or []}
    templates = {}
    for _name, template_ids in SECTIONS:
        for template_id in template_ids:
            metrics = loops_get(api_key, f"/transactional-emails/{template_id}/metrics")
            templates[template_id] = {
                "name": names.get(template_id, template_id),
                **{field: int(metrics.get(field) or 0) for field in METRIC_FIELDS},
            }
    return {"takenAt": taken_at.astimezone(SYDNEY).isoformat(), "templates": templates}


def load_snapshots(path: Path) -> list[dict]:
    if not path.is_file():
        return []
    payload = json.loads(path.read_text())
    return list(payload.get("snapshots") or [])


def save_snapshots(path: Path, snapshots: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps({"snapshots": snapshots}, indent=2) + "\n")


def log_count(start: datetime, end: datetime, log_filter: str) -> int:
    query = (
        f'timestamp>="{start.astimezone(ZoneInfo("UTC")).strftime("%Y-%m-%dT%H:%M:%SZ")}" '
        f'AND timestamp<"{end.astimezone(ZoneInfo("UTC")).strftime("%Y-%m-%dT%H:%M:%SZ")}" '
        f"AND {log_filter}"
    )
    result = subprocess.run(
        [
            "gcloud",
            "logging",
            "read",
            query,
            f"--project={PROJECT}",
            f"--limit={LOG_LIMIT}",
            "--format=value(timestamp)",
            "--order=asc",
        ],
        check=False,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        message = (result.stderr or result.stdout).strip()
        raise SystemExit(f"gcloud logging read failed: {message}")
    lines = [line for line in result.stdout.splitlines() if line.strip()]
    if len(lines) >= LOG_LIMIT:
        print(
            f"Warning: log query hit {LOG_LIMIT} entries and may be short.",
            file=sys.stderr,
        )
    return len(lines)


# Java purchase logs are plain text on stripewebhookendpoint. The buyer
# confirmation is the payment row; an organiser-copy failure is a different send.
# Event creation logs the first response as "Loops API response status:" and a
# later attempt as "Loops API retry response status:". A 200 on either is accepted.
LOG_QUERIES = {
    "payment_ok": (
        'resource.labels.service_name="stripewebhookendpoint" '
        'AND (jsonPayload.message:"Successfully sent purchase email for order" '
        'OR textPayload:"Successfully sent purchase email for order")'
    ),
    "payment_fail": (
        'resource.labels.service_name="stripewebhookendpoint" '
        'AND (jsonPayload.message:"Failed to send purchase email" '
        'OR textPayload:"Failed to send purchase email")'
    ),
    "reminder_ok": (
        'resource.labels.service_name="email-reminder" '
        'AND (textPayload:"Successfully sent event reminder for eventId=" '
        'OR jsonPayload.message:"Successfully sent event reminder for eventId=")'
    ),
    "reminder_fail": (
        'resource.labels.service_name="email-reminder" '
        'AND (textPayload:"Failed to send event reminder" '
        'OR jsonPayload.message:"Failed to send event reminder")'
    ),
    "event_ok": (
        'resource.labels.service_name="send-email-on-create-event-v2" '
        'AND (textPayload:"Loops API response status: 200" '
        'OR jsonPayload.message:"Loops API response status: 200" '
        'OR textPayload:"Loops API retry response status: 200" '
        'OR jsonPayload.message:"Loops API retry response status: 200")'
    ),
    "event_status": (
        'resource.labels.service_name="send-email-on-create-event-v2" '
        'AND (textPayload:"Loops API response status:" '
        'OR jsonPayload.message:"Loops API response status:")'
    ),
}


def backend_rows_from_counts(counts: dict[str, int]) -> list[tuple[str, int, int]]:
    return [
        ("Loops Payment", counts["payment_ok"], counts["payment_fail"]),
        ("Loops Reminder", counts["reminder_ok"], counts["reminder_fail"]),
        (
            "Loops Event",
            counts["event_ok"],
            max(counts["event_status"] - counts["event_ok"], 0),
        ),
    ]


def backend_send_rows(start: datetime, end: datetime) -> list[tuple[str, int, int]]:
    with ThreadPoolExecutor(max_workers=len(LOG_QUERIES)) as pool:
        counts = {
            name: pool.submit(log_count, start, end, query) for name, query in LOG_QUERIES.items()
        }
        resolved = {name: future.result() for name, future in counts.items()}
    return backend_rows_from_counts(resolved)


def format_week(start: datetime, end: datetime) -> str:
    start_local = start.astimezone(SYDNEY)
    end_local = (end - timedelta(seconds=1)).astimezone(SYDNEY)
    return f"{start_local:%a %-d %b %Y} – {end_local:%a %-d %b %Y}"


def snapshot_day(snapshot: dict) -> date:
    return datetime.fromisoformat(snapshot["takenAt"]).astimezone(SYDNEY).date()


def weekly_baseline(snapshots: list[dict], now: datetime) -> dict | None:
    """Latest reading from the previous week.

    All-time Loops counters have no dates, so a baseline older than
    MAX_BASELINE_AGE would add the missed weeks into this week's delta.
    """
    earliest = now - MAX_BASELINE_AGE
    latest = now - MIN_BASELINE_AGE
    eligible = [
        snapshot
        for snapshot in snapshots
        if earliest <= datetime.fromisoformat(snapshot["takenAt"]) <= latest
    ]
    return eligible[-1] if eligible else None


def print_loops_delta(previous: dict | None, current: dict, earlier: list[dict]) -> None:
    if previous is None:
        if earlier:
            taken = datetime.fromisoformat(earlier[-1]["takenAt"])
            current_taken = datetime.fromisoformat(current["takenAt"])
            if current_taken - taken > MAX_BASELINE_AGE:
                print(f"Latest Loops reading is {taken:%a %-d %b %Y %H:%M %Z}, more than ten days ago.")
                print("A weekly delivery change needs a baseline from the last ten days.")
                print(
                    "This reading is older, so the delta is left out. "
                    "All-time counters cannot be split into the missing weeks."
                )
            else:
                print(f"Latest Loops reading is {taken:%a %-d %b %Y %H:%M %Z}, under six days ago.")
                print("The weekly delivery change will show once that reading is six days old.")
        else:
            taken = datetime.fromisoformat(current["takenAt"])
            print(f"Saved a Loops delivery baseline at {taken:%a %-d %b %Y %H:%M %Z}.")
            print("Loops only returns all-time totals, so this run has no weekly delta yet.")
            print("Run it again next week. The three sections will be the change since this baseline.")
        print("Templates:")
        for name, template_ids in SECTIONS:
            labels = ", ".join(
                current["templates"][template_id]["name"] for template_id in template_ids
            )
            print(f"  {name}: {labels}")
        return

    previous_taken = datetime.fromisoformat(previous["takenAt"])
    print(f"Loops delivery change since {previous_taken:%a %-d %b %Y %H:%M %Z}")
    print("Successful sends are deliveries. Unsuccessful sends are hard plus soft bounces.")
    for name, template_ids in SECTIONS:
        print(format_section(name, section_delta(previous, current, template_ids)))
        print()


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(description="Print the weekly MHR Loops section.")
    parser.add_argument(
        "--week",
        help="Sydney week to count in backend logs, as the Monday date YYYY-MM-DD. "
        "Defaults to the last complete Monday–Sunday week.",
    )
    parser.add_argument(
        "--this-week",
        action="store_true",
        help="Count backend logs for the Sydney week in progress instead of the last complete week.",
    )
    parser.add_argument(
        "--logs-only",
        action="store_true",
        help="Skip the Loops API and only print backend send logs.",
    )
    parser.add_argument(
        "--snapshot",
        type=Path,
        default=Path.home() / ".config" / "sportshub-cli" / "mhr-loops-snapshots.json",
        help="Where all-time Loops readings are stored.",
    )
    parser.add_argument(
        "--env-file",
        type=Path,
        default=Path(__file__).resolve().parents[1] / "functions" / ".env",
        help="Env file used when LOOPS_API_KEY is not already set.",
    )
    args = parser.parse_args(argv)

    now = datetime.now(SYDNEY)
    if args.week and args.this_week:
        raise SystemExit("Pass either --week or --this-week.")
    if args.week:
        start, end = week_containing(date.fromisoformat(args.week))
    elif args.this_week:
        start, _end = week_containing(now.date())
        end = now
    else:
        start, end = last_complete_week(now)

    if not args.logs_only:
        api_key = load_api_key(args.env_file)
        current = fetch_snapshot(api_key, now)
        snapshots = load_snapshots(args.snapshot)
        previous = weekly_baseline(snapshots, now)
        earlier = [snapshot for snapshot in snapshots if snapshot_day(snapshot) < now.date()]
        print_loops_delta(previous, current, earlier)
        kept = [snapshot for snapshot in snapshots if snapshot_day(snapshot) != now.date()]
        kept.append(current)
        save_snapshots(args.snapshot, kept)
        print()

    print(f"Backend send log for {format_week(start, end)} (Australia/Sydney)")
    print("Accepted sends can go in Successful Sends.")
    print("Rejections are Loops API failures, not bounces, so they are not the unsuccessful deliverability row.")
    print("Payment is the buyer confirmation only. Event is the creation email only.")
    for name, accepted, rejected in backend_send_rows(start, end):
        print(name)
        print(f"  Accepted sends: {accepted}")
        print(f"  Rejected by Loops: {rejected}")
        print()


if __name__ == "__main__":
    main()
