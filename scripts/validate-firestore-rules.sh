#!/usr/bin/env bash

# Loads a Firestore rules file into the running Firestore emulator and fails if it does not compile.
# The emulator starts happily with invalid rules, so the rules must be pushed through its rules endpoint.
# Run via: firebase emulators:exec --only firestore --project demo-rules-check "scripts/validate-firestore-rules.sh"

set -euo pipefail

rules_file="${1:-firestore.rules}"

payload="$(python3 -c 'import json, sys; print(json.dumps({"rules": {"files": [{"name": "firestore.rules", "content": open(sys.argv[1]).read()}]}}))' "$rules_file")"

curl --silent --show-error --fail-with-body --request PUT \
    "http://${FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/demo-rules-check:securityRules" \
    --header "Content-Type: application/json" \
    --data "$payload"
echo
echo "$rules_file compiled successfully"
