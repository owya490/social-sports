gcloud run services add-iam-policy-binding recurringeventscron \
    --member=serviceAccount:socialsports-44162@appspot.gserviceaccount.com \
    --role=roles/run.invoker \
    --region="australia-southeast1"
# TODO: need to make a scheduler specific service account. The default service account has been temporarily used for convenience.

gcloud scheduler jobs create http recurring-events-cron-job \
    --schedule="0 0 * * *" \
    --time-zone="Australia/Sydney" \
    --uri="https://australia-southeast1-socialsports-44162.cloudfunctions.net/recurringEventsCron" \
    --http-method=GET \
    --headers="Content-Type=application/json" \
    --location="australia-southeast1" \
    --oidc-service-account-email="socialsports-44162@appspot.gserviceaccount.com"
    # This ensures the Cloud Scheduler sends an OIDC token with each request.
    # This OIDC token will be checked in the recurring events cloud function.