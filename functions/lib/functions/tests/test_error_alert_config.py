import copy
import importlib.util
import json
import os
import subprocess
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch
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
        self.assertTrue(policy["enabled"])

    def test_policy_requires_explicit_project_scoped_recipients(self):
        for channels in [[], ["projects/socialsports-44162/notificationChannels/123"], ["not-a-channel"]]:
            with self.assertRaises(ValueError):
                config.policy("socialsportsprod", channels)
        dev_policy = config.policy("socialsports-44162", [])
        self.assertFalse(dev_policy["enabled"])
        self.assertEqual([], dev_policy["notificationChannels"])

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

    def test_deployment_preserves_recipients_and_keeps_development_disabled(self):
        for environment, enabled in [("dev", True), ("prod", True), ("prod", False)]:
            with self.subTest(environment=environment, enabled=enabled):
                project = config.PROJECTS[environment]
                current = {
                    "name": f"projects/{project}/alertPolicies/42", "displayName": config.POLICY_NAME,
                    "notificationChannels": [self.channel] if environment == "prod" and enabled else [],
                    "enabled": enabled, "conditions": [{"name": "condition-7"}],
                }
                calls = []

                def request(method, path, body=None):
                    calls.append((method, path, body))
                    if path.endswith("/alertPolicies"):
                        return {"alertPolicies": [current]}
                    return current if method == "GET" else body

                def run(command, **kwargs):
                    self.assertTrue(kwargs["check"])
                    if environment == "dev":
                        self.assertIn(False, [body.get("enabled") for method, _, body in calls if method == "PATCH"])

                with patch.object(config.subprocess, "run", side_effect=run) as run:
                    config.deploy(environment, request)
                source = Path(config.__file__).parent
                run.assert_any_call(
                    ["bash", str(source / "deployFunctionsToGCloud.sh"), environment, "explainErrorAlert"],
                    check=True, cwd=source,
                )
                self.assertEqual("PATCH", calls[-1][0])
                self.assertNotIn("notificationChannels", calls[-1][1])
                self.assertNotIn("notificationChannels", calls[-1][2])
                self.assertEqual("condition-7", calls[-1][2]["conditions"][0]["name"])
                if environment == "dev":
                    self.assertFalse(calls[-1][2]["enabled"])
                else:
                    self.assertNotIn("enabled", calls[-1][1])
                    self.assertNotIn("enabled", calls[-1][2])

    def test_deployment_requires_provisioning_before_cloud_mutations(self):
        def request(method, path, body=None):
            self.assertEqual("GET", method)
            return {}

        with patch.object(config.subprocess, "run") as run:
            with self.assertRaises(ValueError):
                config.deploy("prod", request)
            run.assert_not_called()

    def test_failed_function_deployment_stops_before_sink_and_policy_reconciliation(self):
        current = {
            "name": "projects/socialsportsprod/alertPolicies/42", "displayName": config.POLICY_NAME,
            "notificationChannels": [self.channel],
        }
        writes = []

        def request(method, path, body=None):
            if method != "GET":
                writes.append(body)
            return {"alertPolicies": [current]} if path.endswith("/alertPolicies") else current

        def run(command, **kwargs):
            if command[1].endswith("deployFunctionsToGCloud.sh"):
                raise subprocess.CalledProcessError(1, command)

        with patch.object(config.subprocess, "run", side_effect=run) as run:
            with self.assertRaises(subprocess.CalledProcessError):
                config.deploy("prod", request)
        self.assertEqual([], writes)
        self.assertFalse(any(call.args[0][1].endswith("updateErrorLogAlertSink.sh") for call in run.call_args_list))

    def test_sink_only_update_does_not_provision_or_change_recipients(self):
        calls, result = self.run_script_with_fake_gcloud("updateErrorLogAlertSink.sh", ["prod"])

        self.assertEqual(0, result.returncode, result.stderr)
        self.assertEqual(
            [["logging", "sinks", "describe"], ["logging", "sinks", "update"]],
            [call[:3] for call in calls],
        )
        self.assertTrue(all("--project=socialsportsprod" in call for call in calls))
        self.assertIn("--log-filter=" + config.sink_filter(), calls[-1])

    def test_alert_deployment_uses_adc_and_private_pubsub_in_both_environments(self):
        for environment, project in config.PROJECTS.items():
            with self.subTest(environment=environment):
                calls, result = self.run_script_with_fake_gcloud(
                    "deployFunctionsToGCloud.sh", [environment, "explainErrorAlert"]
                )
                self.assertEqual(0, result.returncode, result.stdout + result.stderr)
                self.assertEqual(1, len(calls))
                self.assertEqual(["functions", "deploy", "explainErrorAlert"], calls[0][:3])
                for flag in ["--gen2", "--no-allow-unauthenticated", "--retry"]:
                    self.assertIn(flag, calls[0])
                for flag, value in [("--project", project), ("--trigger-topic", "error-log-alerts"),
                                    ("--timeout", "120s"), ("--max-instances", "2")]:
                    self.assertEqual(value, calls[0][calls[0].index(flag) + 1])

    def test_provisioning_rejects_invalid_recipients_before_cloud_calls(self):
        for args in [["prod"], ["prod", "projects/socialsports-44162/notificationChannels/123"]]:
            with self.subTest(args=args):
                calls, result = self.run_script_with_fake_gcloud("setupErrorLogAlertSink.sh", args)
                self.assertNotEqual(0, result.returncode)
                self.assertEqual([], calls)
        with patch.dict(os.environ, {"FAKE_GCLOUD_EXIT_CODE": "17"}):
            calls, result = self.run_script_with_fake_gcloud("setupErrorLogAlertSink.sh", ["dev"])
        self.assertEqual(17, result.returncode, result.stdout + result.stderr)
        self.assertEqual([["projects", "describe"]], [call[:2] for call in calls])

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
                "sys.exit(int(os.environ.get('FAKE_GCLOUD_EXIT_CODE', '0')))\n"
            )
            executable.chmod(0o700)
            log = scratch / "calls.jsonl"
            source = scratch / "lib" / "functions"
            source.mkdir(parents=True)
            result = subprocess.run(
                [str(Path(__file__).parents[1] / script), *args],
                cwd=source,
                env={**os.environ, "PATH": str(scratch) + os.pathsep + os.environ["PATH"],
                     "FAKE_GCLOUD_LOG": str(log)},
                capture_output=True, text=True, timeout=10,
            )
            calls = [json.loads(line) for line in log.read_text().splitlines()] if log.exists() else []
            return calls, result


if __name__ == "__main__":
    unittest.main()
