#!/bin/bash

# Creates the fulfilment-session Pub/Sub topic and its dead-letter topic.
# Pass attach-dead-letter after processFulfilmentSession has been deployed so the
# trigger subscription stops retrying a failing message after 5 attempts.
#
# Usage: ./setupProcessFulfilmentSessionTopic.sh <dev|prod> [attach-dead-letter]

set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
    echo "Usage: $0 <environment> [attach-dead-letter]"
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

TOPIC="process-fulfilment-sessions-topic"
DEAD_LETTER_TOPIC="process-fulfilment-sessions-dead-letter"

echo "Setting up $TOPIC in $ENVIRONMENT project $PROJECT_NAME"

gcloud services enable pubsub.googleapis.com --project="$PROJECT_NAME"

if gcloud pubsub topics describe "$TOPIC" --project="$PROJECT_NAME" >/dev/null 2>&1; then
    echo "Pub/Sub topic $TOPIC already exists"
else
    gcloud pubsub topics create "$TOPIC" --project="$PROJECT_NAME"
fi

if gcloud pubsub topics describe "$DEAD_LETTER_TOPIC" --project="$PROJECT_NAME" >/dev/null 2>&1; then
    echo "Pub/Sub topic $DEAD_LETTER_TOPIC already exists"
else
    gcloud pubsub topics create "$DEAD_LETTER_TOPIC" --project="$PROJECT_NAME"
fi

if [ "$#" -eq 2 ] && [ "$2" == "attach-dead-letter" ]; then
    PROJECT_NUMBER=$(gcloud projects describe "$PROJECT_NAME" --format='value(projectNumber)')
    PUBSUB_SA="service-${PROJECT_NUMBER}@gcp-sa-pubsub.iam.gserviceaccount.com"

    gcloud pubsub topics add-iam-policy-binding "$DEAD_LETTER_TOPIC" \
        --project="$PROJECT_NAME" \
        --member="serviceAccount:${PUBSUB_SA}" \
        --role="roles/pubsub.publisher" \
        --quiet

    SUBSCRIPTIONS=""
    for attempt in 1 2 3 4 5 6; do
        SUBSCRIPTIONS=$(gcloud pubsub topics list-subscriptions "$TOPIC" --project="$PROJECT_NAME" | sed '/^---$/d' | sed '/^$/d')
        if [ -n "$SUBSCRIPTIONS" ]; then
            break
        fi
        echo "No subscription on $TOPIC yet (attempt ${attempt})"
        sleep 5
    done

    if [ -z "$SUBSCRIPTIONS" ]; then
        echo "No Pub/Sub subscription found for $TOPIC"
        exit 1
    fi

    while IFS= read -r SUBSCRIPTION; do
        if [ -z "$SUBSCRIPTION" ]; then
            continue
        fi
        gcloud pubsub subscriptions add-iam-policy-binding "$SUBSCRIPTION" \
            --project="$PROJECT_NAME" \
            --member="serviceAccount:${PUBSUB_SA}" \
            --role="roles/pubsub.subscriber" \
            --quiet
        gcloud pubsub subscriptions update "$SUBSCRIPTION" \
            --project="$PROJECT_NAME" \
            --dead-letter-topic="$DEAD_LETTER_TOPIC" \
            --max-delivery-attempts=5 \
            --quiet
        echo "Attached dead letter to $SUBSCRIPTION"
    done <<EOF
$SUBSCRIPTIONS
EOF
fi
