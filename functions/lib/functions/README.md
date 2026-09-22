# Java Cloud Functions

Read [AGENTS.md](AGENTS.md) for verification and deployment rules. Verify with
`mvn clean verify`. Deployment requires explicit operator approval. For an
approved single-function deployment, run
`./deployFunctionsToGCloud.sh <dev|prod> <function_name>` from this directory.

Cloud Scheduler jobs are managed separately by scripts in this directory.
Inspect their arguments and the target project before any approved
scheduler change.
