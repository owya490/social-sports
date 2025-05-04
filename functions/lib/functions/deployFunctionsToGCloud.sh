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
#
# gcloud functions deploy createRecurrenceTemplate \
#     --entry-point com.functions.events.controllers.CreateRecurrenceTemplateEndpoint \
#     --runtime java17 \
#     --trigger-http \
#     --allow-unauthenticated \
#     --region australia-southeast1 \
#     --project socialsports-44162 \
#     --set-env-vars PROJECT_NAME=socialsports-44162 \

# # Deploy recurringEventsCron to DEV
# gcloud functions deploy recurringEventsCron \
#     --entry-point com.functions.events.controllers.RecurringEventsCronEndpoint \
#     --runtime java17 \
#     --trigger-http \
#     --allow-unauthenticated \
#     --region australia-southeast1 \
#     --project socialsports-44162 \
#     --set-env-vars PROJECT_NAME=socialsports-44162 \
#     --memory 512 # uses 266 MiB of memory, which is greater than the
# #                  the lower tier of 256

# # Deploy createEvent to DEV
# gcloud functions deploy createEvent \
#    --entry-point com.functions.events.controllers.CreateEventEndpoint \
#    --runtime java17 \
#    --trigger-http \
#    --allow-unauthenticated \
#    --region australia-southeast1 \
#    --project socialsports-44162 \
#    --set-env-vars PROJECT_NAME=socialsports-44162

# socialsportsprod
