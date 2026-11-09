# Java Cloud Functions

Read [AGENTS.md](AGENTS.md) for verification and deployment rules. Verify with
`mvn clean verify`. Deployment requires explicit operator approval. For an
approved single-function deployment, run
`./deployFunctionsToGCloud.sh <dev|prod> <function_name>` from this directory.

Cloud Scheduler jobs are managed separately by scripts in this directory.
Inspect their arguments and the target project before any approved
scheduler change.

## Provision a partner integration

Use Java 17 and Maven. The command previews the target project and settings
without contacting Firebase:

```bash
./provisionPartnerIntegration.sh --environment dev \
  --partner example-club --organiser '<organiser-user-id>' \
  --origin https://partner.example
```

Use the `organiserId` recorded on the club's events. Repeat `--origin` for each
website origin, including `www` separately when needed. Use no trailing slash
or page path. Production origins require HTTPS; development also permits
explicit localhost ports such as `http://localhost:3000`.

To create the record, authenticate with `gcloud auth application-default login`,
then rerun the command with `--apply`. Use `--environment prod` to target
production. The operator needs permission to create Firestore documents in the
selected project. Unset `FIRESTORE_EMULATOR_HOST` for an apply operation.

The command atomically creates `PartnerIntegrations/<integration-id>` and refuses
to overwrite an existing record. Only the key's SHA-256 hash is stored. The
original key is displayed once after creation; save it outside the repository
and give it to the partner with the API reference. Do not tee or log this output.
Use independent keys in development and production.

Inspect the configuration in Firebase Console. Set `enabled` to `false` to
disable the integration. If creation fails or times out, inspect the selected
project before retrying; the record might already exist. Provisioning does not
deploy the backend or change the partner's website.

## AI error alerts

Cloud Logging routes eligible function errors through the `error-log-alerts`
Pub/Sub topic to `explainErrorAlert`. The function writes structured evidence and
an optional AI interpretation to the dedicated `sportshub-alert-sms` log.
Cloud Monitoring extracts `jsonPayload.sms` as `documentation.subject`: a
255 UTF-8 byte complete-sentence trim of the AI interpretation. The log also
stores a longer `aiInterpretation` for Logs Explorer and email body content,
plus a factual `headline`. The link selects the fingerprint's summaries from
the last seven days; each summary includes a link to the original error.
Existing Google Cloud log permissions apply.

The existing Google Monitoring email and SMS channels remain the delivery
mechanism. Email includes the SMS sentences, evidence/AI link, and Quick
Links. SMS uses the extracted 255-byte AI subject. No separate email sender
is needed.

Observed log evidence is primary. The optional AI explanation is prompted to
summarize supported observations, identify missing evidence, and suggest a
specific next investigation check when supported. Hypotheses remain labelled
unconfirmed; prompt instructions do not guarantee that generated claims are true.

- `AlertLogPolicy` filters known noise and prevents summary recursion.
- `CloudLogEntryParser` selects supported message fields and HTTP evidence;
  `ParsedErrorLog` sanitizes evidence before truncation.
- `ErrorAlertFingerprint` and the factual headline use the same normalized
  first line, so changing AI wording cannot change incident identity.
- `ExplainErrorAlertService` claims, interprets and publishes. Facts are
  published even when AI is unavailable. It never throws.
- `AlertClaimRepository` claims, in one transaction, a fingerprint for six
  hours, a ten-minute global window and one of 15 daily pages. These mirror the
  policy's 600s notification limit and Google's 20 log-alert incidents a day,
  which otherwise drop pages silently. A burst pages once, and a repeating
  error pages at most every six hours.

Both the sink filter and runtime policy exclude the exact Firebase
callable GET rejection: `Invalid request, unable to process.`, the
`deployment-callable=true` label, HTTP method `GET`, and source function
`_on_call_handler`. POST errors and entries missing any of those fields remain
eligible. Runtime filtering happens before reserving a notification slot.
Recursion is identified by the dedicated log or explainer service metadata,
not marker text inside application errors.

