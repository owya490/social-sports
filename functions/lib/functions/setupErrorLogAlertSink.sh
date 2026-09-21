#!/bin/bash

# Creates the Pub/Sub topic, ERROR log sink, and a second log-based SMS alert
# that pages the AI summary through the same GCP SMS notification channel
# already used for ERROR texts. Does not deploy the function.
#
# Usage: ./setupErrorLogAlertSink.sh <dev|prod> [sms_channel_resource_name]
#
# If you omit the channel, the script attaches every existing SMS notification
# channel in the project (the same numbers that already get ERROR pages).
#
# Also enable Vertex AI and grant the function service account
# roles/aiplatform.user on the project.

set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
    echo "Usage: $0 <environment> [sms_channel_resource_name]"
    echo "  <environment>: 'dev' or 'prod'"
    exit 1
fi

ENVIRONMENT=$1
if [ "$ENVIRONMENT" != "dev" ] && [ "$ENVIRONMENT" != "prod" ]; then
    echo "Invalid environment: $ENVIRONMENT"
    exit 1
fi

if [ "$ENVIRONMENT" == "dev" ]; then
    PROJECT_NAME="socialsports-44162"
else
    PROJECT_NAME="socialsportsprod"
fi

TOPIC="error-log-alerts"
SINK="error-log-alerts-sink"
REGION="australia-southeast1"
POLICY_DISPLAY_NAME="SPORTSHUB AI error summary"
SUMMARY_MARKER="SPORTSHUB_ALERT_SUMMARY"

# Exclude the explainer itself. Gen2 names are Cloud Run service names (lowercase).
LOG_FILTER="severity>=ERROR
AND (
  resource.type=\"cloud_function\"
  OR resource.type=\"cloud_run_revision\"
)
AND NOT resource.labels.function_name=\"explainErrorAlert\"
AND NOT resource.labels.service_name=\"explainerroralert\"
AND NOT textPayload:\"${SUMMARY_MARKER}\""

echo "Setting up error log alert sink in $ENVIRONMENT project $PROJECT_NAME"

gcloud services enable pubsub.googleapis.com logging.googleapis.com aiplatform.googleapis.com monitoring.googleapis.com \
    --project="$PROJECT_NAME"

if gcloud pubsub topics describe "$TOPIC" --project="$PROJECT_NAME" >/dev/null 2>&1; then
    echo "Pub/Sub topic $TOPIC already exists"
else
    gcloud pubsub topics create "$TOPIC" --project="$PROJECT_NAME"
fi

SINK_DESTINATION="pubsub.googleapis.com/projects/${PROJECT_NAME}/topics/${TOPIC}"

if gcloud logging sinks describe "$SINK" --project="$PROJECT_NAME" >/dev/null 2>&1; then
    echo "Updating existing log sink $SINK"
    gcloud logging sinks update "$SINK" "$SINK_DESTINATION" \
        --log-filter="$LOG_FILTER" \
        --project="$PROJECT_NAME"
else
    gcloud logging sinks create "$SINK" "$SINK_DESTINATION" \
        --log-filter="$LOG_FILTER" \
        --project="$PROJECT_NAME"
fi

WRITER_IDENTITY=$(gcloud logging sinks describe "$SINK" \
    --project="$PROJECT_NAME" \
    --format='value(writerIdentity)')

gcloud pubsub topics add-iam-policy-binding "$TOPIC" \
    --project="$PROJECT_NAME" \
    --member="$WRITER_IDENTITY" \
    --role="roles/pubsub.publisher"

SMS_CHANNELS=()
if [ "$#" -eq 2 ]; then
    SMS_CHANNELS=("$2")
else
    while IFS= read -r channel; do
        if [ -n "$channel" ]; then
            SMS_CHANNELS+=("$channel")
        fi
    done < <(gcloud beta monitoring channels list \
        --project="$PROJECT_NAME" \
        --filter='type="sms"' \
        --format='value(name)')
fi

if [ "${#SMS_CHANNELS[@]}" -eq 0 ]; then
    echo "No SMS notification channels found. Create one in Cloud Monitoring (same as today's ERROR texts), then re-run:"
    echo "  $0 $ENVIRONMENT projects/${PROJECT_NAME}/notificationChannels/CHANNEL_ID"
else
    CHANNEL_JSON=$(printf '"%s",' "${SMS_CHANNELS[@]}")
    CHANNEL_JSON="[${CHANNEL_JSON%,}]"
    POLICY_FILE="$(dirname "$0")/../../../.tmp/error-alert-summary-policy.json"
    mkdir -p "$(dirname "$POLICY_FILE")"

    cat > "$POLICY_FILE" <<EOF
{
  "displayName": "${POLICY_DISPLAY_NAME}",
  "documentation": {
    "subject": "\${log.extracted_label.summary}",
    "content": "\${log.extracted_label.summary}",
    "mimeType": "text/markdown"
  },
  "conditions": [
    {
      "displayName": "AI error summary log",
      "conditionMatchedLog": {
        "filter": "textPayload:\"${SUMMARY_MARKER}\"",
        "labelExtractors": {
          "summary": "REGEXP_EXTRACT(textPayload, \"${SUMMARY_MARKER} (.*)\")"
        }
      }
    }
  ],
  "combiner": "OR",
  "enabled": true,
  "alertStrategy": {
    "notificationRateLimit": {
      "period": "300s"
    },
    "autoClose": "1800s"
  },
  "notificationChannels": ${CHANNEL_JSON}
}
EOF

    EXISTING_POLICY=$(gcloud alpha monitoring policies list \
        --project="$PROJECT_NAME" \
        --filter="displayName=\"${POLICY_DISPLAY_NAME}\"" \
        --format='value(name)' | head -n 1)

    if [ -n "$EXISTING_POLICY" ]; then
        echo "Updating existing alerting policy $EXISTING_POLICY"
        gcloud alpha monitoring policies update "$EXISTING_POLICY" \
            --policy-from-file="$POLICY_FILE" \
            --project="$PROJECT_NAME"
    else
        echo "Creating log-based SMS alert on marker ${SUMMARY_MARKER}"
        gcloud alpha monitoring policies create \
            --policy-from-file="$POLICY_FILE" \
            --project="$PROJECT_NAME"
    fi
fi

echo "Done. Topic=$TOPIC sink=$SINK region=$REGION"
echo "Next: deploy with ./deployFunctionsToGCloud.sh $ENVIRONMENT explainErrorAlert"
