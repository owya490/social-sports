#!/bin/bash

# Reads a Pyng checkout session from the sandbox or production API.
# Run from anywhere. Credentials come from functions/.env.dev or functions/.env.prod,
# the same files used by deployFunctionsToGCloud.sh.

if [ "$#" -ne 3 ]; then
    echo "Usage: $0 <environment> <checkout-session-id> <site-id>"
    echo "  <environment>: 'dev' or 'prod'"
    echo "  <checkout-session-id>: Pyng checkout session id"
    echo "  <site-id>: Pyng site id that owns the session"
    exit 1
fi

ENVIRONMENT=$1
CHECKOUT_SESSION_ID=$2
SITE_ID=$3

case "$ENVIRONMENT" in
    dev)
        USERNAME_KEY=PYNG_DEV_USERNAME
        PASSWORD_KEY=PYNG_DEV_PASSWORD
        DEFAULT_API_BASE=https://sample.pyng.com.au
        ;;
    prod)
        USERNAME_KEY=PYNG_PROD_USERNAME
        PASSWORD_KEY=PYNG_PROD_PASSWORD
        DEFAULT_API_BASE=https://app.pyng.com.au
        ;;
    *)
        echo "Invalid environment: $ENVIRONMENT" >&2
        echo "  <environment>: 'dev' or 'prod'" >&2
        exit 1
        ;;
esac

SCRIPT_DIR=$(cd "$(dirname "$0")" && pwd)
ENV_FILE="$SCRIPT_DIR/../../../../.env.$ENVIRONMENT"
if [ ! -f "$ENV_FILE" ]; then
    echo "Missing env file: $ENV_FILE" >&2
    exit 1
fi

set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a

USERNAME=${!USERNAME_KEY-}
PASSWORD=${!PASSWORD_KEY-}
if [ -z "$USERNAME" ] || [ -z "$PASSWORD" ]; then
    echo "Missing $USERNAME_KEY or $PASSWORD_KEY in $ENV_FILE" >&2
    exit 1
fi

API_BASE=${PYNG_API_BASE_URL:-$DEFAULT_API_BASE}
API_BASE=${API_BASE%/}
READ_SCOPE="urn:pyng:checkout:session:read"

urlencode() {
    python3 -c 'import urllib.parse, sys; print(urllib.parse.quote(sys.argv[1], safe=""))' "$1"
}

BASIC=$(printf '%s:%s' "$USERNAME" "$PASSWORD" | base64 | tr -d '\n')
TOKEN_RAW=$(curl -sS -w '\n%{http_code}' \
    -X POST "$API_BASE/checkout/oauth2/token" \
    -H "Authorization: Basic $BASIC" \
    -H "Accept: application/json" \
    --data-urlencode "grant_type=client_credentials" \
    --data-urlencode "scope=$READ_SCOPE")
TOKEN_CODE=$(printf '%s\n' "$TOKEN_RAW" | tail -n 1)
TOKEN_BODY=$(printf '%s\n' "$TOKEN_RAW" | sed '$d')
if [ "$TOKEN_CODE" != "200" ]; then
    echo "Pyng token request failed with status $TOKEN_CODE" >&2
    printf '%s\n' "$TOKEN_BODY" >&2
    exit 1
fi

ACCESS_TOKEN=$(printf '%s' "$TOKEN_BODY" | python3 -c 'import json, sys; print(json.load(sys.stdin)["access_token"])')
SESSION_URL="$API_BASE/checkout/$(urlencode "$SITE_ID")/session/$(urlencode "$CHECKOUT_SESSION_ID")"
RESPONSE_RAW=$(curl -sS -w '\n%{http_code}' \
    -X GET "$SESSION_URL" \
    -H "Authorization: Bearer $ACCESS_TOKEN" \
    -H "Accept: application/json")
RESPONSE_CODE=$(printf '%s\n' "$RESPONSE_RAW" | tail -n 1)
RESPONSE_BODY=$(printf '%s\n' "$RESPONSE_RAW" | sed '$d')

echo "GET $SESSION_URL"
echo "Status: $RESPONSE_CODE"
printf '%s' "$RESPONSE_BODY" | python3 -c 'import json, sys
raw = sys.stdin.read()
try:
    print(json.dumps(json.loads(raw), indent=2))
except json.JSONDecodeError:
    sys.stdout.write(raw)
    if raw and not raw.endswith("\n"):
        sys.stdout.write("\n")'

if [ "$RESPONSE_CODE" != "200" ]; then
    exit 1
fi