The runtime uses application-default credentials and explicit `PROJECT_NAME`,
without loading application Firebase credentials or PostHog. Its service
account needs `roles/logging.logWriter`, `roles/datastore.user`, and
`roles/aiplatform.user`.

The function is deployed without Pub/Sub retry and acknowledges every event,
so a failure costs at most one SMS instead of a redelivery storm. A Firestore
outage fails open: it pages the factual headline without dedup or Gemini, so
identical headlines fold into one open Monitoring incident. A publication
failure releases the claim. Firestore TTL on `ErrorAlertClaims.expireAt`
deletes old claims; deletion can lag, so claims compare `expireAt` with now.
To mute alerts, snooze the Monitoring policy with an end time instead of
disabling it.

### Configuration and rollout

Merges to `master` deploy `explainErrorAlert` and reconcile its existing sink
filter and policy after the application functions finish. Development runs
first; a failed development rollout prevents the production rollout. Development
notifications are always disabled, including when applying a policy manually.
Production preserves its current recipients and enabled/disabled state. The
sink's enabled/disabled state is preserved. When the development sink is disabled,
direct Pub/Sub test events can exercise the function without sending notifications.

Environments provisioned before claim-based dedup need these one-off steps,
because CI does not provision them: enable TTL with
`gcloud firestore fields ttls update expireAt --collection-group=ErrorAlertClaims --enable-ttl --project=<project>`,
delete the unused `ErrorAlertDedup` collection, and remove the runtime
service account's `roles/logging.viewer` grant.

CI requires an existing topic, sink and uniquely named AI policy. It never
provisions APIs, grants IAM or discovers notification channels. The deployment
identity needs function deployment,
Logging sink update and Monitoring policy update permissions; its runtime service
account needs the roles above. Complete the initial coordinated rollout and
validate development before merging the CI change.

Preview the configuration without Cloud writes:

```bash
python3 error_alert_config.py filter --environment dev
python3 error_alert_config.py policy --environment dev
```

Use the smallest approved operation:

- Sink filter only: `./updateErrorLogAlertSink.sh <dev|prod>` updates an existing
  sink without touching IAM, topics, APIs, notification policy or recipients.
- Policy only: `python3 error_alert_config.py apply-policy --environment <dev|prod>
  --channel <channel-resource>` fetches current state, rejects ambiguous policy
  names, and updates managed fields while preserving the condition ID.
  Repeat `--channel` for every intended recipient channel. No automatic discovery.
- Initial provisioning: `./setupErrorLogAlertSink.sh <dev|prod> [channel-resource...]`
  validates/renders the policy before enabling APIs,
  granting runtime and sink IAM, creating the topic/sink, and applying the policy.
  Production requires explicit project-scoped channels; omit channels in development.
- Function only: `./deployFunctionsToGCloud.sh <dev|prod> explainErrorAlert`.
- Routine coordinated rollout: `python3 error_alert_config.py deploy --environment
  <dev|prod>` uses the same operation as CI, preserving existing recipients and
  production notification state. It disables the development policy before
  deploying, then updates the sink filter and managed policy fields.

The structured publisher and policy filter must be rolled out together.
Validate in development first, then deploy/reconcile production and check a
real log-to-notification path. Keep the existing raw-error alert policy as a
fallback: function, sink and policy updates are not atomic, and CI stops on any
failure. Development validation uses logs without sending SMS or email;
notification delivery is a production-only check. Live model, IAM, Eventarc delivery
and SMS/email delivery are separate checks from the local suite.

### Local verification

Run `mvn clean verify` and `python3 -m unittest discover -s tests -v` here.
The repository integration tests require a localhost Firestore emulator
via `FIRESTORE_EMULATOR_HOST`; they skip when it is absent. For example:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8787 mvn -Dtest=AlertClaimRepositoryIntegrationTest test
```

Those tests exercise real transactions for concurrent claims, expired-claim
reuse and release. The
configuration tests use a fake `gcloud` executable and make no Cloud calls.
