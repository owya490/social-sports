#!/usr/bin/env bash
set -euo pipefail

# Usage:
# ./deploySmokeE2eSchedulerToGCloud.sh <project_id> <region> <function_url> <auth_token>
PROJECT_ID=${1:-socialsports-44162}
REGION=${2:-australia-southeast1}
FUNCTION_URL=${3:-"https://australia-southeast1-socialsports-44162.cloudfunctions.net/smokeE2eEndpoint"}
AUTH_TOKEN=${4:-""}

if [ -z "$AUTH_TOKEN" ]; then
  echo "Missing AUTH_TOKEN argument."
  exit 1
fi

JOB_NAME=smoke-e2e-hourly-job

if gcloud scheduler jobs describe "$JOB_NAME" --location="$REGION" --project "$PROJECT_ID" >/dev/null 2>&1; then
  echo "Updating existing scheduler job: $JOB_NAME"
  gcloud scheduler jobs update http "$JOB_NAME" \
    --schedule="0 * * * *" \
    --time-zone="Australia/Sydney" \
    --uri="$FUNCTION_URL" \
    --http-method=POST \
    --headers="Authorization=Bearer ${AUTH_TOKEN}" \
    --project "$PROJECT_ID" \
    --location="$REGION"
else
  echo "Creating scheduler job: $JOB_NAME"
  gcloud scheduler jobs create http "$JOB_NAME" \
    --schedule="0 * * * *" \
    --time-zone="Australia/Sydney" \
    --uri="$FUNCTION_URL" \
    --http-method=POST \
    --headers="Authorization=Bearer ${AUTH_TOKEN}" \
    --project "$PROJECT_ID" \
    --location="$REGION"
fi
