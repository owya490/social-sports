#!/bin/bash

# Creates the fulfilment-session Pub/Sub topic and its dead-letter topic.
# Eventarc retains unacked messages on the trigger subscription for 24 hours.
# Both topics, and that subscription, retain messages for 7 days. Dead-letter
# messages stay on their topic for that duration because it has no subscriber.
# Pass attach-dead-letter after processFulfilmentSession has been deployed so the
# trigger subscription moves a failing message to the dead-letter topic.
# Pub/Sub rejects a dead-letter policy below 5 delivery attempts, so 5 is the smallest retry count.
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
MESSAGE_RETENTION="7d"

echo "Setting up $TOPIC in $ENVIRONMENT project $PROJECT_NAME"

gcloud services enable pubsub.googleapis.com --project="$PROJECT_NAME"

ensure_topic() {
    local topic="$1"
    if gcloud pubsub topics describe "$topic" --project="$PROJECT_NAME" >/dev/null 2>&1; then
        echo "Pub/Sub topic $topic already exists"
    else
        gcloud pubsub topics create "$topic" --project="$PROJECT_NAME" \
            --message-retention-duration="$MESSAGE_RETENTION"
    fi
    gcloud pubsub topics update "$topic" --project="$PROJECT_NAME" \
        --message-retention-duration="$MESSAGE_RETENTION" \
        --quiet
    echo "Message retention for $topic is $MESSAGE_RETENTION"
}

ensure_topic "$TOPIC"
ensure_topic "$DEAD_LETTER_TOPIC"

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
            --message-retention-duration="$MESSAGE_RETENTION" \
            --quiet
        echo "Attached dead letter to $SUBSCRIPTION with message retention $MESSAGE_RETENTION"
    done <<EOF
$SUBSCRIPTIONS
EOF
fi
