from copy import deepcopy
from dataclasses import replace
from datetime import date, datetime, timedelta
from io import BytesIO
import json
import os
from pathlib import Path
import subprocess
import sys
from tempfile import TemporaryDirectory
import unittest
from unittest.mock import patch
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlsplit

import fetch_usage as fetcher
import normalize_usage as normalizer
import weekly_ops as ops


NOW = datetime(2026, 10, 11, 12, tzinfo=ops.UTC)
WEEK = date(2026, 9, 28)
KEY = "vercel_project.api_outgoing_bandwidth"


def snapshot(week=WEEK, value=10):
    result = ops.template(week, NOW)
    result.metrics[KEY] = replace(
        result.metrics[KEY], value=value, status="complete",
        definition="vercel-usage-v2-counters-v1", method="api", notes="Seven daily buckets.",
    )
    return result


def vercel_payload():
    start, end = ops.bounds(WEEK, NOW)
    counters = dict.fromkeys((
        "request_hit_count", "request_miss_count", "bandwidth_incoming_bytes", "bandwidth_outgoing_bytes",
        "function_invocation_successful_count", "function_invocation_error_count",
        "function_invocation_timeout_count", "function_invocation_throttle_count",
        "function_execution_successful_gb_hours", "function_execution_error_gb_hours",
        "function_execution_timeout_gb_hours",
    ), 1)
    return {"granularity": "day", "lastUpdate": ops.iso(end), "data": [
        {"date": ops.iso(start + timedelta(days=day)), **counters,
         "breakdown": {"bandwidth": [{"id": "unrelated-project", "percent": 100}]}}
        for day in range(7)
    ]}


def panel_payload():
    return {"dashboard": {"timezone": "utc", "panels": [{"panels": [{
        "id": 95, "title": "Total Sessions Ingested by day",
        "targets": [{"expr": fetcher.GRAFANA_EXPR.replace('1030328', '$org_id'),
                     "interval": "1d", "datasource": {"uid": "grafanacloud-usage"}}],
    }]}]}}


def grafana_payload():
    start, _ = ops.bounds(WEEK, NOW)
    times = [int((start + timedelta(days=day)).timestamp() * 1000) for day in range(8)]
    frames = []
    for labels, values in (({}, [0] * 8), ({"id": "1", "appName": "preview"}, [0, 1.25, 2, 3, 4, 5, 6, 999]),
                           ({"id": "1", "appName": "production"}, [10] * 7 + [999])):
        frames.append({"schema": {"fields": [
            {"type": "time", "config": {"interval": 86400000}}, {"type": "number", "labels": labels},
        ], "meta": {"executedQueryString": "Expr: " + fetcher.GRAFANA_EXPR + "\nStep: 24h0m0s"}},
            "data": {"values": [times[:], values]}})
    return {"results": {"A": {"status": 200, "frames": frames}}}


