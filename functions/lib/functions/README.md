To compile use `mvn clean install`

Functions are deployed to google cloud platform using the `./deployFunctionsToGCloud.sh` script. Simply just run `./deployFunctionsToGCloud.sh`.

## Running the GlobalAppController locally

```bash
# Needs functions_key.json and .env in this directory (same files the deploy script copies in).
# PROJECT_NAME is supplied by --set-env-vars in production, so set it by hand locally.
PROJECT_NAME=socialsports-44162 mvn function:run
```

The function listens on `http://localhost:8080` and talks to the **dev** Firestore.
Without `PROJECT_NAME`, `FirebaseService` fails to initialise and every request
returns 500.

To run a different entry point:

```bash
mvn function:run -Drun.functionTarget=com.functions.stripe.controllers.StripeWebhookEndpoint
```

## Testing the auth layer

`./smokeTestGlobalAppControllerAuth.sh <target> [eventId]` exercises the
GlobalAppController auth rules over HTTP. `<target>` is `local`, `dev`, `prod`, or a
full URL.

```bash
# Auth rules only (no data touched)
./smokeTestGlobalAppControllerAuth.sh local

# Also runs the fulfilment session-secret flow against a real, bookable event
./smokeTestGlobalAppControllerAuth.sh local <eventId>

# Include the signed-in-caller checks
ID_TOKEN=<firebase id token> OTHER_EVENT_ID=<event you do NOT own> \
  ./smokeTestGlobalAppControllerAuth.sh dev <eventId>
```

Set `FIREBASE_API_KEY`, `TEST_EMAIL` and `TEST_PASSWORD` instead of `ID_TOKEN` to have
the script sign in and fetch a token itself. The script exits non-zero if any check
fails, so it can be wired into CI against dev after a deploy.

The scheduler for the recurringEventsCron Google Cloud Run function written in Java is deployed by simply running `./deploySchedulerToGCloud.sh` script.

// TODO write gcloud install docs
