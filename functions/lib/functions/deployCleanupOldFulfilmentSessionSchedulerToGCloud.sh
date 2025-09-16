#!/usr/bin/env bash
set -euo pipefail

# Usage: ./deployCleanupOldFulfilmentSessionSchedulerToGCloud.sh <project_id> <region> <function_url>
# Defaults for dev if not provided
PROJECT_ID=${1:-socialsports-44162}
REGION=${2:-australia-southeast1}
FUNCTION_URL=${3:-"https://australia-southeast1-socialsports-44162.cloudfunctions.net/cleanupOldFulfilmentSessionsCron"}

JOB_NAME=cleanup-old-fulfilment-sessions-job

# Create or update Cloud Scheduler job to hit the cleanup function every 10 minutes
if gcloud scheduler jobs describe "$JOB_NAME" --location="$REGION" --project "$PROJECT_ID" >/dev/null 2>&1; then
  echo "Updating existing scheduler job: $JOB_NAME"
  gcloud scheduler jobs update http "$JOB_NAME" \
    --schedule="*/10 * * * *" \
    --time-zone="Australia/Sydney" \
    --uri="$FUNCTION_URL" \
    --http-method=GET \
    --project "$PROJECT_ID" \
    --location="$REGION"
else
  echo "Creating scheduler job: $JOB_NAME"
  gcloud scheduler jobs create http "$JOB_NAME" \
    --schedule="*/10 * * * *" \
    --time-zone="Australia/Sydney" \
    --uri="$FUNCTION_URL" \
    --http-method=GET \
    --project "$PROJECT_ID" \
    --location="$REGION"
fi
