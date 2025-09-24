#!/bin/bash

# Currently available functions are:
# updateRecurrenceTemplate
# createRecurrenceTemplate
# recurringEventsCron
# deleteFulfilmentSession
# cleanupOldFulfilmentSessionsCron
# completeFulfilmentSession
# globalAppController

# Check if the function name is valid and it should be a list of function name and another list of endpoint class name

VALID_FUNCTIONS=(
    "updateRecurrenceTemplate" 
    "createRecurrenceTemplate" 
    "recurringEventsCron"
    "deleteFulfilmentSession"
    "cleanupOldFulfilmentSessionsCron"
    "completeFulfilmentSession"
    "globalAppController"
)

VALID_ENDPOINTS=(
    "com.functions.events.controllers.UpdateRecurrenceTemplateEndpoint" 
    "com.functions.events.controllers.CreateRecurrenceTemplateEndpoint" 
    "com.functions.events.controllers.RecurringEventsCronEndpoint"
    "com.functions.fulfilment.controllers.DeleteFulfilmentSessionEndpoint"
    "com.functions.fulfilment.controllers.CleanupOldFulfilmentSessionsCronEndpoint"
    "com.functions.fulfilment.controllers.CompleteFulfilmentSessionEndpoint"
    "com.functions.global.controllers.GlobalAppController"
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
    cp ../../functions_key_dev.json functions_key.json
    cp ../../.env.dev .env
else
    cp ../../functions_key_prod.json functions_key.json
    cp ../../.env.prod .env
fi

# project name is socialsports-44162 for dev and socialsportsprod for prod
if [ "$ENVIRONMENT" == "dev" ]; then
    PROJECT_NAME="socialsports-44162"
else
    PROJECT_NAME="socialsportsprod"
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
    --memory 512 # uses 266 MiB of memory, which is greater than the the lower tier of 256
