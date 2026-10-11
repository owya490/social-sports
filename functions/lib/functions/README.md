# Java Cloud Functions

Read [AGENTS.md](AGENTS.md) for verification and deployment rules. Verify with
`mvn clean verify`. Deployment requires explicit operator approval. For an
approved single-function deployment, run
`./deployFunctionsToGCloud.sh <dev|prod> <function_name>` from this directory.

Cloud Scheduler jobs are managed separately by scripts in this directory.
Inspect their arguments and the target project before any approved
scheduler change.

## AI error alerts

Cloud Logging routes eligible function errors through the `error-log-alerts`
Pub/Sub topic to `explainErrorAlert`. The function writes structured evidence and
an optional AI interpretation to the dedicated `sportshub-alert-sms` log.
Cloud Monitoring sends a deterministic factual headline and a Logs Explorer
link to explicitly configured notification channels. The link selects the
fingerprint's summaries from the last seven days; each summary includes a link
to the original error. Existing Google Cloud log permissions apply.

The existing Google Monitoring email and SMS channels remain the delivery
mechanism. Email includes the evidence/AI link in its documentation and Quick
Links. SMS uses the normal incident link; open incident details to reach the
explanation. AI prose is not an extracted Monitoring label or notification
subject. No separate email sender is needed.

Observed log evidence is primary. The optional AI explanation is prompted to
summarize supported observations, identify missing evidence, and suggest a
specific next investigation check when supported. Hypotheses remain labelled
unconfirmed; prompt instructions do not guarantee that generated claims are true.

- `AlertLogPolicy` filters known noise and prevents summary recursion.
- `CloudLogEntryParser` selects supported message fields and HTTP evidence;
  `ParsedErrorLog` sanitizes evidence before truncation.
- `ErrorAlertFingerprint` and the factual headline use the same normalized
  first line, so changing AI wording cannot change incident identity.
- `ExplainErrorAlertService` coordinates reservations, optional interpretation
  and publication. Facts are published even when AI is unavailable.
- `ErrorAlertDedupRepository` reserves one global slot, fences completion/release
  to the owner, and fails closed on errors. The global cooldown also suppresses
  repeats of any individual error, so per-fingerprint state is unnecessary.
- `CloudLoggingNearbyLogFetcher` reads one newest-first page of at most 100
  entries, selects at most 30, and returns at most 8,000 characters in time order.
  The summarizer retains a final prompt-size guard.

Both the sink filter and runtime policy exclude the exact Firebase
callable GET rejection: `Invalid request, unable to process.`, the
`deployment-callable=true` label, HTTP method `GET`, and source function
`_on_call_handler`. POST errors and entries missing any of those fields remain
eligible. Runtime filtering happens before reserving a notification slot.
Recursion is identified by the dedicated log or explainer service metadata,
not marker text inside application errors.

The runtime uses application-default credentials and explicit `PROJECT_NAME`,
without loading application Firebase credentials or PostHog. Its service
account needs `roles/logging.viewer`, `roles/logging.logWriter`,
`roles/datastore.user`, and `roles/aiplatform.user`.

Successful publication starts the existing ten-minute global cooldown. A rolling 24-hour limit of 20 publications matches Monitoring's
log-alert budget. An active three-minute lease is retryable; intentional
cooldown/budget suppression is acknowledged. Publication failure releases the
lease and escapes the handler. Completion failure escapes without releasing
early. The deployment enables retries with a two-minute function timeout;
events older than one hour are acknowledged without processing. Firestore and
Logging do not share a transaction, so duplicate publication remains possible.
The publisher uses a deterministic insert ID for source-event redelivery.

### Configuration and rollout

Merging source does not deploy `explainErrorAlert` or reconcile the live sink
and policy. These operations require separate operator approval. Preview the
configuration without Cloud writes:

```bash
python3 error_alert_config.py filter --environment dev
python3 error_alert_config.py policy --environment dev \
  --channel 'projects/socialsports-44162/notificationChannels/<channel-id>'
```

Use the smallest approved operation:

- Sink filter only: `./updateErrorLogAlertSink.sh <dev|prod>` updates an existing
  sink without touching IAM, topics, APIs, notification policy or recipients.
- Policy only: `python3 error_alert_config.py apply-policy --environment <dev|prod>
  --channel <channel-resource>` fetches current state, rejects ambiguous policy
  names, and updates managed fields while preserving the condition ID.
  Repeat `--channel` for every intended recipient channel. No automatic discovery.
- Initial provisioning: `./setupErrorLogAlertSink.sh <dev|prod> <channel-resource>
  [channel-resource...]` validates/renders the policy before enabling APIs,
  granting runtime and sink IAM, creating the topic/sink, and applying the policy.
- Function only: `./deployFunctionsToGCloud.sh <dev|prod> explainErrorAlert`.

The structured publisher and policy filter must be rolled out together.
Validate in development first, then deploy/reconcile production and check a
real log-to-notification path. Keep the existing raw-error alert policy as a
fallback during this transition. Live model, IAM, Eventarc retry and SMS/email
delivery are separate checks from the local suite.

### Local verification

Run `mvn clean verify` and `python3 -m unittest discover -s tests -v` here.
The five repository integration tests require a localhost Firestore emulator
via `FIRESTORE_EMULATOR_HOST`; they skip when it is absent. For example:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8787 mvn -Dtest=ErrorAlertDedupRepositoryIntegrationTest test
```

Those tests exercise real transactions for concurrent claims, cooldowns, lease
expiry, ownership fencing, release/retry and the rolling daily budget. The
configuration tests use a fake `gcloud` executable and make no Cloud calls.
