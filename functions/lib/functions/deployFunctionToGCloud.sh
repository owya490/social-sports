#!/bin/bash

cp ../../functions_key_dev.json functions_key.json

cp ../../.env.dev .env

gcloud functions deploy recurringEventsCron \
    --entry-point com.functions.RecurringEvents.RecurringEvents \
    --runtime java17 \
    --trigger-http \
    --allow-unauthenticated \
    --region australia-southeast1 \
    --set-env-vars PROJECT_NAME=socialsports-44162
