#!/bin/bash
#
# Smoke tests the GlobalAppController auth layer.
#
# Usage:
#   ./smokeTestGlobalAppControllerAuth.sh <target> [eventId]
#
#   <target>  'dev', 'prod', 'local' (http://localhost:8080), or a full URL
#   [eventId] optional; enables the fulfilment session-secret tests. Must be a
#             real event in the target environment.
#
# Optional environment variables:
#   ID_TOKEN         A Firebase ID token. Enables the authenticated-caller tests.
#   FIREBASE_API_KEY \
#   TEST_EMAIL        Set all three instead of ID_TOKEN and the script will sign
#   TEST_PASSWORD     in via the Firebase Auth REST API to obtain a token.
#   OTHER_EVENT_ID   An event owned by a *different* organiser. Enables the
#                    cross-tenant authorization test.
#
# Exit code is non-zero if any check fails.

set -uo pipefail

TARGET="${1:-dev}"
EVENT_ID="${2:-}"

case "$TARGET" in
    dev)   URL="https://australia-southeast1-socialsports-44162.cloudfunctions.net/globalAppController" ;;
    prod)  URL="https://australia-southeast1-socialsportsprod.cloudfunctions.net/globalAppController" ;;
    local) URL="http://localhost:8080" ;;
    http*) URL="$TARGET" ;;
    *)     echo "Unknown target: $TARGET (expected dev, prod, local or a URL)"; exit 1 ;;
esac

PASS_COUNT=0
FAIL_COUNT=0

green() { printf '\033[0;32m%s\033[0m' "$1"; }
red()   { printf '\033[0;31m%s\033[0m' "$1"; }

# post <endpointType> <dataJson> [extra curl args...] -> prints HTTP status code
post() {
    local endpoint_type="$1"; shift
    local data="$1"; shift
    curl -s -o /tmp/gac_body.$$ -w '%{http_code}' -X POST "$URL" \
        -H 'Content-Type: application/json' \
        "$@" \
        -d "{\"endpointType\":\"${endpoint_type}\",\"data\":${data}}"
}

