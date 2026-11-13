import assert from "node:assert/strict";
import { test } from "node:test";
import { FirebaseConfigError, getFirebaseClientConfig } from "./firebaseConfig";

const ENV_KEYS = [
  "ENVIRONMENT",
  "NEXT_PUBLIC_ENVIRONMENT",
  "FIREBASE_DEV_API_KEY",
  "FIREBASE_DEV_AUTH_DOMAIN",
  "FIREBASE_DEV_PROJECT_ID",
  "FIREBASE_DEV_APP_ID",
  "FIREBASE_PROD_API_KEY",
  "FIREBASE_PROD_AUTH_DOMAIN",
  "FIREBASE_PROD_PROJECT_ID",
  "FIREBASE_PROD_APP_ID",
] as const;

function withEnv(values: Record<string, string | undefined>, run: () => void): void {
  const previous = new Map<string, string | undefined>();
  for (const key of ENV_KEYS) {
    previous.set(key, process.env[key]);
    delete process.env[key];
  }
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined) {
      process.env[key] = value;
    }
  }
  try {
    run();
  } finally {
    for (const [key, value] of previous) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

const devConfig = {
  FIREBASE_DEV_API_KEY: "dev-key",
  FIREBASE_DEV_AUTH_DOMAIN: "socialsports-44162.firebaseapp.com",
  FIREBASE_DEV_PROJECT_ID: "socialsports-44162",
  FIREBASE_DEV_APP_ID: "dev-app",
};

const prodConfig = {
  FIREBASE_PROD_API_KEY: "prod-key",
  FIREBASE_PROD_AUTH_DOMAIN: "socialsportsprod.firebaseapp.com",
  FIREBASE_PROD_PROJECT_ID: "socialsportsprod",
  FIREBASE_PROD_APP_ID: "prod-app",
};

test("development and preview use the dev Firebase project", () => {
  for (const environment of ["DEVELOPMENT", "PREVIEW"]) {
    withEnv({ ENVIRONMENT: environment, ...devConfig, ...prodConfig }, () => {
      assert.equal(getFirebaseClientConfig().projectId, "socialsports-44162");
    });
  }
});

test("production and an unset environment use the prod Firebase project", () => {
  withEnv({ ENVIRONMENT: "PRODUCTION", ...devConfig, ...prodConfig }, () => {
    assert.equal(getFirebaseClientConfig().projectId, "socialsportsprod");
  });
  withEnv({ ...devConfig, ...prodConfig }, () => {
    assert.equal(getFirebaseClientConfig().projectId, "socialsportsprod");
  });
});

test("fails closed when the selected Firebase project is not configured", () => {
  withEnv({ ENVIRONMENT: "DEVELOPMENT" }, () => {
    assert.throws(getFirebaseClientConfig, FirebaseConfigError);
  });
});
