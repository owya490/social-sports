/**
 * 🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨
 * IMPORTANT - PLEASE READ DOCUMENTATION AT THE TOP OF .github/workflows/sportshub_cloud_functions_deploy_ci.yml
 * BEFORE ADDING, DELETING OR MODIFYING ENV VARIABLES!
 *
 * RUN THIS FILE EVERYTIME YOU WANT TO UPDATE GITHUB SECRETS AFTER CHANGING
 * ENVIRONMENT VARARIABLE FILE.
 *
 * NOT FOLLOWING THOSE STEPS MAY RESULT IN BROKEN DEPLOYMENTS!
 * 🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨
 */

import dotenv from "dotenv";
import { Octokit } from "octokit";
import _sodium from "libsodium-wrappers";

dotenv.config({ path: "../../frontend/.env" });

const GITHUB_AUTH_TOKEN = process.env.GITHUB_AUTH_TOKEN;

const SOCIAL_SPORTS_REPO_OWNER = "owya490";
const SOCIAL_SPORTS_REPO_NAME = "social-sports";

const octokit = new Octokit({
  auth: GITHUB_AUTH_TOKEN,
});

/// first, get a repository public key for encryption
const publicKeyResponse = await octokit.request(
  `GET /repos/${SOCIAL_SPORTS_REPO_OWNER}/${SOCIAL_SPORTS_REPO_NAME}/actions/secrets/public-key`,
  {
    owner: SOCIAL_SPORTS_REPO_OWNER,
    repo: SOCIAL_SPORTS_REPO_NAME,
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
  }
);
const encryptionKeyId = publicKeyResponse["data"]["key_id"];
const encryptionKey = publicKeyResponse["data"]["key"];

// TODO: add more secrets to this envVariableList array as needed.
const envVariableListDev = [
  {
    secretName: "FIREBASE_DEV_API_KEY",
    secretValue: process.env.FIREBASE_DEV_API_KEY,
  },
  {
    secretName: "FIREBASE_DEV_AUTH_DOMAIN",
    secretValue: process.env.FIREBASE_DEV_AUTH_DOMAIN,
  },
  {
    secretName: "FIREBASE_DEV_DATABASE_URL",
    secretValue: process.env.FIREBASE_DEV_DATABASE_URL,
  },
  {
    secretName: "FIREBASE_DEV_PROJECT_ID",
    secretValue: process.env.FIREBASE_DEV_PROJECT_ID,
  },
  {
    secretName: "FIREBASE_DEV_STORAGE_BUCKET",
    secretValue: process.env.FIREBASE_DEV_STORAGE_BUCKET,
  },
  {
    secretName: "FIREBASE_DEV_MESSAGING_SENDER_ID",
    secretValue: process.env.FIREBASE_DEV_MESSAGING_SENDER_ID,
  },
  {
    secretName: "FIREBASE_DEV_APP_ID",
    secretValue: process.env.FIREBASE_DEV_APP_ID,
  },
  {
    secretName: "FIREBASE_DEV_MEASUREMENT_ID",
    secretValue: process.env.FIREBASE_DEV_MEASUREMENT_ID,
  },
  // SOCIALSPORTSPROD Github secrets env variables
  {
    secretName: "SOCIALSPORTSPROD_GCLOUD_CREDENTIALS",
    secretValue: process.env.SOCIALSPORTSPROD_GCLOUD_CREDENTIALS,
  },
  {
    secretName: "SOCIALSPORTSPROD_FUNCTIONS_KEY_JSON_BASE64_ENCODED",
    secretValue: process.env.SOCIALSPORTSPROD_FUNCTIONS_KEY_JSON_BASE64_ENCODED,
  },
  {
    secretName: "SOCIALSPORTSPROD_STRIPE_API_KEY",
    secretValue: process.env.SOCIALSPORTSPROD_STRIPE_API_KEY,
  },
  {
    secretName: "SOCIALSPORTSPROD_STRIPE_WEBHOOK_ENDPOINT_SECRET",
    secretValue: process.env.SOCIALSPORTSPROD_STRIPE_WEBHOOK_ENDPOINT_SECRET,
  },
  {
    secretName: "SOCIALSPORTSPROD_POSTHOG_API_KEY",
    secretValue: process.env.SOCIALSPORTSPROD_POSTHOG_API_KEY,
  },
  {
    secretName: "SOCIALSPORTSPROD_BEARER_TOKEN",
    secretValue: process.env.SOCIALSPORTSPROD_BEARER_TOKEN,
  },
  {
    secretName: "SOCIALSPORTSPROD_SENDGRID_API_KEY",
    secretValue: process.env.SOCIALSPORTSPROD_SENDGRID_API_KEY,
  },
  {
    secretName: "SOCIALSPORTSPROD_LOOPS_API_KEY",
    secretValue: process.env.SOCIALSPORTSPROD_LOOPS_API_KEY,
  },
  // SOCIALSPORTSDEV Github secrets env variables
  {
    secretName: "SOCIALSPORTSDEV_GCLOUD_CREDENTIALS",
    secretValue: process.env.SOCIALSPORTSDEV_GCLOUD_CREDENTIALS,
  },
  {
    secretName: "SOCIALSPORTSDEV_FUNCTIONS_KEY_JSON_BASE64_ENCODED",
    secretValue: process.env.SOCIALSPORTSDEV_FUNCTIONS_KEY_JSON_BASE64_ENCODED,
  },
  {
    secretName: "SOCIALSPORTSDEV_STRIPE_API_KEY",
    secretValue: process.env.SOCIALSPORTSDEV_STRIPE_API_KEY,
  },
  {
    secretName: "SOCIALSPORTSDEV_STRIPE_WEBHOOK_ENDPOINT_SECRET",
    secretValue: process.env.SOCIALSPORTSDEV_STRIPE_WEBHOOK_ENDPOINT_SECRET,
  },
  {
    secretName: "SOCIALSPORTSDEV_POSTHOG_API_KEY",
    secretValue: process.env.SOCIALSPORTSDEV_POSTHOG_API_KEY,
  },
  {
    secretName: "SOCIALSPORTSDEV_BEARER_TOKEN",
    secretValue: process.env.SOCIALSPORTSDEV_BEARER_TOKEN,
  },
  {
    secretName: "SOCIALSPORTSDEV_SENDGRID_API_KEY",
    secretValue: process.env.SOCIALSPORTSDEV_SENDGRID_API_KEY,
  },
  {
    secretName: "SOCIALSPORTSDEV_LOOPS_API_KEY",
    secretValue: process.env.SOCIALSPORTSDEV_LOOPS_API_KEY,
  },
  // TODO: add more secrets you want to push to github secrets here.
];

