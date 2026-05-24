#!/usr/bin/env bash
set -euo pipefail

# Defaults for dev
PROJECT_ID=${1:-socialsports-44162}
REGION=${2:-australia-southeast1}
FUNCTION_URL=${3:-"https://australia-southeast1-socialsports-44162.cloudfunctions.net/waitlistNotificationCron"}

JOB_NAME=waitlist-notification-cron-job

# Create or update Cloud Scheduler job — runs daily at 08:00 Sydney time.
# This gives the move_inactive_events job (00:05) time to clean up ended events
# before the waitlist cron tries to process them.
if gcloud scheduler jobs describe "$JOB_NAME" --location="$REGION" --project "$PROJECT_ID" >/dev/null 2>&1; then
  echo "Updating existing scheduler job: $JOB_NAME"
  gcloud scheduler jobs update http "$JOB_NAME" \
    --schedule="0 8 * * *" \
    --time-zone="Australia/Sydney" \
    --uri="$FUNCTION_URL" \
    --http-method=GET \
    --project "$PROJECT_ID" \
    --location="$REGION"
else
  echo "Creating scheduler job: $JOB_NAME"
  gcloud scheduler jobs create http "$JOB_NAME" \
    --schedule="0 8 * * *" \
    --time-zone="Australia/Sydney" \
    --uri="$FUNCTION_URL" \
    --http-method=GET \
    --project "$PROJECT_ID" \
    --location="$REGION"
fi
