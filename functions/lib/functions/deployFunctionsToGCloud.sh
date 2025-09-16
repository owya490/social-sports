#!/bin/bash

cp ../../functions_key_dev.json functions_key.json

cp ../../.env.dev .env


# cp ../../functions_key_prod.json functions_key.json
# 
# cp ../../.env.prod .env

gcloud functions deploy updateRecurrenceTemplate \
    --entry-point com.functions.events.controllers.UpdateRecurrenceTemplateEndpoint \
    --runtime java17 \
    --trigger-http \
    --allow-unauthenticated \
    --region australia-southeast1 \
    --project socialsports-44162 \
    --set-env-vars PROJECT_NAME=socialsports-44162 \

gcloud functions deploy createRecurrenceTemplate \
    --entry-point com.functions.events.controllers.CreateRecurrenceTemplateEndpoint \
    --runtime java17 \
    --trigger-http \
    --allow-unauthenticated \
    --region australia-southeast1 \
    --project socialsports-44162 \
    --set-env-vars PROJECT_NAME=socialsports-44162 \

# Deploy recurringEventsCron to DEV
gcloud functions deploy recurringEventsCron \
    --entry-point com.functions.events.controllers.RecurringEventsCronEndpoint \
    --runtime java17 \
    --trigger-http \
    --allow-unauthenticated \
    --region australia-southeast1 \
    --project socialsports-44162 \
    --set-env-vars PROJECT_NAME=socialsports-44162 \
    --memory 512 # uses 266 MiB of memory, which is greater than the
#                  the lower tier of 256

# Deploy initFulfilmentSession to DEV
gcloud functions deploy initFulfilmentSession \
    --entry-point com.functions.fulfilment.controllers.InitFulfilmentSessionEndpoint \
    --runtime java17 \
    --trigger-http \
    --allow-unauthenticated \
    --region australia-southeast1 \
    --project socialsports-44162 \
    --set-env-vars PROJECT_NAME=socialsports-44162 \
    --memory 512

# Deploy getNextFulfilmentEntity to DEV
gcloud functions deploy getNextFulfilmentEntity \
    --entry-point com.functions.fulfilment.controllers.GetNextFulfilmentEntityEndpoint \
    --runtime java17 \
    --trigger-http \
    --allow-unauthenticated \
    --region australia-southeast1 \
    --project socialsports-44162 \
    --set-env-vars PROJECT_NAME=socialsports-44162 \
    --memory 512

# Deploy getPrevFulfilmentEntity to DEV
gcloud functions deploy getPrevFulfilmentEntity \
    --entry-point com.functions.fulfilment.controllers.GetPrevFulfilmentEntityEndpoint \
    --runtime java17 \
    --trigger-http \
    --allow-unauthenticated \
    --region australia-southeast1 \
    --project socialsports-44162 \
    --set-env-vars PROJECT_NAME=socialsports-44162 \
    --memory 512

# Deploy getFulfilmentEntityInfo to DEV
gcloud functions deploy getFulfilmentEntityInfo \
    --entry-point com.functions.fulfilment.controllers.GetFulfilmentEntityInfoEndpoint \
    --runtime java17 \
    --trigger-http \
    --allow-unauthenticated \
    --region australia-southeast1 \
    --project socialsports-44162 \
    --set-env-vars PROJECT_NAME=socialsports-44162 \
    --memory 512

# Deploy getFulfilmentSessionInfo to DEV
gcloud functions deploy getFulfilmentSessionInfo \
    --entry-point com.functions.fulfilment.controllers.GetFulfilmentSessionInfoEndpoint \
    --runtime java17 \
    --trigger-http \
    --allow-unauthenticated \
    --region australia-southeast1 \
    --project socialsports-44162 \
    --set-env-vars PROJECT_NAME=socialsports-44162 \
    --memory 512

# Deploy updateFulfilmentEntityWithFormResponseId to DEV
gcloud functions deploy updateFulfilmentEntityWithFormResponseId \
    --entry-point com.functions.fulfilment.controllers.UpdateFulfilmentEntityWithFormResponseIdEndpoint \
    --runtime java17 \
    --trigger-http \
    --allow-unauthenticated \
    --region australia-southeast1 \
    --project socialsports-44162 \
    --set-env-vars PROJECT_NAME=socialsports-44162 \
    --memory 512

# Deploy deleteFulfilmentSession to DEV
gcloud functions deploy deleteFulfilmentSession \
    --entry-point com.functions.fulfilment.controllers.DeleteFulfilmentSessionEndpoint \
    --runtime java17 \
    --trigger-http \
    --allow-unauthenticated \
    --region australia-southeast1 \
    --project socialsports-44162 \
    --set-env-vars PROJECT_NAME=socialsports-44162 \
    --memory 512

# Deploy cleanupOldFulfilmentSessionsCron to DEV
gcloud functions deploy cleanupOldFulfilmentSessionsCron \
    --entry-point com.functions.fulfilment.controllers.CleanupOldFulfilmentSessionsCronEndpoint \
    --runtime java17 \
    --trigger-http \
    --allow-unauthenticated \
    --region australia-southeast1 \
    --project socialsports-44162 \
    --set-env-vars PROJECT_NAME=socialsports-44162 \
    --memory 512

# Deploy completeFulfilmentSession to DEV
gcloud functions deploy completeFulfilmentSession \
    --entry-point com.functions.fulfilment.controllers.CompleteFulfilmentSessionEndpoint \
    --runtime java17 \
    --trigger-http \
    --allow-unauthenticated \
    --region australia-southeast1 \
    --project socialsports-44162 \
    --set-env-vars PROJECT_NAME=socialsports-44162 \
    --memory 512

gcloud functions deploy globalAppController \
    --entry-point com.functions.global.controllers.GlobalAppController \
    --runtime java17 \
    --trigger-http \
    --allow-unauthenticated \
    --region australia-southeast1 \
    --project socialsports-44162 \
    --set-env-vars PROJECT_NAME=socialsports-44162 \
    --memory 512