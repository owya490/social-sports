import copy
import importlib.util
import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from urllib.parse import unquote

spec = importlib.util.spec_from_file_location("error_alert_config", Path(__file__).parents[1] / "error_alert_config.py")
config = importlib.util.module_from_spec(spec)
spec.loader.exec_module(config)


class ErrorAlertConfigTest(unittest.TestCase):
    def setUp(self):
        self.channel = "projects/socialsportsprod/notificationChannels/123"

    def test_policy_uses_stable_labels_and_links_to_ai_evidence(self):
        policy = config.policy("socialsportsprod", [self.channel])
        labels = policy["conditions"][0]["conditionMatchedLog"]["labelExtractors"]
        self.assertEqual({"fingerprint", "headline"}, set(labels))
        self.assertNotIn("aiInterpretation", str(labels))
        self.assertEqual(config.label("headline"), policy["documentation"]["subject"])
        link = unquote(policy["documentation"]["links"][0]["url"])
        self.assertIn('jsonPayload.fingerprint="' + config.label("fingerprint") + '"', link)
        self.assertIn('logName="projects/socialsportsprod/logs/sportshub-alert-sms"', link)
        self.assertEqual([self.channel], policy["notificationChannels"])

    def test_policy_requires_explicit_project_scoped_recipients(self):
        for channels in [[], ["projects/socialsports-44162/notificationChannels/123"], ["not-a-channel"]]:
            with self.assertRaises(ValueError):
                config.policy("socialsportsprod", channels)

    def test_reconciliation_fetches_current_state_and_preserves_condition_identity(self):
        name = "projects/socialsportsprod/alertPolicies/42"
        calls = []

        def request(method, path, body=None):
            calls.append((method, path, copy.deepcopy(body)))
            if path.endswith("/alertPolicies"):
                return {"nextPageToken": "next page"}
            if "?pageToken=" in path:
                self.assertTrue(path.endswith("?pageToken=next%20page"))
                return {"alertPolicies": [{"name": name, "displayName": config.POLICY_NAME}]}
            if method == "GET":
                return {"name": name, "conditions": [{"name": name + "/conditions/7"}]}
            return body

        desired = config.policy("socialsportsprod", [self.channel])
        config.reconcile_policy("socialsportsprod", desired, request)
        self.assertEqual(["GET", "GET", "GET", "PATCH"], [call[0] for call in calls])
        self.assertEqual(name + "/conditions/7", calls[-1][2]["conditions"][0]["name"])
        self.assertIn("updateMask=", calls[-1][1])
        self.assertNotIn("name", desired["conditions"][0])

    def test_reconciliation_creates_only_when_no_matching_policy_exists(self):
        calls = []

        def request(method, path, body=None):
            calls.append((method, path, body))
            return {} if method == "GET" else body

        config.reconcile_policy("socialsportsprod", config.policy("socialsportsprod", [self.channel]), request)
        self.assertEqual(["GET", "POST"], [call[0] for call in calls])
        self.assertNotIn("name", calls[-1][2])

    def test_reconciliation_rejects_ambiguous_policy_names_without_writing(self):
        def request(method, path, body=None):
            self.assertEqual("GET", method)
            return {"alertPolicies": [{"displayName": config.POLICY_NAME}] * 2}

        with self.assertRaises(ValueError):
            config.reconcile_policy("socialsportsprod", config.policy("socialsportsprod", [self.channel]), request)

    def test_sink_only_update_does_not_provision_or_change_recipients(self):
        calls, result = self.run_script_with_fake_gcloud("updateErrorLogAlertSink.sh", ["prod"])

        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual(
            [["logging", "sinks", "describe"], ["logging", "sinks", "update"]],
            [call[:3] for call in calls],
        )
        self.assertTrue(all("--project=socialsportsprod" in call for call in calls))
        self.assertIn("--log-filter=" + config.sink_filter(), calls[-1])

    def test_provisioning_rejects_invalid_recipients_before_cloud_calls(self):
        calls, result = self.run_script_with_fake_gcloud(
            "setupErrorLogAlertSink.sh", ["prod", "projects/socialsports-44162/notificationChannels/123"]
        )

        self.assertNotEqual(0, result.returncode)
        self.assertEqual([], calls)

    def run_script_with_fake_gcloud(self, script, args):
        root = Path(__file__).resolve().parents[4]
        (root / ".tmp").mkdir(exist_ok=True)
        with tempfile.TemporaryDirectory(dir=root / ".tmp") as scratch:
            scratch = Path(scratch)
            executable = scratch / "gcloud"
            executable.write_text(
                "#!/usr/bin/env python3\nimport json, os, sys\n"
                "with open(os.environ['FAKE_GCLOUD_LOG'], 'a') as log:\n"
                "    log.write(json.dumps(sys.argv[1:]) + '\\n')\n"
            )
            executable.chmod(0o700)
            log = scratch / "calls.jsonl"
            result = subprocess.run(
                [str(Path(__file__).parents[1] / script), *args],
                env={**os.environ, "PATH": str(scratch) + os.pathsep + os.environ["PATH"],
                     "FAKE_GCLOUD_LOG": str(log)},
                capture_output=True, text=True, timeout=10,
            )
            calls = [json.loads(line) for line in log.read_text().splitlines()] if log.exists() else []
            return calls, result


if __name__ == "__main__":
    unittest.main()
