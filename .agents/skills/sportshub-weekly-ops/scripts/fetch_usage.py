#!/usr/bin/env python3
"""Plan or fetch weekly vendor responses without creating report history."""

import argparse
from datetime import date, datetime, timedelta
import json
import os
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import HTTPRedirectHandler, Request, build_opener

import weekly_ops as ops


SCRATCH = Path(__file__).resolve().parents[4] / ".tmp"
GRAFANA_BASE = "https://compassdigitalgroup.grafana.net"
GRAFANA_DASHBOARD = GRAFANA_BASE + "/api/dashboards/uid/dfa75f92-b104-48e6-ba78-cf4fc950ae9a"
VERCEL_BASE = "https://api.vercel.com/v2/usage"
TEAM_ID = "team_7wMqFyd9Hz1I882l0vkev0Dz"
PROJECT_ID = "prj_M871BOaWTRTkX8FKcUvusXpWAqXx"
TOKEN_ENV = {"vercel": "VERCEL_TOKEN", "grafana": "GRAFANA_SERVICE_ACCOUNT_TOKEN"}
GRAFANA_COLLECTION_DELAY = timedelta(hours=3)
GRAFANA_EXPR = (
    'sum(sum_over_time((grafanacloud_frontend_observability_instance_sessions_per_second'
    '{org_id="1030328"} offset -1d * 60)[1d:1m])) by (id, appName) or vector(0)'
)


class NoRedirect(HTTPRedirectHandler):
    def redirect_request(self, request, response, code, message, headers, new_url):
        return None


def require_grafana_delay(week, captured):
    _, end = ops.bounds(week, captured)
    ready = end + GRAFANA_COLLECTION_DELAY
    if captured < ready:
        raise ValueError(f"Grafana collection requires a 3-hour delay; collect on or after {ops.iso(ready)}. "
                         "This is a local safeguard, not a Grafana settlement guarantee.")


def request_plan(week, now):
    start, end = ops.bounds(week, now)
    parameters = {
        "teamId": TEAM_ID, "type": "requests",
        "from": start.isoformat(timespec="milliseconds").replace("+00:00", "Z"),
        "to": end.isoformat(timespec="milliseconds").replace("+00:00", "Z"),
    }
    return {
        "vercel": {
            "week": str(week),
            "token_env": TOKEN_ENV["vercel"],
            "requests": {
                scope: {"method": "GET", "body": None, "url": VERCEL_BASE + "?" + urlencode(params)}
                for scope, params in (
                    ("team", parameters), ("project", {**parameters, "projectId": PROJECT_ID}),
                )
            },
        },
        "grafana": {
            "week": str(week),
            "token_env": TOKEN_ENV["grafana"],
            "requests": {
                "panel": {"method": "GET", "url": GRAFANA_DASHBOARD, "body": None},
                "query": {"method": "POST", "url": GRAFANA_BASE + "/api/ds/query", "body": {
                    "from": str(int(start.timestamp() * 1000)),
                    "to": str(int(end.timestamp() * 1000)),
                    "queries": [{
                        "refId": "A", "datasource": {"type": "prometheus", "uid": "grafanacloud-usage"},
                        "expr": GRAFANA_EXPR, "interval": "1d", "intervalMs": 1800000,
                        "maxDataPoints": 1071, "legendFormat": "{{ appName }}", "exemplar": False,
                        "utcOffsetSec": 0,
                    }],
                }},
            },
        },
    }


def read_token(name, token_file=None):
    try:
        if token_file is not None:
            token = token_file.read_text(encoding="utf-8")
        else:
            token = os.environ.get(name)
            if not token and os.environ.get(name + "_FILE"):
                token = Path(os.environ[name + "_FILE"]).read_text(encoding="utf-8")
    except (OSError, UnicodeError):
        raise ValueError(f"Cannot read {name} token file as UTF-8; check its path, permissions and encoding.") from None
    if not token or not token.strip():
        raise ValueError(f"Set {name} or {name}_FILE through your local secret setup.")
    token = token.strip()
    if any(not 33 <= ord(character) <= 126 for character in token):
        raise ValueError(f"{name} must contain a single printable ASCII token.")
    return token


def preflight(token_files):
    missing = []
    for vendor, name in TOKEN_ENV.items():
        try:
            read_token(name, token_files.get(vendor))
        except ValueError as error:
            missing.append(f"{vendor}: {error}")
    if missing:
        raise ValueError("\n".join(missing) + "\nPause collection and ask the operator for access.")


def reject_constant(value):
    raise ValueError("Response contains a non-finite JSON number.")


def validate_response(vendor, data):
    if vendor == "vercel":
        if (not isinstance(data, dict) or data.get("error") or data.get("granularity") != "day"
                or not isinstance(data.get("data"), list)):
            raise ValueError("Vercel response must contain daily usage counters; pause for coverage review.")
        return len(data["data"])
    if not isinstance(data, dict) or data.get("error") or not isinstance(data.get("results"), dict):
        raise ValueError("Grafana response has no successful query results.")
    result = data["results"].get("A")
    if (not isinstance(result, dict) or result.get("error") or result.get("errors")
            or result.get("status", 200) != 200 or not isinstance(result.get("frames"), list)):
        raise ValueError("Grafana query A failed or returned an unsupported response.")
    return len(result["frames"])


