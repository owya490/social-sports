#!/usr/bin/env bash
set -euo pipefail

# Removes the Python move_inactive_events function and the Cloud Scheduler job
# Firebase created for it. Run this only after moveInactiveEventsCron and
# move-inactive-events-cron-job are deployed, so archival does not stop.
PROJECT_ID=${1:-socialsports-44162}
REGION=${2:-australia-southeast1}
FUNCTION_NAME=move_inactive_events
JOB_NAME="firebase-schedule-${FUNCTION_NAME}-${REGION}"

delete_if_present() {
  local description=$1
  shift
  local output
  local status
  set +e
  output=$("$@" 2>&1)
  status=$?
  set -e
  if [ "$status" -eq 0 ]; then
    return 0
  fi
  if printf '%s\n' "$output" | grep -q 'NOT_FOUND'; then
    echo "$description is already absent"
    return 1
  fi
  printf '%s\n' "$output" >&2
  exit 1
}

if delete_if_present "Legacy Python function $FUNCTION_NAME" \
  gcloud functions describe "$FUNCTION_NAME" --gen2 --region="$REGION" --project "$PROJECT_ID"; then
  echo "Deleting legacy Python function $FUNCTION_NAME"
  gcloud functions delete "$FUNCTION_NAME" --gen2 --region="$REGION" --project "$PROJECT_ID" --quiet
fi

if delete_if_present "Legacy scheduler job $JOB_NAME" \
  gcloud scheduler jobs describe "$JOB_NAME" --location="$REGION" --project "$PROJECT_ID"; then
  echo "Deleting legacy scheduler job $JOB_NAME"
  gcloud scheduler jobs delete "$JOB_NAME" --location="$REGION" --project "$PROJECT_ID" --quiet
fi
