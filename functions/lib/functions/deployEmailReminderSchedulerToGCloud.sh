#!/usr/bin/env bash
set -euo pipefail

# Replaces the Python email_reminder schedule (every day 12:00 Australia/Sydney).
# Do not run this while that Python function is still scheduled.
#
# The function is private. This job calls it with an OIDC token from a
# dedicated service account that has roles/cloudfunctions.invoker.
#
# Usage: ./deployEmailReminderSchedulerToGCloud.sh <project_id> <region> <function_url>
# Defaults for dev if not provided
PROJECT_ID=${1:-socialsports-44162}
REGION=${2:-australia-southeast1}
FUNCTION_URL=${3:-"https://australia-southeast1-socialsports-44162.cloudfunctions.net/emailReminderCron"}
FUNCTION_NAME=emailReminderCron
JOB_NAME=email-reminder-cron-job
SERVICE_ACCOUNT="email-reminder-cron@${PROJECT_ID}.iam.gserviceaccount.com"

if ! gcloud iam service-accounts describe "$SERVICE_ACCOUNT" --project "$PROJECT_ID" >/dev/null 2>&1; then
  gcloud iam service-accounts create email-reminder-cron \
    --display-name="Email reminder cron" \
    --project "$PROJECT_ID"
fi

gcloud functions add-iam-policy-binding "$FUNCTION_NAME" \
  --region="$REGION" \
  --member="serviceAccount:${SERVICE_ACCOUNT}" \
  --role="roles/cloudfunctions.invoker" \
  --project "$PROJECT_ID"

SCHEDULER_ARGS=(
  --schedule="0 12 * * *"
  --time-zone="Australia/Sydney"
  --uri="$FUNCTION_URL"
  --http-method=GET
  --oidc-service-account-email="$SERVICE_ACCOUNT"
  --oidc-token-audience="$FUNCTION_URL"
  --project "$PROJECT_ID"
  --location="$REGION"
)

if gcloud scheduler jobs describe "$JOB_NAME" --location="$REGION" --project "$PROJECT_ID" >/dev/null 2>&1; then
  echo "Updating existing scheduler job: $JOB_NAME"
  gcloud scheduler jobs update http "$JOB_NAME" "${SCHEDULER_ARGS[@]}"
else
  echo "Creating scheduler job: $JOB_NAME"
  gcloud scheduler jobs create http "$JOB_NAME" "${SCHEDULER_ARGS[@]}"
fi