for (const { secretName, secretValue } of envVariableListDev) {
  await createUpdateRepositorySecret(secretName, secretValue);
}

////////////////////////////////////////////////////////////////////////////////
// HELPER FUNCTIONS //
////////////////////////////////////////////////////////////////////////////////

/**
 * Function which calls Github RestAPI to create/update
 * repository GitHub secret.
 *
 * Takes in the secret name and secret value.
 *
 * @param {string} firebaseKeySecretName
 * @param {string} firebaseKeyEncryptedValue
 */
async function createUpdateRepositorySecret(firebaseKeySecretName, firebaseKeyValue) {
  const firebaseKeyEncryptedValue = await _encryptKeyLibSodium(firebaseKeyValue, encryptionKey);
  await octokit.request(
    `PUT /repos/${SOCIAL_SPORTS_REPO_OWNER}/${SOCIAL_SPORTS_REPO_NAME}/actions/secrets/${firebaseKeySecretName}`,
    {
      owner: SOCIAL_SPORTS_REPO_OWNER,
      repo: SOCIAL_SPORTS_REPO_NAME,
      secret_name: firebaseKeySecretName,
      encrypted_value: firebaseKeyEncryptedValue,
      key_id: encryptionKeyId,
      headers: {
        "X-GitHub-Api-Version": "2022-11-28",
      },
    }
  );
}

/**
 * Encrypts specified secret with given key
 * https://docs.github.com/en/rest/guides/encrypting-secrets-for-the-rest-api?apiVersion=2022-11-28#example-encrypting-a-secret-using-nodejs
 *
 * @param {string} secret
 * @param {string} key
 */
async function _encryptKeyLibSodium(secret, key) {
  //Check if libsodium is ready and then proceed.
  const sodium = _sodium;
  const output = await sodium.ready.then(() => {
    // Convert the secret and key to a Uint8Array.
    let binkey = sodium.from_base64(key, sodium.base64_variants.ORIGINAL);
    let binsec = sodium.from_string(secret);

    // Encrypt the secret using libsodium
    let encBytes = sodium.crypto_box_seal(binsec, binkey);

    // Convert the encrypted Uint8Array to Base64
    let output = sodium.to_base64(encBytes, sodium.base64_variants.ORIGINAL);

    // Print the output
    return output;
  });

  return output;
}

/**
 * For sanity checking if a GitHub secret exists for the repository.
 *
 * @param {string} secretName - The name of the secret to check.
 * @returns {boolean} - True if the secret exists, false otherwise.
 */
async function doesSecretExist(secretName) {
  try {
    const response = await octokit.request(
      `GET /repos/${SOCIAL_SPORTS_REPO_OWNER}/${SOCIAL_SPORTS_REPO_NAME}/actions/secrets`,
      {
        owner: SOCIAL_SPORTS_REPO_OWNER,
        repo: SOCIAL_SPORTS_REPO_NAME,
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    const secrets = response.data.secrets || [];
    return secrets.some((secret) => secret.name === secretName);
  } catch (error) {
    console.error(`Error checking secret existence: ${error.message}`);
    return false;
  }
}
