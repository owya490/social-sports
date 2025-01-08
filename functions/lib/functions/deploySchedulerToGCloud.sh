gcloud run services add-iam-policy-binding recurringeventscron \
    --member=serviceAccount:socialsports-44162@appspot.gserviceaccount.com \
    --role=roles/run.invoker \
    --region="australia-southeast1"
# TODO: need to make a scheduler specific service account. The default service account has been temporarily used for convenience.

gcloud scheduler jobs create http recurring-events-cron-job \
    --schedule="0 0 * * *" \
    --time-zone="Australia/Sydney" \
    --uri="https://australia-southeast1-socialsportsprod.cloudfunctions.net/recurringEventsCron" \
    --http-method=GET \
    --headers="Content-Type=application/json" \
    --project socialsportsprod \
    --location="australia-southeast1"