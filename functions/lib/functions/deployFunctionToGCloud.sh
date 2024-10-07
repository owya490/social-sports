#!/bin/bash

gcloud functions deploy recurringEventsCron \
    --entry-point com.functions.RecurringEvents.RecurringEvents \
    --runtime java17 \
    --trigger-http \
    --allow-unauthenticated \
    --region australia-southeast1