class WeeklyOpsTest(unittest.TestCase):
    def setUp(self):
        scratch = Path(__file__).resolve().parents[4] / ".tmp"
        scratch.mkdir(exist_ok=True)
        self.temporary = TemporaryDirectory(dir=scratch)
        self.addCleanup(self.temporary.cleanup)
        self.history = Path(self.temporary.name) / "history"

    def test_completed_utc_week_spans_sydney_dst_without_changing_duration(self):
        self.assertEqual(ops.latest_completed_week(NOW), WEEK)
        self.assertEqual(ops.latest_completed_week(NOW + timedelta(days=1)), date(2026, 10, 5))
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
        count = replace(current, value=2_345_678, unit="count")
        prior_count = replace(count, value=1_111_111)
        self.assertEqual(ops.change(count, prior_count), "+1,234,567 count (+111.1%)")
        self.assertEqual(ops.number(count.value, count.unit), "2,345,678")
        self.assertEqual(ops.number(91.25, "count"), "91.25")

    def test_changed_contract_or_incomplete_status_prevents_comparison(self):
        current = snapshot().metrics[KEY]
        for method in ("api", "mcp", "cli", "browser"):
            observed = snapshot()
            observed.metrics[KEY] = replace(current, method=method)
            self.assertEqual(ops.parse_snapshot(observed.json_data(), NOW), observed)
            self.assertTrue(ops.comparable(current, observed.metrics[KEY]))
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
        self.assertIn("Vercel SPORTSHUB - API outgoing bandwidth | 10 GB | N/A | N/A | complete", result)
        self.assertIn("N/A -> 8 -> N/A -> 10 | N/A (2/4 comparable weeks)", result)

    def test_complete_four_week_history_and_longer_window(self):
        for offset, value in ((3, 10), (2, 12), (1, 15)):
            ops.save_report(snapshot(WEEK - timedelta(weeks=offset), value), self.history, 4, NOW)
        current = snapshot(value=20)
        count_key = "vercel_project.api_requests"
        current.metrics[count_key] = replace(current.metrics[KEY], value=1_234_567, unit="count")
        result = ops.render_report(current, self.history, 4, NOW)
        self.assertIn("API requests (hits + misses) | 1,234,567 count", result)
        self.assertIn("N/A -> N/A -> N/A -> 1,234,567", result)
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
        rechecked = replace(current, captured_at=NOW + timedelta(minutes=1), metrics=dict(current.metrics))
        rechecked.metrics[KEY] = replace(
            rechecked.metrics[KEY], method="mcp", source_url="https://api.vercel.com/v2/usage",
            notes="Fresh collection; source lastUpdate advanced.",
        )
        for observed in (current, rechecked):
            with self.subTest(captured=observed.captured_at):
                self.assertEqual(ops.save_report(observed, self.history, 4, NOW + timedelta(minutes=1)), folder)
                self.assertEqual({path.name: path.read_bytes() for path in folder.iterdir()}, original)
        for field, value in (
            ("value", 11), ("status", "partial"), ("scope", "different-project"),
            ("unit", "GiB"), ("definition", "different-measurement-v1"),
        ):
            changed = replace(current, metrics=dict(current.metrics))
            changed.metrics[KEY] = replace(changed.metrics[KEY], **{field: value})
            with self.subTest(field=field), self.assertRaisesRegex(ValueError, "review a correction"):
                ops.save_report(changed, self.history, 4, NOW)
            self.assertEqual({path.name: path.read_bytes() for path in folder.iterdir()}, original)
        with self.assertRaisesRegex(ValueError, "review a correction"):
            ops.save_report(ops.template(WEEK, NOW, schema_version=1), self.history, 4, NOW)
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
        folder = self.history / "2026-09-28"
        original = {path.name: path.read_bytes() for path in folder.iterdir()}
        input_file.write_text(json.dumps(current.json_data()))
        result = subprocess.run(
            [sys.executable, str(script), "save", "--input", str(input_file), "--history", str(self.history)],
            capture_output=True, text=True,
        )
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual({path.name: path.read_bytes() for path in folder.iterdir()}, original)

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

    def test_request_plan_pins_account_and_completed_utc_window_without_credentials(self):
        with patch.dict(os.environ, {"VERCEL_TOKEN": "example-token"}, clear=True):
            plan = fetcher.request_plan(WEEK, NOW)
        self.assertNotIn("example-token", json.dumps(plan))
        vercel = urlsplit(plan["vercel"]["requests"]["team"]["url"])
        self.assertEqual(vercel.netloc, "api.vercel.com")
        self.assertEqual(vercel.path, "/v2/usage")
        self.assertEqual(parse_qs(vercel.query), {
            "teamId": [fetcher.TEAM_ID], "type": ["requests"], "from": ["2026-09-28T00:00:00.000Z"],
            "to": ["2026-10-05T00:00:00.000Z"],
        })
        project_query = parse_qs(urlsplit(plan["vercel"]["requests"]["project"]["url"]).query)
        self.assertEqual(project_query, {**parse_qs(vercel.query), "projectId": [fetcher.PROJECT_ID]})
        self.assertEqual(plan["grafana"]["requests"]["panel"]["url"], fetcher.GRAFANA_DASHBOARD)
        grafana = plan["grafana"]["requests"]["query"]
        self.assertEqual(grafana["url"], "https://compassdigitalgroup.grafana.net/api/ds/query")
        self.assertEqual((grafana["body"]["from"], grafana["body"]["to"]),
                         ("1790553600000", "1791158400000"))
        query = grafana["body"]["queries"][0]
        self.assertEqual(query["datasource"]["uid"], "grafanacloud-usage")
        self.assertEqual(query["interval"], "1d")
        for week in (date(2026, 9, 29), date(2026, 10, 5)):
            with self.subTest(week=week), self.assertRaises(ValueError):
                fetcher.request_plan(week, NOW)

    def test_fetch_saves_separate_usage_responses_once_without_creating_history(self):
        plan = fetcher.request_plan(WEEK, NOW)["vercel"]
        output = Path(self.temporary.name) / "usage.json"
        team, project = vercel_payload(), vercel_payload()
        project["data"][0]["request_hit_count"] = 0
        with patch.dict(os.environ, {"VERCEL_TOKEN": "example-token"}, clear=True), \
                patch("fetch_usage.build_opener") as opener:
            opener.return_value.open.side_effect = [BytesIO(json.dumps(p).encode()) for p in (team, project)]
            self.assertEqual(fetcher.fetch("vercel", plan, output), 14)
            request = opener.return_value.open.call_args_list[0].args[0]
            self.assertEqual(request.get_header("Authorization"), "Bearer example-token")
            self.assertIsNone(request.data)
            with self.assertRaisesRegex(ValueError, "already exists"):
                fetcher.fetch("vercel", plan, output)
            self.assertEqual(opener.return_value.open.call_count, 2)
        saved = json.loads(output.read_text())
        self.assertEqual(saved["responses"]["team"]["data"], team)
        self.assertEqual(saved["responses"]["project"]["data"], project)
        self.assertNotIn("example-token", output.read_text())
        self.assertFalse(self.history.exists())
        self.assertEqual(fetcher.validate_response("vercel", {"granularity": "day", "data": []}), 0)

    def test_failed_http_or_embedded_query_error_does_not_save_output_or_expose_body(self):
        plan = fetcher.request_plan(WEEK, NOW)["grafana"]
        for error_code in (302, 403, 429):
            output = Path(self.temporary.name) / f"http-{error_code}.json"
            with patch.dict(os.environ, {"GRAFANA_SERVICE_ACCOUNT_TOKEN": "example-token"}, clear=True), \
                    patch("fetch_usage.build_opener") as opener:
                opener.return_value.open.side_effect = HTTPError(
                    plan["requests"]["panel"]["url"], error_code, "sensitive response detail", {}, BytesIO(b"secret"),
                )
                with self.assertRaisesRegex(ValueError, f"HTTP {error_code}") as caught:
                    fetcher.fetch("grafana", plan, output)
                self.assertNotIn("sensitive", str(caught.exception))
                self.assertNotIn("secret", str(caught.exception))
            self.assertFalse(output.exists())
        output = Path(self.temporary.name) / "query-error.json"
        with patch.dict(os.environ, {"GRAFANA_SERVICE_ACCOUNT_TOKEN": "example-token"}, clear=True), \
                patch("fetch_usage.build_opener") as opener:
            opener.return_value.open.side_effect = [BytesIO(json.dumps(panel_payload()).encode()),
                BytesIO(b'{"results":{"A":{"status":403,"error":"denied","frames":[]}}}')]
            with self.assertRaisesRegex(ValueError, "query A failed"):
                fetcher.fetch("grafana", plan, output)
            request = opener.return_value.open.call_args.args[0]
            self.assertEqual(json.loads(request.data), plan["requests"]["query"]["body"])
            self.assertEqual(request.get_header("X-grafana-org-id"), "1")
        self.assertFalse(output.exists())
        self.assertIsNone(fetcher.NoRedirect().redirect_request(None, None, 302, "", {}, "https://other.test"))

    def test_missing_auth_or_raw_output_outside_scratch_fails_before_network_access(self):
        plan = fetcher.request_plan(WEEK, NOW)["vercel"]
        output = Path(self.temporary.name) / "missing-auth.json"
        with patch.dict(os.environ, {}, clear=True), patch("fetch_usage.build_opener") as opener:
            with self.assertRaisesRegex(ValueError, "Set VERCEL_TOKEN"):
                fetcher.fetch("vercel", plan, output)
            with self.assertRaisesRegex(ValueError, "repository's .tmp"):
                fetcher.fetch("vercel", plan, Path(ops.__file__).parent / "raw.json")
            opener.assert_not_called()
        self.assertFalse(output.exists())
        token_file = Path(self.temporary.name) / "token"
        grafana = fetcher.request_plan(WEEK, NOW)["grafana"]
        _, end = ops.bounds(WEEK, NOW)
        with patch("fetch_usage.datetime") as clock, patch("fetch_usage.build_opener") as opener:
            clock.now.return_value = end + timedelta(hours=24) - timedelta(microseconds=1)
            with self.assertRaisesRegex(ValueError, "24-hour delay"):
                fetcher.fetch("grafana", grafana, output)
            opener.assert_not_called()
        self.assertFalse(output.exists())
        token_file.write_text("example-token\n")
        with patch.dict(os.environ, {"VERCEL_TOKEN_FILE": str(token_file)}, clear=True):
            self.assertEqual(fetcher.read_token("VERCEL_TOKEN"), "example-token")
        with patch.dict(os.environ, {"VERCEL_TOKEN": "another-token"}, clear=True):
            self.assertEqual(fetcher.read_token("VERCEL_TOKEN", token_file), "example-token")
            fetcher.preflight({"vercel": token_file, "grafana": token_file})
        with patch.dict(os.environ, {}, clear=True), patch("fetch_usage.build_opener") as opener:
            with self.assertRaises(ValueError) as caught:
                fetcher.preflight({})
            self.assertIn("vercel:", str(caught.exception))
            self.assertIn("grafana:", str(caught.exception))
            self.assertIn("Pause collection", str(caught.exception))
            opener.assert_not_called()
        for token in ("embedded space", "invalid\x00token", "invalid\x7ftoken", "non-ascii-\u00e9"):
            token_file.write_text(token, encoding="utf-8")
            with self.subTest(token=token):
                with self.assertRaisesRegex(ValueError, "printable ASCII"):
                    fetcher.read_token("VERCEL_TOKEN", token_file)
        token_file.write_bytes(b"private-token-\xff")
        with patch.dict(os.environ, {}, clear=True):
            with self.assertRaises(ValueError) as caught:
                fetcher.preflight({"vercel": token_file, "grafana": token_file})
            message = str(caught.exception)
            self.assertIn("vercel: Cannot read VERCEL_TOKEN token file as UTF-8", message)
            self.assertIn("grafana: Cannot read GRAFANA_SERVICE_ACCOUNT_TOKEN token file as UTF-8", message)
            self.assertNotIn("private-token", message)

    def test_response_validation_rejects_non_daily_usage_and_invalid_query_payloads(self):
        for vendor, payload in (
            ("vercel", '{"error":"denied"}'), ("vercel", "not json"),
            ("vercel", '{"granularity":"month","data":[]}'),
            ("grafana", '{"results":{}}'), ("grafana", '{"results":{"A":{"frames":null}}}'),
            ("grafana", '{"results":{"A":{"frames":[],"value":NaN}}}'),
        ):
            with self.subTest(vendor=vendor, payload=payload), self.assertRaises(ValueError):
                fetcher.validate_response(vendor, json.loads(payload, parse_constant=fetcher.reject_constant))
        self.assertEqual(fetcher.validate_response("grafana", {"results": {"A": {"frames": []}}}), 0)

    def api_evidence(self):
        plans = fetcher.request_plan(WEEK, NOW)
        responses = {"vercel": {"team": vercel_payload(), "project": vercel_payload()},
                     "grafana": {"panel": panel_payload(), "query": grafana_payload()}}
        result = {}
        for vendor in plans:
            result[vendor] = {"vendor": vendor, "week": str(WEEK), "captured_at": ops.iso(NOW),
                              "responses": {name: {"request": spec, "data": responses[vendor][name]}
                                            for name, spec in plans[vendor]["requests"].items()}}
        return result

    def normalize_evidence(self, data, **options):
        paths = {}
        for vendor, value in data.items():
            paths[vendor] = Path(self.temporary.name) / (vendor + ".json")
            paths[vendor].write_text(json.dumps(value))
        return normalizer.normalize(paths["vercel"], paths["grafana"], WEEK, NOW, **options)

    def test_api_normalization_keeps_scopes_separate_and_excludes_grafana_fallback_and_end(self):
        data = self.api_evidence()
        data["vercel"]["responses"]["project"]["data"]["data"][0]["request_hit_count"] = 0
        result = self.normalize_evidence(data)
        self.assertEqual(result.schema_version, 2)
        self.assertTrue(all(m.status == "complete" for m in result.metrics.values()))
        self.assertEqual(result.metrics["vercel_team.api_requests"].value, 14)
        self.assertEqual(result.metrics["vercel_project.api_requests"].value, 13)
        self.assertEqual(result.metrics[KEY].value, 7 / 1_000_000_000)
        self.assertEqual(result.metrics["vercel_project.api_function_invocations"].value, 28)
        self.assertEqual(result.metrics["vercel_project.api_function_unsuccessful"].value, 21)
        self.assertEqual(result.metrics["vercel_project.api_function_execution"].value, 21)
        for key, metric in result.metrics.items():
            if key.startswith("vercel_"):
                with self.subTest(metric=key):
                    self.assertEqual("Bytes / 1,000,000,000" in metric.notes, metric.unit == "GB")
        sessions = result.metrics["grafana.frontend_sessions"]
        self.assertEqual(sessions.value, 91.25)
        self.assertIn('[["1", "preview"], ["1", "production"]]', sessions.scope)

    def test_normalization_rejects_wrong_provenance_before_producing_metrics(self):
        _, end = ops.bounds(WEEK, NOW)
        for captured in (end, end + timedelta(hours=24) - timedelta(microseconds=1)):
            data = self.api_evidence()
            data["grafana"]["captured_at"] = ops.iso(captured)
            for allow_missing in (False, True):
                with self.subTest(captured=captured, allow_missing=allow_missing), \
                        self.assertRaisesRegex(ValueError, "24-hour delay"):
                    self.normalize_evidence(data, allow_missing_grafana=allow_missing)
        data = self.api_evidence()
        data["grafana"]["captured_at"] = ops.iso(end + timedelta(hours=24))
        self.assertEqual(self.normalize_evidence(data).metrics["grafana.frontend_sessions"].status, "complete")
        for field, value in (("week", "2026-09-21"), ("vendor", "grafana"),
                             ("captured_at", "2026-10-01T00:00:00Z")):
            data = self.api_evidence()
            data["vercel"][field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                self.normalize_evidence(data)
        data = self.api_evidence()
        data["vercel"]["responses"]["project"]["request"]["url"] = data["vercel"]["responses"]["team"]["request"]["url"]
        with self.assertRaisesRegex(ValueError, "request scope"):
            self.normalize_evidence(data)

    def test_vercel_missing_invalid_stale_and_duplicate_buckets_do_not_become_zero(self):
        for field, value in (("request_hit_count", None), ("request_hit_count", 0.5),
                             ("request_hit_count", True), ("bandwidth_outgoing_bytes", -1),
                             ("function_execution_error_gb_hours", float("nan"))):
            data = self.api_evidence()
            data["vercel"]["responses"]["team"]["data"]["data"][0][field] = value
            with self.subTest(field=field, value=value), self.assertRaises(ValueError):
                self.normalize_evidence(data)
        for kind in ("missing", "duplicate", "outside", "stale", "empty", "monthly"):
            data = self.api_evidence()
            raw = data["vercel"]["responses"]["team"]["data"]
            if kind == "missing":
                raw["data"].pop()
            elif kind == "duplicate":
                raw["data"].append(deepcopy(raw["data"][0]))
            elif kind == "outside":
                raw["data"][0]["date"] = "2026-10-05T00:00:00Z"
            elif kind == "stale":
                raw["lastUpdate"] = "2026-10-04T23:59:59Z"
            elif kind == "empty":
                raw["data"] = []
            else:
                raw["granularity"] = "month"
            with self.subTest(kind=kind), self.assertRaises(ValueError):
                self.normalize_evidence(data)

    def test_grafana_missing_days_need_explicit_partial_choice_and_are_not_compared(self):
        data = self.api_evidence()
        data["grafana"]["responses"]["query"]["data"]["results"]["A"]["frames"][1]["data"]["values"][1][1] = None
        data["grafana"]["responses"]["query"]["data"]["results"]["A"]["frames"][2]["data"]["values"][1][2] = None
        with self.assertRaisesRegex(normalizer.CoverageError, "preview.*2026-09-29"):
            self.normalize_evidence(data)
        result = self.normalize_evidence(data, allow_missing_grafana=True)
        metric = result.metrics["grafana.frontend_sessions"]
        self.assertIsNone(metric.value)
        self.assertEqual(metric.status, "missing")
        complete = self.normalize_evidence(self.api_evidence()).metrics["grafana.frontend_sessions"]
        self.assertEqual(metric.scope, complete.scope)
        self.assertEqual(metric.definition, complete.definition)
        self.assertIn("preview (id=1): 2026-09-29", metric.notes)
        self.assertIn("production (id=1): 2026-09-30", metric.notes)
        self.assertFalse(ops.comparable(complete, metric))
        changed = self.api_evidence()
        changed["grafana"]["responses"]["panel"]["data"]["dashboard"]["panels"][0]["panels"][0]["targets"][0]["expr"] = "vector(0)"
        with self.assertRaisesRegex(ValueError, "panel changed"):
            self.normalize_evidence(changed, allow_missing_grafana=True)
        for kind in ("step", "negative"):
            changed = deepcopy(data)
            frame = changed["grafana"]["responses"]["query"]["data"]["results"]["A"]["frames"][2]
            if kind == "step":
                frame["schema"]["meta"]["executedQueryString"] = "Step: 1h"
            else:
                frame["data"]["values"][1][0] = -1
            with self.subTest(kind=kind), self.assertRaises(ValueError) as caught:
                self.normalize_evidence(changed, allow_missing_grafana=True)
            self.assertNotIsInstance(caught.exception, normalizer.CoverageError)

    def test_grafana_duplicate_series_wrong_step_and_app_scope_changes(self):
        for kind in ("duplicate", "step", "fallback", "timestamp", "no-apps"):
            data = self.api_evidence()
            frames = data["grafana"]["responses"]["query"]["data"]["results"]["A"]["frames"]
            if kind == "duplicate":
                frames.append(deepcopy(frames[1]))
            elif kind == "step":
                frames[1]["schema"]["meta"]["executedQueryString"] = "Step: 1h"
            elif kind == "fallback":
                frames[0]["data"]["values"][1][0] = 1
            elif kind == "timestamp":
                frames[1]["data"]["values"][0][0] += 3600000
            else:
                frames[:] = frames[:1]
            with self.subTest(kind=kind), self.assertRaises(ValueError):
                self.normalize_evidence(data)
        current = self.normalize_evidence(self.api_evidence())
        data = self.api_evidence()
        data["grafana"]["responses"]["query"]["data"]["results"]["A"]["frames"].pop()
        changed = self.normalize_evidence(data)
        self.assertFalse(ops.comparable(current.metrics["grafana.frontend_sessions"],
                                        changed.metrics["grafana.frontend_sessions"]))

    def test_schema_one_history_remains_readable_without_comparing_new_vercel_counters(self):
        old = ops.template(WEEK - timedelta(weeks=1), NOW, schema_version=1)
        old_key = "vercel_project.fast_data_transfer"
        old.metrics[old_key] = replace(old.metrics[old_key], value=10, status="complete", method="browser",
                                       definition="weekly-consumption-v1")
        self.assertEqual(ops.parse_snapshot(old.json_data(), NOW), old)
        folder = ops.save_report(old, self.history, 4, NOW)
        self.assertIn("Fast data transfer | 10 GB", (folder / "report.md").read_text())
        report = ops.render_report(snapshot(value=20), self.history, 4, NOW)
        self.assertIn("API outgoing bandwidth | 20 GB | N/A | N/A", report)
        self.assertEqual(ops.check_history(self.history, NOW), 1)

    def test_grafana_panel_change_stops_before_query_and_second_request_failure_saves_nothing(self):
        for vendor in ("grafana", "vercel"):
            plan = fetcher.request_plan(WEEK, NOW)[vendor]
            output = Path(self.temporary.name) / (vendor + "-failed.json")
            first = panel_payload() if vendor == "grafana" else vercel_payload()
            if vendor == "grafana":
                first["dashboard"]["timezone"] = "browser"
            with patch.dict(os.environ, {plan["token_env"]: "example-token"}, clear=True), \
                    patch("fetch_usage.build_opener") as opener:
                opener.return_value.open.side_effect = [BytesIO(json.dumps(first).encode()),
                    HTTPError("https://api.vercel.com", 403, "private detail", {}, BytesIO(b"secret"))]
                with self.assertRaises(ValueError):
                    fetcher.fetch(vendor, plan, output)
                self.assertEqual(opener.return_value.open.call_count, 1 if vendor == "grafana" else 2)
            self.assertFalse(output.exists())


if __name__ == "__main__":
    unittest.main()