def validate_panel(data):
    dashboard = data.get("dashboard") if isinstance(data, dict) else None
    if not isinstance(dashboard, dict) or dashboard.get("timezone") != "utc":
        raise ValueError("Grafana billing dashboard no longer has the verified UTC definition.")
    def panels(items):
        for panel in items:
            yield panel
            yield from panels(panel.get("panels", []))
    matches = [panel for panel in panels(dashboard.get("panels", [])) if panel.get("id") == 95]
    if len(matches) != 1:
        raise ValueError("Grafana daily sessions panel is missing or ambiguous.")
    panel = matches[0]
    targets = panel.get("targets", [])
    if (panel.get("title") != "Total Sessions Ingested by day" or panel.get("transformations")
            or panel.get("timeFrom") or panel.get("timeShift") or len(targets) != 1
            or targets[0].get("hide") or targets[0].get("instant")
            or targets[0].get("expr", "").replace("$org_id", "1030328") != GRAFANA_EXPR
            or targets[0].get("interval") != "1d"
            or targets[0].get("datasource", panel.get("datasource", {})).get("uid") != "grafanacloud-usage"):
        raise ValueError("Grafana daily sessions panel changed; reconcile its definition before collection.")


def fetch(vendor, plan, output, token_file=None):
    output = output.resolve()
    if not output.is_relative_to(SCRATCH.resolve()) or output == SCRATCH.resolve():
        raise ValueError("Raw responses must be saved below this repository's .tmp/ directory.")
    if output.exists():
        raise ValueError("Output already exists; choose a new file to preserve collection evidence.")
    if vendor == "grafana":
        require_grafana_delay(date.fromisoformat(plan["week"]), datetime.now(ops.UTC))
    headers = {"Authorization": "Bearer " + read_token(plan["token_env"], token_file)}
    if vendor == "grafana":
        headers.update({"Content-Type": "application/json", "X-Grafana-Org-Id": "1"})
    responses = {}
    count = 0
    for name, spec in plan["requests"].items():
        body = json.dumps(spec["body"], allow_nan=False).encode("utf-8") if spec["body"] is not None else None
        request = Request(spec["url"], data=body, headers=headers, method=spec["method"])
        try:
            with build_opener(NoRedirect()).open(request, timeout=30) as response:
                payload = response.read().decode("utf-8")
        except HTTPError as error:
            status = error.code
            error.close()
            raise ValueError(f"{vendor} returned HTTP {status}; no report or raw output was saved.") from None
        except (URLError, TimeoutError):
            raise ValueError(f"{vendor} request failed; check network access. No output was saved.") from None
        data = json.loads(payload, parse_constant=reject_constant)
        if name == "panel":
            validate_panel(data)
        else:
            count += validate_response(vendor, data)
        responses[name] = {"request": spec, "data": data}
    evidence = {"vendor": vendor, "week": plan["week"], "captured_at": ops.iso(datetime.now(ops.UTC)),
                "responses": responses}
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("x", encoding="utf-8") as destination:
        destination.write(json.dumps(evidence, indent=2, allow_nan=False) + "\n")
    return count


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    commands = parser.add_subparsers(dest="command", required=True)
    credentials = commands.add_parser("preflight", help="Check local credentials without network access.")
    for vendor in TOKEN_ENV:
        credentials.add_argument(f"--{vendor}-token-file", type=Path, help="Local token file; overrides environment.")
    for name in ("plan", *TOKEN_ENV):
        command = commands.add_parser(name)
        command.add_argument("--week", type=date.fromisoformat, help="Completed week's Monday, YYYY-MM-DD.")
        if name != "plan":
            command.add_argument("--output", type=Path, required=True, help="New raw response file below .tmp/.")
            command.add_argument(f"--{name}-token-file", dest="token_file", type=Path,
                                 help="Local token file; overrides environment.")
    args = parser.parse_args()
    now = datetime.now(ops.UTC)
    try:
        if args.command == "preflight":
            preflight({"vercel": args.vercel_token_file, "grafana": args.grafana_token_file})
            print("Local credentials are readable. API permissions and metric coverage still need live verification.")
            return
        plan = request_plan(args.week or ops.latest_completed_week(now), now)
        if args.command == "plan":
            print(json.dumps(plan, indent=2, allow_nan=False))
        else:
            count = fetch(args.command, plan[args.command], args.output, args.token_file)
            print(f"Saved {args.command} response ({count} records/frames) to {args.output}.")
            print("Run normalize_usage.py next. Missing daily coverage is not zero usage.")
    except (ValueError, OSError, TypeError, KeyError, AttributeError) as error:
        parser.exit(1, f"error: {error}\nPause and resolve access/coverage before continuing.\n")


if __name__ == "__main__":
    main()