# expect <description> <expectedStatus> <actualStatus>
expect() {
    local description="$1" expected="$2" actual="$3"
    if [ "$actual" == "$expected" ]; then
        echo "  $(green PASS)  $description (HTTP $actual)"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo "  $(red FAIL)  $description — expected HTTP $expected, got $actual"
        [ -f /tmp/gac_body.$$ ] && echo "         body: $(head -c 300 /tmp/gac_body.$$)"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

# expect_not <description> <unexpectedStatus> <actualStatus>
expect_not() {
    local description="$1" unexpected="$2" actual="$3"
    if [ "$actual" != "$unexpected" ]; then
        echo "  $(green PASS)  $description (HTTP $actual)"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        echo "  $(red FAIL)  $description — should not have returned HTTP $unexpected"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    fi
}

echo "Target: $URL"
echo

# ---------------------------------------------------------------------------
echo "[1] CORS"
# ---------------------------------------------------------------------------
PREFLIGHT=$(curl -s -D - -o /dev/null -X OPTIONS "$URL" \
    -H 'Origin: https://www.sportshub.net.au' \
    -H 'Access-Control-Request-Method: POST' \
    -H 'Access-Control-Request-Headers: content-type,authorization,x-session-secret')

if echo "$PREFLIGHT" | grep -qi '^access-control-allow-origin:'; then
    echo "  $(green PASS)  preflight returns Access-Control-Allow-Origin"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo "  $(red FAIL)  preflight is missing Access-Control-Allow-Origin"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

if echo "$PREFLIGHT" | grep -qi '^access-control-allow-headers:.*x-session-secret'; then
    echo "  $(green PASS)  preflight allows the X-Session-Secret header"
    PASS_COUNT=$((PASS_COUNT + 1))
else
    echo "  $(red FAIL)  preflight does not allow X-Session-Secret"
    FAIL_COUNT=$((FAIL_COUNT + 1))
fi

# A wildcard ACAO and credentialed requests are mutually exclusive. If the origin
# is '*' then Allow-Credentials must be absent, otherwise browsers block every
# response. If someone later switches to an origin allowlist, both may be present.
ACAO=$(echo "$PREFLIGHT" | grep -i '^access-control-allow-origin:' | tr -d '\r' | awk '{print $2}')
if [ "$ACAO" == "*" ] && echo "$PREFLIGHT" | grep -qi '^access-control-allow-credentials:'; then
    echo "  $(red FAIL)  wildcard origin combined with Allow-Credentials — browsers will block all calls"
    FAIL_COUNT=$((FAIL_COUNT + 1))
else
    echo "  $(green PASS)  CORS origin/credentials combination is coherent (origin: ${ACAO:-<allowlist>})"
    PASS_COUNT=$((PASS_COUNT + 1))
fi

# ---------------------------------------------------------------------------
echo
echo "[2] PUBLIC endpoints need no credentials"
# ---------------------------------------------------------------------------
STATUS=$(post GET_EVENT_BY_ID '{"eventId":"does-not-exist"}')
expect_not "GET_EVENT_BY_ID without credentials is not rejected as unauthenticated" 401 "$STATUS"

# ---------------------------------------------------------------------------
echo
echo "[3] AUTHENTICATED endpoints reject bad credentials"
# ---------------------------------------------------------------------------
STATUS=$(post GET_ORDERS_BY_EVENT '{"eventId":"any"}')
expect "GET_ORDERS_BY_EVENT with no Authorization header" 401 "$STATUS"

STATUS=$(post GET_ORDERS_BY_EVENT '{"eventId":"any"}' -H 'Authorization: Bearer not-a-real-token')
expect "GET_ORDERS_BY_EVENT with a garbage bearer token" 401 "$STATUS"

STATUS=$(post GET_ORDERS_BY_EVENT '{"eventId":"any"}' -H 'Authorization: Basic dXNlcjpwYXNz')
expect "GET_ORDERS_BY_EVENT with a non-Bearer scheme" 401 "$STATUS"

STATUS=$(post BOOKING_APPROVAL \
    '{"eventId":"any","organiserId":"any","orderId":"any","bookingApprovalOperation":"APPROVE"}')
expect "BOOKING_APPROVAL with no Authorization header" 401 "$STATUS"

STATUS=$(post CREATE_EVENT '{"organiserId":"someone-else"}')
expect "CREATE_EVENT with no Authorization header" 401 "$STATUS"

STATUS=$(post GET_SPORTSHUB_WRAPPED '{"organiserId":"someone-else","year":2025}')
expect "GET_SPORTSHUB_WRAPPED with no Authorization header" 401 "$STATUS"

# ---------------------------------------------------------------------------
echo
echo "[4] SESSION endpoints reject a missing or wrong secret"
# ---------------------------------------------------------------------------
STATUS=$(post GET_FULFILMENT_SESSION_INFO '{"fulfilmentSessionId":"any","currentFulfilmentEntityId":null}')
expect "GET_FULFILMENT_SESSION_INFO with no X-Session-Secret" 401 "$STATUS"

STATUS=$(post GET_FULFILMENT_SESSION_INFO '{"fulfilmentSessionId":"any","currentFulfilmentEntityId":null}' \
    -H 'X-Session-Secret:  ')
expect "GET_FULFILMENT_SESSION_INFO with a blank X-Session-Secret" 401 "$STATUS"

# The secret must not be accepted from a cookie: the browser calls this function
# cross-site, so a SameSite=Lax cookie is never sent.
STATUS=$(post GET_FULFILMENT_SESSION_INFO '{"fulfilmentSessionId":"any","currentFulfilmentEntityId":null}' \
    -H 'Cookie: fulfilmentSessionSecret=some-secret')
expect "GET_FULFILMENT_SESSION_INFO with the secret only in a cookie" 401 "$STATUS"

# ---------------------------------------------------------------------------
echo
echo "[5] Fulfilment session happy path + tampered secret"
# ---------------------------------------------------------------------------
if [ -z "$EVENT_ID" ]; then
    echo "  SKIP  pass a real eventId as the second argument to run these"
else
    STATUS=$(post INIT_FULFILMENT_SESSION "{\"eventId\":\"${EVENT_ID}\",\"numTickets\":1}")
    expect "INIT_FULFILMENT_SESSION (public) succeeds" 200 "$STATUS"

    SESSION_ID=$(jq -r '.data.fulfilmentSessionId // empty' /tmp/gac_body.$$ 2>/dev/null)
    SESSION_SECRET=$(jq -r '.data.fulfilmentSessionSecret // empty' /tmp/gac_body.$$ 2>/dev/null)

    if [ -z "$SESSION_SECRET" ]; then
        echo "  $(red FAIL)  response did not include a fulfilmentSessionSecret"
        FAIL_COUNT=$((FAIL_COUNT + 1))
    else
        echo "  $(green PASS)  response included a fulfilmentSessionSecret"
        PASS_COUNT=$((PASS_COUNT + 1))

        STATUS=$(post GET_FULFILMENT_SESSION_INFO \
            "{\"fulfilmentSessionId\":\"${SESSION_ID}\",\"currentFulfilmentEntityId\":null}" \
            -H "X-Session-Secret: ${SESSION_SECRET}")
        expect "GET_FULFILMENT_SESSION_INFO with the correct secret" 200 "$STATUS"

        # HTTP/2 lowercases header names; make sure that still authenticates.
        STATUS=$(post GET_FULFILMENT_SESSION_INFO \
            "{\"fulfilmentSessionId\":\"${SESSION_ID}\",\"currentFulfilmentEntityId\":null}" \
            -H "x-session-secret: ${SESSION_SECRET}")
        expect "GET_FULFILMENT_SESSION_INFO with a lowercase header name" 200 "$STATUS"

        STATUS=$(post GET_FULFILMENT_SESSION_INFO \
            "{\"fulfilmentSessionId\":\"${SESSION_ID}\",\"currentFulfilmentEntityId\":null}" \
            -H "X-Session-Secret: ${SESSION_SECRET}-tampered")
        expect "GET_FULFILMENT_SESSION_INFO with a tampered secret" 401 "$STATUS"

        # Another user's session id with our own secret must not grant access.
        STATUS=$(post INIT_FULFILMENT_SESSION "{\"eventId\":\"${EVENT_ID}\",\"numTickets\":1}")
        OTHER_SESSION_ID=$(jq -r '.data.fulfilmentSessionId // empty' /tmp/gac_body.$$ 2>/dev/null)
        if [ -n "$OTHER_SESSION_ID" ] && [ "$OTHER_SESSION_ID" != "$SESSION_ID" ]; then
            STATUS=$(post GET_FULFILMENT_SESSION_INFO \
                "{\"fulfilmentSessionId\":\"${OTHER_SESSION_ID}\",\"currentFulfilmentEntityId\":null}" \
                -H "X-Session-Secret: ${SESSION_SECRET}")
            expect "reading another session with our own secret" 401 "$STATUS"
        fi
    fi
fi

# ---------------------------------------------------------------------------
echo
echo "[6] Authenticated caller"
# ---------------------------------------------------------------------------
if [ -z "${ID_TOKEN:-}" ] && [ -n "${FIREBASE_API_KEY:-}" ] && [ -n "${TEST_EMAIL:-}" ]; then
    echo "  Signing in as $TEST_EMAIL ..."
    ID_TOKEN=$(curl -s "https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}" \
        -H 'Content-Type: application/json' \
        -d "{\"email\":\"${TEST_EMAIL}\",\"password\":\"${TEST_PASSWORD:-}\",\"returnSecureToken\":true}" \
        | jq -r '.idToken // empty')
fi

if [ -z "${ID_TOKEN:-}" ]; then
    echo "  SKIP  set ID_TOKEN (or FIREBASE_API_KEY + TEST_EMAIL + TEST_PASSWORD) to run these"
else
    AUTH_HEADER="Authorization: Bearer ${ID_TOKEN}"

    STATUS=$(post GET_ORDERS_BY_EVENT '{"eventId":"definitely-not-a-real-event"}' -H "$AUTH_HEADER")
    expect_not "a valid token is accepted by the auth layer" 401 "$STATUS"

    # Ownership is enforced separately from authentication: a real token must not
    # grant access to another organiser's event.
    if [ -n "${OTHER_EVENT_ID:-}" ]; then
        STATUS=$(post GET_ORDERS_BY_EVENT "{\"eventId\":\"${OTHER_EVENT_ID}\"}" -H "$AUTH_HEADER")
        expect "GET_ORDERS_BY_EVENT on another organiser's event" 403 "$STATUS"

        STATUS=$(post BOOKING_APPROVAL \
            "{\"eventId\":\"${OTHER_EVENT_ID}\",\"organiserId\":\"any\",\"orderId\":\"any\",\"bookingApprovalOperation\":\"APPROVE\"}" \
            -H "$AUTH_HEADER")
        expect "BOOKING_APPROVAL on another organiser's event" 403 "$STATUS"
    else
        echo "  SKIP  set OTHER_EVENT_ID to test cross-organiser access denial"
    fi

    STATUS=$(post GET_SPORTSHUB_WRAPPED '{"organiserId":"some-other-organiser","year":2025}' -H "$AUTH_HEADER")
    expect "GET_SPORTSHUB_WRAPPED for another organiser" 403 "$STATUS"
fi

rm -f /tmp/gac_body.$$

echo
echo "-----------------------------------------"
echo "  passed: $PASS_COUNT   failed: $FAIL_COUNT"
echo "-----------------------------------------"
[ "$FAIL_COUNT" -eq 0 ] || exit 1
