#!/usr/bin/env python3
"""Render alert configuration or reconcile only the explicitly selected policy."""

import argparse
import copy
import json
import re
import subprocess
import urllib.parse
import urllib.request

PROJECTS = {"dev": "socialsports-44162", "prod": "socialsportsprod"}
POLICY_NAME = "SPORTSHUB AI error summary"
SUMMARY_LOG = "sportshub-alert-sms"


def sink_filter():
    return """severity>=ERROR
AND (resource.type="cloud_function" OR resource.type="cloud_run_revision")
AND NOT resource.labels.function_name="explainErrorAlert"
AND NOT resource.labels.service_name="explainerroralert"
AND NOT logName:"sportshub-alert-sms"
AND NOT (
  textPayload="Invalid request, unable to process."
  AND labels.deployment-callable="true"
  AND httpRequest.requestMethod="GET"
  AND sourceLocation.function="_on_call_handler"
)"""


def label(name):
    return "$" + "{log.extracted_label." + name + "}"


def policy(project, channels):
    if not channels or any(
        not re.fullmatch(re.escape("projects/" + project + "/notificationChannels/") + r"[0-9]+", channel)
        for channel in channels
    ):
        raise ValueError("Explicit notification channels belonging to the selected project are required")
    query_prefix = f'logName="projects/{project}/logs/{SUMMARY_LOG}" AND jsonPayload.fingerprint="'
    explanation_url = (
        "https://console.cloud.google.com/logs/query;query="
        + urllib.parse.quote(query_prefix, safe="")
        + label("fingerprint")
        + "%22;duration=P7D?project=" + project
    )
    return {
        "displayName": POLICY_NAME,
        "documentation": {
            "subject": label("headline"),
            "content": (
                "Observed error: " + label("headline") + "\n\n"
                "Observed log evidence is primary. AI interpretation is optional and unconfirmed. "
                "Open the linked log for the evidence, explanation and original error.\n\n"
                "[AI explanation and evidence]("
                + explanation_url + ")"
            ),
            "mimeType": "text/markdown",
            "links": [{"displayName": "AI explanation and evidence", "url": explanation_url}],
        },
        "conditions": [{
            "displayName": "AI error evidence log",
            "conditionMatchedLog": {
                "filter": f'logName="projects/{project}/logs/{SUMMARY_LOG}" AND jsonPayload.kind="errorSummary"',
                "labelExtractors": {
                    "fingerprint": "EXTRACT(jsonPayload.fingerprint)",
                    "headline": "EXTRACT(jsonPayload.headline)",
                },
            },
        }],
        "combiner": "OR",
        "enabled": True,
        "alertStrategy": {
            "notificationPrompts": ["OPENED"],
            "notificationRateLimit": {"period": "600s"},
            "autoClose": "604800s",
        },
        "notificationChannels": list(dict.fromkeys(channels)),
    }


def reconcile_policy(project, desired, request):
    policies = []
    path = f"projects/{project}/alertPolicies"
    page = path
    while page:
        response = request("GET", page)
        policies.extend(response.get("alertPolicies", []))
        token = response.get("nextPageToken")
        page = path + "?pageToken=" + urllib.parse.quote(token, safe="") if token else None
    matches = [item for item in policies if item.get("displayName") == POLICY_NAME]
    if len(matches) > 1:
        raise ValueError("Multiple AI error policies exist; select and reconcile them explicitly")
    if matches:
        current = request("GET", matches[0]["name"])
        desired = {**copy.deepcopy(desired), "name": current["name"]}
        conditions = current.get("conditions", [])
        if len(conditions) == 1 and conditions[0].get("name"):
            desired["conditions"][0]["name"] = conditions[0]["name"]
        mask = ",".join(key for key in desired if key != "name")
        return request("PATCH", current["name"] + "?updateMask=" + mask, desired)
    return request("POST", path, desired)


def api_request():
    token = subprocess.run(
        ["gcloud", "auth", "print-access-token"], check=True, capture_output=True, text=True
    ).stdout.strip()

    def request(method, path, body=None):
        data = None if body is None else json.dumps(body).encode()
        req = urllib.request.Request(
            "https://monitoring.googleapis.com/v3/" + path,
            data=data, method=method,
            headers={"Authorization": "Bearer " + token, "Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=20) as response:
            return json.load(response)

    return request


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("command", choices=["filter", "policy", "apply-policy"])
    parser.add_argument("--environment", choices=PROJECTS, required=True)
    parser.add_argument("--channel", action="append", default=[])
    args = parser.parse_args()
    project = PROJECTS[args.environment]
    if args.command == "filter":
        print(sink_filter())
        return
    desired = policy(project, args.channel)
    if args.command == "policy":
        print(json.dumps(desired, indent=2))
    else:
        result = reconcile_policy(project, desired, api_request())
        print("Reconciled " + result["name"])


if __name__ == "__main__":
    main()
