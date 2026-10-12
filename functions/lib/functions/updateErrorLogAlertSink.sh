#!/bin/bash
set -euo pipefail

if [ "$#" -ne 1 ]; then
    echo "Usage: $0 <dev|prod>"
    exit 1
fi
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
FILTER="$(python3 "$SCRIPT_DIR/error_alert_config.py" filter --environment "$1")"
if [ "$1" = "prod" ]; then
    PROJECT="socialsportsprod"
else
    PROJECT="socialsports-44162"
fi

gcloud logging sinks describe error-log-alerts-sink --project="$PROJECT" >/dev/null
gcloud logging sinks update error-log-alerts-sink \
    --log-filter="$FILTER" --project="$PROJECT"
