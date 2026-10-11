from copy import deepcopy
from dataclasses import replace
from datetime import date, datetime, timedelta
import json
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
import unittest

import weekly_ops as ops


NOW = datetime(2026, 10, 11, 12, tzinfo=ops.UTC)
WEEK = date(2026, 9, 28)
KEY = "vercel_project.fast_data_transfer"


def snapshot(week=WEEK, value=10):
    result = ops.template(week, NOW)
    result.metrics[KEY] = replace(
        result.metrics[KEY], value=value, status="complete",
        definition="weekly-consumption-v1", method="browser", notes="Source reconciled.",
    )
    return result


class WeeklyOpsTest(unittest.TestCase):
    def setUp(self):
        scratch = Path(__file__).resolve().parents[4] / ".tmp"
        scratch.mkdir(exist_ok=True)
        self.temporary = TemporaryDirectory(dir=scratch)
        self.addCleanup(self.temporary.cleanup)
        self.history = Path(self.temporary.name) / "history"

    def test_completed_utc_week_spans_sydney_dst_without_changing_duration(self):
        result = ops.template(WEEK, NOW)
        self.assertEqual(ops.iso(result.start), "2026-09-28T00:00:00Z")
        self.assertEqual(ops.iso(result.end), "2026-10-05T00:00:00Z")
        self.assertEqual(result.end - result.start, timedelta(hours=168))
        self.assertEqual(ops.parse_snapshot(result.json_data(), NOW), result)
        for week in (date(2026, 9, 29), date(2026, 10, 5)):
            with self.subTest(week=week), self.assertRaises(ValueError):
                ops.template(week, NOW)

    def test_invalid_snapshots_fail_before_writing(self):
        valid = snapshot().json_data()
        cases = []
        for value in (-1, True, float("nan"), float("inf"), "10"):
            data = deepcopy(valid)
            data["metrics"][KEY]["value"] = value
            cases.append(data)
        for field, value in (
            ("status", "missing"), ("definition", "unverified"),
            ("method", "unavailable"), ("value", None), ("scope", ""),
            ("source_url", ops.PROJECT_URL + "?token=secret"),
        ):
            data = deepcopy(valid)
            data["metrics"][KEY][field] = value
            cases.append(data)
        for field, value in (("schema_version", True), ("captured_at", "2026-10-01T00:00:00Z")):
            data = deepcopy(valid)
            data[field] = value
            cases.append(data)
        for field, value in (("end", "2026-10-04T23:59:59Z"), ("timezone", "Australia/Sydney")):
            data = deepcopy(valid)
            data["period"][field] = value
            cases.append(data)
        incomplete = deepcopy(valid)
        incomplete["metrics"].pop("grafana.frontend_sessions")
        cases.append(incomplete)
        for index, data in enumerate(cases):
            with self.subTest(index=index), self.assertRaises(ValueError):
                ops.parse_snapshot(data, NOW)
        self.assertFalse(self.history.exists())

    def test_zero_baseline_has_absolute_change_without_percentage(self):
        current = snapshot(value=5).metrics[KEY]
        baseline = snapshot(value=0).metrics[KEY]
        self.assertEqual(ops.change(current, baseline), "+5 GB (N/A: zero baseline)")
        self.assertEqual(ops.change(baseline, current), "-5 GB (-100.0%)")
        self.assertEqual(ops.change(baseline, baseline), "+0 GB (N/A: zero baseline)")

    def test_changed_contract_or_incomplete_status_prevents_comparison(self):
        current = snapshot().metrics[KEY]
        for field, value in (
            ("scope", "different-project"), ("unit", "MiB"), ("definition", "monthly-v1"),
            ("status", "partial"), ("status", "stale"), ("status", "missing"),
        ):
            with self.subTest(field=field, value=value):
                baseline = replace(current, **{field: value})
                self.assertEqual(ops.change(current, baseline), "N/A")
        self.assertEqual(ops.change(replace(current, status="partial"), current), "N/A")
        self.assertEqual(ops.change(current, None), "N/A")

    def test_missing_previous_week_does_not_substitute_an_older_week(self):
        ops.save_report(snapshot(WEEK - timedelta(weeks=2), 8), self.history, 4, NOW)
        result = ops.render_report(snapshot(value=10), self.history, 4, NOW)
        self.assertIn("Vercel SPORTSHUB - Fast data transfer | 10 GB | N/A | N/A | complete", result)
        self.assertIn("N/A -> 8 -> N/A -> 10 | N/A (2/4 comparable weeks)", result)

    def test_complete_four_week_history_and_longer_window(self):
        for offset, value in ((3, 10), (2, 12), (1, 15)):
            ops.save_report(snapshot(WEEK - timedelta(weeks=offset), value), self.history, 4, NOW)
        current = snapshot(value=20)
        result = ops.render_report(current, self.history, 4, NOW)
        self.assertIn("20 GB | 15 GB | +5 GB (+33.3%)", result)
        self.assertIn("10 -> 12 -> 15 -> 20 | +10 GB (+100.0%)", result)
        longer = ops.render_report(current, self.history, 12, NOW)
        self.assertIn("N/A (4/12 comparable weeks)", longer)
        for weeks in (1, 53):
            with self.subTest(weeks=weeks), self.assertRaises(ValueError):
                ops.render_report(current, self.history, weeks, NOW)

    def test_changed_historical_scope_is_a_trend_gap(self):
        old = snapshot(WEEK - timedelta(weeks=1), 10)
        old.metrics[KEY] = replace(old.metrics[KEY], scope="another-project")
        ops.save_report(old, self.history, 4, NOW)
        result = ops.render_report(snapshot(value=20), self.history, 4, NOW)
        self.assertIn("N/A -> N/A -> N/A -> 20 | N/A (1/4 comparable weeks)", result)

    def test_idempotent_save_preserves_assessment_and_conflicts_preserve_both_files(self):
        current = snapshot()
        folder = ops.save_report(current, self.history, 4, NOW)
        report = folder / "report.md"
        report.write_text(report.read_text() + "\n## Assessment\nReviewed by the agent.\n")
        original = {path.name: path.read_bytes() for path in folder.iterdir()}
        self.assertEqual(ops.save_report(current, self.history, 4, NOW), folder)
        with self.assertRaises(ValueError):
            ops.save_report(snapshot(value=11), self.history, 4, NOW)
        self.assertEqual({path.name: path.read_bytes() for path in folder.iterdir()}, original)
        self.assertEqual(ops.check_history(self.history, NOW), 1)

    def test_mislabeled_or_corrupt_history_fails_without_new_output(self):
        previous = WEEK - timedelta(weeks=1)
        folder = self.history / str(previous)
        folder.mkdir(parents=True)
        (folder / "snapshot.json").write_text(json.dumps(snapshot().json_data()))
        (folder / "report.md").write_text("Mislabeled historical report")
        with self.assertRaisesRegex(ValueError, "directory and snapshot week differ"):
            ops.save_report(snapshot(), self.history, 4, NOW)
        self.assertFalse((self.history / str(WEEK)).exists())
        (folder / "snapshot.json").write_text("{broken json")
        with self.assertRaises(ValueError):
            ops.render_report(snapshot(), self.history, 4, NOW)

    def test_cli_save_render_and_check_use_isolated_history(self):
        input_file = Path(self.temporary.name) / "input.json"
        current = snapshot()
        input_file.write_text(json.dumps(replace(current, captured_at=current.end).json_data()))
        script = Path(ops.__file__)
        for arguments in (
            ("save", "--input", str(input_file)),
            ("render", "--input", str(input_file), "--trend-weeks", "12"),
            ("check",),
        ):
            result = subprocess.run(
                [sys.executable, str(script), *arguments, "--history", str(self.history)],
                capture_output=True, text=True,
            )
            self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn("Validated 1 weekly snapshots", result.stdout)
        self.assertTrue((self.history / "2026-09-28/report.md").is_file())

    def test_check_rejects_orphan_reports_and_unexpected_exports(self):
        previous_week = WEEK - timedelta(weeks=1)
        previous = snapshot(previous_week)
        folder = self.history / str(previous_week)
        folder.mkdir(parents=True)
        (folder / "report.md").write_text("An orphan report")
        with self.assertRaisesRegex(ValueError, "must contain only"):
            ops.check_history(self.history, NOW)
        (folder / "snapshot.json").write_text(json.dumps(previous.json_data()))
        self.assertEqual(ops.check_history(self.history, NOW), 1)
        (folder / "raw-export.csv").write_text("Unnormalized export")
        with self.assertRaisesRegex(ValueError, "must contain only"):
            ops.check_history(self.history, NOW)
        with self.assertRaisesRegex(ValueError, "must contain only"):
            ops.save_report(previous, self.history, 4, NOW)
        with self.assertRaisesRegex(ValueError, "must contain only"):
            ops.render_report(snapshot(), self.history, 4, NOW)


if __name__ == "__main__":
    unittest.main()
