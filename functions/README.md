# Python Firebase Functions

Read [AGENTS.md](AGENTS.md) for local checks and deployment rules. Deployments
require explicit operator approval. For an approved single-function deployment,
run `./deployFunctionToFirebase.sh <dev|prod> <function_name>` from this directory.
Do not run a broad `firebase deploy`; an incomplete function list can delete
deployed functions.
