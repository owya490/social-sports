#!/usr/bin/env bash
set -euo pipefail

# Defaults for dev.
# Schedule matches the retired Python function: every day at 00:05 Australia/Sydney.
PROJECT_ID=${1:-socialsports-44162}
REGION=${2:-australia-southeast1}
FUNCTION_URL=${3:-"https://australia-southeast1-socialsports-44162.cloudfunctions.net/moveInactiveEventsCron"}

JOB_NAME=move-inactive-events-cron-job

if gcloud scheduler jobs describe "$JOB_NAME" --location="$REGION" --project "$PROJECT_ID" >/dev/null 2>&1; then
  echo "Updating existing scheduler job: $JOB_NAME"
  gcloud scheduler jobs update http "$JOB_NAME" \
    --schedule="5 0 * * *" \
    --time-zone="Australia/Sydney" \
    --uri="$FUNCTION_URL" \
    --http-method=GET \
    --project "$PROJECT_ID" \
    --location="$REGION"
else
  echo "Creating scheduler job: $JOB_NAME"
  gcloud scheduler jobs create http "$JOB_NAME" \
    --schedule="5 0 * * *" \
    --time-zone="Australia/Sydney" \
    --uri="$FUNCTION_URL" \
    --http-method=GET \
    --project "$PROJECT_ID" \
    --location="$REGION"
fi
