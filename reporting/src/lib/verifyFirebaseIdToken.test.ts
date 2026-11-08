import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { importPKCS8, SignJWT } from "jose";
import { ALLOWED_REPORTING_UID } from "./allowedUser";
import { FirebaseTokenError, ReportingAccessError, verifyReportingIdToken } from "./verifyFirebaseIdToken";

const projectId = "sportshub-test";
const kid = "reporting-test-key";

function makeCertificate() {
  const directory = mkdtempSync(join(tmpdir(), "reporting-cert-"));
  const keyPath = join(directory, "key.pem");
  const certPath = join(directory, "cert.pem");
  execFileSync(
    "openssl",
    [
      "req",
      "-x509",
      "-newkey",
      "rsa:2048",
      "-keyout",
      keyPath,
      "-out",
      certPath,
      "-days",
      "1",
      "-nodes",
      "-subj",
      "/CN=reporting-test",
    ],
    { stdio: "ignore" }
  );
  const key = readFileSync(keyPath, "utf8");
  const cert = readFileSync(certPath, "utf8");
  rmSync(directory, { recursive: true, force: true });
  return { key, cert };
}

const certificate = makeCertificate();

async function signToken(uid: string, audience = projectId, expiresInSeconds = 60 * 10) {
  const key = await importPKCS8(certificate.key, "RS256");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({
    user_id: uid,
    email: "owner@sportshub.net.au",
    auth_time: now,
  })
    .setProtectedHeader({ alg: "RS256", kid })
    .setSubject(uid)
    .setIssuer(`https://securetoken.google.com/${projectId}`)
    .setAudience(audience)
    .setIssuedAt(now)
    .setExpirationTime(now + expiresInSeconds)
    .sign(key);
}

function loadCerts() {
  return Promise.resolve({ [kid]: certificate.cert });
}

test("accepts a token for the allowed reporting user", async () => {
  const token = await signToken(ALLOWED_REPORTING_UID);
  const payload = await verifyReportingIdToken(token, projectId, loadCerts);
  assert.equal(payload.sub, ALLOWED_REPORTING_UID);
  assert.equal(payload.email, "owner@sportshub.net.au");
});

test("rejects every other Firebase user", async () => {
  const token = await signToken("another-firebase-user");
  await assert.rejects(verifyReportingIdToken(token, projectId, loadCerts), ReportingAccessError);
});

test("rejects a token for a different Firebase project", async () => {
  const token = await signToken(ALLOWED_REPORTING_UID, "other-project");
  await assert.rejects(verifyReportingIdToken(token, projectId, loadCerts), FirebaseTokenError);
});

test("rejects an expired token", async () => {
  const token = await signToken(ALLOWED_REPORTING_UID, projectId, -60);
  await assert.rejects(verifyReportingIdToken(token, projectId, loadCerts), FirebaseTokenError);
});
