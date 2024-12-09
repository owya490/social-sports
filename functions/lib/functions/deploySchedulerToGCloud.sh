gcloud scheduler jobs create http recurring-events-job \
    --schedule="0 0 * * *" \
    --time-zone="Australia/Sydney" \
    --uri="https://australia-southeast1-socialsportsprod.cloudfunctions.net/recurringEventsCron" \
    --http-method=GET \
    --headers="Content-Type=application/json" \
    --project socialsportsprod \
    --location="australia-southeast1"