import contextlib
import importlib.util
import io
import unittest
from datetime import date, datetime, timedelta
from pathlib import Path

MODULE_PATH = Path(__file__).with_name("weekly_mhr_loops.py")
SPEC = importlib.util.spec_from_file_location("weekly_mhr_loops", MODULE_PATH)
assert SPEC and SPEC.loader
mhr = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(mhr)


def metrics(deliveries: int, hard: int = 0, soft: int = 0, sends: int | None = None) -> dict:
    if sends is None:
        sends = deliveries + hard + soft
    return {
        "sends": sends,
        "deliveries": deliveries,
        "spamReports": 0,
        "hardBounces": hard,
        "softBounces": soft,
    }


def snapshot(taken_at: str, **templates: dict) -> dict:
    return {"takenAt": taken_at, "templates": templates}


class WeekBoundsTest(unittest.TestCase):
    def test_last_complete_week_on_monday_evening(self) -> None:
        now = datetime(2026, 10, 12, 21, 0, tzinfo=mhr.SYDNEY)
        start, end = mhr.last_complete_week(now)
        self.assertEqual(start, datetime(2026, 10, 5, tzinfo=mhr.SYDNEY))
        self.assertEqual(end, datetime(2026, 10, 12, tzinfo=mhr.SYDNEY))

    def test_last_complete_week_on_sunday_is_the_week_before(self) -> None:
        now = datetime(2026, 10, 11, 18, 0, tzinfo=mhr.SYDNEY)
        start, end = mhr.last_complete_week(now)
        self.assertEqual(start, datetime(2026, 9, 28, tzinfo=mhr.SYDNEY))
        self.assertEqual(end, datetime(2026, 10, 5, tzinfo=mhr.SYDNEY))

    def test_week_containing_crosses_daylight_saving(self) -> None:
        start, end = mhr.week_containing(date(2026, 9, 30))
        self.assertEqual(start, datetime(2026, 9, 28, tzinfo=mhr.SYDNEY))
        self.assertEqual(end, datetime(2026, 10, 5, tzinfo=mhr.SYDNEY))
        self.assertEqual(start.utcoffset().total_seconds(), 10 * 3600)
        self.assertEqual(end.utcoffset().total_seconds(), 11 * 3600)


class BaselineSelectionTest(unittest.TestCase):
    def test_ignores_a_reading_from_earlier_this_week(self) -> None:
        now = datetime(2026, 10, 12, 21, 0, tzinfo=mhr.SYDNEY)
        recent = snapshot("2026-10-10T21:00:00+11:00")
        self.assertIsNone(mhr.weekly_baseline([recent], now))

    def test_uses_the_latest_reading_at_least_six_days_old(self) -> None:
        now = datetime(2026, 10, 12, 21, 0, tzinfo=mhr.SYDNEY)
        older = snapshot("2026-10-05T09:00:00+11:00")
        newer = snapshot("2026-10-05T21:00:00+11:00")
        self.assertEqual(mhr.weekly_baseline([older, newer], now), newer)

    def test_rejects_a_snapshot_older_than_ten_days(self) -> None:
        now = datetime(2026, 10, 19, 21, 0, tzinfo=mhr.SYDNEY)
        stale = snapshot("2026-10-05T21:00:00+11:00")
        self.assertIsNone(mhr.weekly_baseline([stale], now))

    def test_prefers_the_week_old_snapshot_over_an_older_one(self) -> None:
        now = datetime(2026, 10, 19, 21, 0, tzinfo=mhr.SYDNEY)
        stale = snapshot("2026-10-05T21:00:00+11:00")
        weekly = snapshot("2026-10-12T21:00:00+11:00")
        self.assertEqual(mhr.weekly_baseline([stale, weekly], now), weekly)

    def test_stale_baseline_is_not_described_as_recent(self) -> None:
        now = datetime(2026, 10, 19, 21, 0, tzinfo=mhr.SYDNEY)
        current = full_snapshot(now.isoformat())
        stale = full_snapshot((now - timedelta(days=14)).isoformat())
        output = io.StringIO()
        with contextlib.redirect_stdout(output):
            mhr.print_loops_delta(None, current, [stale])
        text = output.getvalue()
        self.assertIn("more than ten days ago", text)
        self.assertNotIn("under six days", text)


def full_snapshot(taken_at: str) -> dict:
    templates = {}
    for _name, template_ids in mhr.SECTIONS:
        for template_id in template_ids:
            templates[template_id] = {"name": template_id, **metrics(0)}
    return snapshot(taken_at, **templates)


class DeliveryRowTest(unittest.TestCase):
    def test_zero_sends_match_the_sheet(self) -> None:
        self.assertEqual(
            mhr.delivery_row(0, 0),
            {
                "successful_sends": 0,
                "successful_deliverability": 100,
                "unsuccessful_sends": 0,
                "unsuccessful_deliverability": 0,
            },
        )

    def test_section_delta_uses_deliveries_and_bounces(self) -> None:
        payment = mhr.SECTIONS[0][1][0]
        before = snapshot("2026-10-05T00:00:00+11:00", **{payment: metrics(100, hard=2, soft=1)})
        after = snapshot("2026-10-12T00:00:00+11:00", **{payment: metrics(340, hard=2, soft=3)})
        row = mhr.section_delta(before, after, (payment,))
        self.assertEqual(row["successful_sends"], 240)
        self.assertEqual(row["unsuccessful_sends"], 2)
        self.assertEqual(row["successful_deliverability"], 99)
        self.assertEqual(row["unsuccessful_deliverability"], 1)
        self.assertEqual(row["sends"], 242)


class BackendLogCountTest(unittest.TestCase):
    def test_payment_queries_read_text_payload_and_skip_organiser_copies(self) -> None:
        self.assertIn('textPayload:"Successfully sent purchase email for order"', mhr.LOG_QUERIES["payment_ok"])
        failure = mhr.LOG_QUERIES["payment_fail"]
        self.assertIn('textPayload:"Failed to send purchase email"', failure)
        self.assertNotIn("Failed to send copy of purchase email", failure)

    def test_event_retry_success_is_accepted(self) -> None:
        self.assertIn("Loops API retry response status: 200", mhr.LOG_QUERIES["event_ok"])
        self.assertNotIn("retry response status", mhr.LOG_QUERIES["event_status"])
        rows = {
            name: (accepted, rejected)
            for name, accepted, rejected in mhr.backend_rows_from_counts(
                {
                    "payment_ok": 0,
                    "payment_fail": 0,
                    "reminder_ok": 4,
                    "reminder_fail": 1,
                    "event_ok": 3,
                    "event_status": 4,
                }
            )
        }
        self.assertEqual(rows["Loops Event"], (3, 1))
        self.assertEqual(rows["Loops Reminder"], (4, 1))

    def test_reminder_counts_explicit_successes(self) -> None:
        self.assertIn("Successfully sent event reminder for eventId=", mhr.LOG_QUERIES["reminder_ok"])
        self.assertNotIn("Sending Loops transactional email", mhr.LOG_QUERIES["reminder_ok"])


if __name__ == "__main__":
    unittest.main()
