#!/usr/bin/env bash
set -euo pipefail

# Defaults for dev
PROJECT_ID=${1:-socialsports-44162}
REGION=${2:-australia-southeast1}
FUNCTION_URL=${3:-"https://australia-southeast1-socialsports-44162.cloudfunctions.net/recurringEventsCron"}

JOB_NAME=recurring-events-job

# Create or update Cloud Scheduler job recurring events cron at midnight every day
if gcloud scheduler jobs describe "$JOB_NAME" --location="$REGION" --project "$PROJECT_ID" >/dev/null 2>&1; then
  echo "Updating existing scheduler job: $JOB_NAME"
  gcloud scheduler jobs update http "$JOB_NAME" \
    --schedule="0 0 * * *" \
    --time-zone="Australia/Sydney" \
    --uri="$FUNCTION_URL" \
    --http-method=GET \
    --headers="Content-Type=application/json" \
    --project "$PROJECT_ID" \
    --location="$REGION"
else
  echo "Creating scheduler job: $JOB_NAME"
  gcloud scheduler jobs create http "$JOB_NAME" \
    --schedule="0 0 * * *" \
    --time-zone="Australia/Sydney" \
    --uri="$FUNCTION_URL" \
    --http-method=GET \
    --headers="Content-Type=application/json" \
    --project "$PROJECT_ID" \
    --location="$REGION"
fi