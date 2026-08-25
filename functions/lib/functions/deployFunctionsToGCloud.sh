#!/bin/bash

# Currently available functions are:
# updateRecurrenceTemplate
# createRecurrenceTemplate
# recurringEventsCron
# cleanupOldFulfilmentSessionsCron
# expirePendingBookingsCron
# completeFulfilmentSession
# globalAppController
# stripeWebhookEndpoint

# Check if the function name is valid and it should be a list of function name and another list of endpoint class name

VALID_FUNCTIONS=(
    "updateRecurrenceTemplate" 
    "createRecurrenceTemplate" 
    "recurringEventsCron"
    "cleanupOldFulfilmentSessionsCron"
    "expirePendingBookingsCron"
    "completeFulfilmentSession"
    "globalAppController"
    "stripeWebhookEndpoint"
)

VALID_ENDPOINTS=(
    "com.functions.events.controllers.UpdateRecurrenceTemplateEndpoint" 
    "com.functions.events.controllers.CreateRecurrenceTemplateEndpoint" 
    "com.functions.events.controllers.RecurringEventsCronEndpoint"
    "com.functions.fulfilment.controllers.CleanupOldFulfilmentSessionsCronEndpoint"
    "com.functions.tickets.controllers.ExpirePendingBookingsCronEndpoint"
    "com.functions.fulfilment.controllers.CompleteFulfilmentSessionEndpoint"
    "com.functions.global.controllers.GlobalAppController"
    "com.functions.stripe.controllers.StripeWebhookEndpoint"
)

# Check for exactly 2 arguments
if [ "$#" -ne 2 ]; then
    echo "Usage: $0 <environment> <function_name>"
    echo "  <environment>: 'dev' or 'prod'"
    echo "  <function_name>: one of ${VALID_FUNCTIONS[@]}"
    exit 1
fi

ENVIRONMENT=$1
FUNCTION_NAME=$2

# Check if the function name is valid by looping through the VALID_FUNCTIONS array and checking if the function name is in the array and also get the index
INDEX=0
for FUNCTION in "${VALID_FUNCTIONS[@]}"; do
    if [ "$FUNCTION" == "$FUNCTION_NAME" ]; then
        ENDPOINT_CLASS_NAME=${VALID_ENDPOINTS[$INDEX]}
        break
    fi
    INDEX=$((INDEX + 1))
done

# Check if the environment is valid
VALID_ENVIRONMENTS=("dev" "prod")
if ! [[ " ${VALID_ENVIRONMENTS[@]} " =~ " ${ENVIRONMENT} " ]]; then
    echo "Invalid environment: $ENVIRONMENT"
    exit 1
fi

if [ "$ENVIRONMENT" == "dev" ]; then
    FUNCTIONS_KEY_SOURCE=../../functions_key_dev.json
    ENV_SOURCE=../../.env.dev
else
    FUNCTIONS_KEY_SOURCE=../../functions_key_prod.json
    ENV_SOURCE=../../.env.prod
fi

for REQUIRED_FILE in "$FUNCTIONS_KEY_SOURCE" "$ENV_SOURCE"; do
    if [ ! -f "$REQUIRED_FILE" ]; then
        echo "Missing required local deployment file: $REQUIRED_FILE" >&2
        exit 1
    fi
done

cp "$FUNCTIONS_KEY_SOURCE" functions_key.json
cp "$ENV_SOURCE" .env

# project name is socialsports-44162 for dev and socialsportsprod for prod
if [ "$ENVIRONMENT" == "dev" ]; then
    PROJECT_NAME="socialsports-44162"
else
    PROJECT_NAME="socialsportsprod"
fi

EXTRA_DEPLOY_ARGS=()
if [ "$ENVIRONMENT" == "prod" ] && [ "$FUNCTION_NAME" == "globalAppController" ]; then
    EXTRA_DEPLOY_ARGS=(
        --concurrency 80
        --min-instances 1
        --max-instances 5
        --cpu 1
    )
elif [ "$ENVIRONMENT" == "prod" ] && [ "$FUNCTION_NAME" == "stripeWebhookEndpoint" ]; then
    EXTRA_DEPLOY_ARGS=(
        --concurrency 1
        --min-instances 0
        --max-instances 5
        --cpu 0.5
    )
fi

echo "Deploying $FUNCTION_NAME (Entry point: $ENDPOINT_CLASS_NAME) to $ENVIRONMENT under project $PROJECT_NAME"

gcloud functions deploy $FUNCTION_NAME \
    --entry-point $ENDPOINT_CLASS_NAME \
    --runtime java17 \
    --trigger-http \
    --allow-unauthenticated \
    --region australia-southeast1 \
    --project $PROJECT_NAME \
    --set-env-vars PROJECT_NAME=$PROJECT_NAME \
    --memory 512 \
    "${EXTRA_DEPLOY_ARGS[@]}" # uses 512 MiB of memory, which is greater than the the lower tier of 256
