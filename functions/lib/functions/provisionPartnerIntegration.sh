#!/bin/bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"
mkdir -p ../../../.tmp
BUILD_LOG=../../../.tmp/partner-provision-build.log

if ! mvn -q -DskipTests compile dependency:build-classpath \
    -DincludeScope=runtime -Dmdep.outputFile=target/partner-provision-classpath.txt 2>&1 | tee "$BUILD_LOG" >/dev/null; then
    echo "Java build failed. See $SCRIPT_DIR/$BUILD_LOG" >&2
    exit 1
fi

PARTNER_CLASSPATH=$(cat target/partner-provision-classpath.txt)
JAVA_BIN="${JAVA_HOME:+$JAVA_HOME/bin/}java"
exec "$JAVA_BIN" -cp "target/classes:$PARTNER_CLASSPATH" \
    com.functions.partners.tools.ProvisionPartnerIntegration "$@"
