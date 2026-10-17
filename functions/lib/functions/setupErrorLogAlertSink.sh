#!/bin/bash
# One-time provisioning. Routine filter and policy changes have separate commands.
set -euo pipefail

if [ "$#" -lt 1 ]; then
    echo "Usage: $0 <dev|prod> [notification_channel...] (required for prod)"
    exit 1
fi
ENVIRONMENT="$1"
shift
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CONFIG="$SCRIPT_DIR/error_alert_config.py"
POLICY_ARGS=(--environment "$ENVIRONMENT")
for CHANNEL in "$@"; do
    POLICY_ARGS+=(--channel "$CHANNEL")
done
POLICY_DIR="$SCRIPT_DIR/../../../.tmp"
mkdir -p "$POLICY_DIR"
python3 "$CONFIG" policy "${POLICY_ARGS[@]}" \
    > "$POLICY_DIR/error-alert-policy-$ENVIRONMENT.json"
FILTER="$(python3 "$CONFIG" filter --environment "$ENVIRONMENT")"
if [ "$ENVIRONMENT" = "prod" ]; then
    PROJECT="socialsportsprod"
else
    PROJECT="socialsports-44162"
fi
PROJECT_NUMBER="$(gcloud projects describe "$PROJECT" --format='value(projectNumber)')"
RUNTIME_SA="$PROJECT_NUMBER-compute@developer.gserviceaccount.com"

gcloud services enable pubsub.googleapis.com logging.googleapis.com aiplatform.googleapis.com \
    monitoring.googleapis.com firestore.googleapis.com --project="$PROJECT"
for ROLE in roles/aiplatform.user roles/logging.viewer roles/logging.logWriter roles/datastore.user; do
    gcloud projects add-iam-policy-binding "$PROJECT" --member="serviceAccount:$RUNTIME_SA" \
        --role="$ROLE" --condition=None --quiet
done
if ! gcloud pubsub topics describe error-log-alerts --project="$PROJECT" >/dev/null 2>&1; then
    gcloud pubsub topics create error-log-alerts --project="$PROJECT"
fi
if gcloud logging sinks describe error-log-alerts-sink --project="$PROJECT" >/dev/null 2>&1; then
    bash "$SCRIPT_DIR/updateErrorLogAlertSink.sh" "$ENVIRONMENT"
else
    gcloud logging sinks create error-log-alerts-sink \
        "pubsub.googleapis.com/projects/$PROJECT/topics/error-log-alerts" \
        --log-filter="$FILTER" --project="$PROJECT"
fi
WRITER="$(gcloud logging sinks describe error-log-alerts-sink --project="$PROJECT" --format='value(writerIdentity)')"
gcloud pubsub topics add-iam-policy-binding error-log-alerts --project="$PROJECT" \
    --member="$WRITER" --role=roles/pubsub.publisher
python3 "$CONFIG" apply-policy "${POLICY_ARGS[@]}"
echo "Provisioned error alerts in $PROJECT. Deploy explainErrorAlert separately."
