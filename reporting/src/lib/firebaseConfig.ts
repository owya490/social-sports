export class FirebaseConfigError extends Error {
  constructor() {
    super("Firebase is not configured.");
    this.name = "FirebaseConfigError";
  }
}

export type FirebaseClientConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
};

function configuredValue(value: string | undefined): string | undefined {
  return value && value.length > 0 ? value : undefined;
}

function configFrom(
  apiKey: string | undefined,
  authDomain: string | undefined,
  projectId: string | undefined,
  appId: string | undefined
): FirebaseClientConfig {
  const apiKeyValue = configuredValue(apiKey);
  const authDomainValue = configuredValue(authDomain);
  const projectIdValue = configuredValue(projectId);
  const appIdValue = configuredValue(appId);
  if (!apiKeyValue || !authDomainValue || !projectIdValue || !appIdValue) {
    throw new FirebaseConfigError();
  }
  return {
    apiKey: apiKeyValue,
    authDomain: authDomainValue,
    projectId: projectIdValue,
    appId: appIdValue,
  };
}

/** Development and preview sign in to the dev Firebase project. Production stays on prod. */
function usesDevelopmentFirebase(): boolean {
  const environment = process.env.NEXT_PUBLIC_ENVIRONMENT ?? process.env.ENVIRONMENT;
  return environment === "DEVELOPMENT" || environment === "PREVIEW";
}

export function getFirebaseClientConfig(): FirebaseClientConfig {
  if (usesDevelopmentFirebase()) {
    return configFrom(
      process.env.FIREBASE_DEV_API_KEY,
      process.env.FIREBASE_DEV_AUTH_DOMAIN,
      process.env.FIREBASE_DEV_PROJECT_ID,
      process.env.FIREBASE_DEV_APP_ID
    );
  }
  return configFrom(
    process.env.FIREBASE_PROD_API_KEY,
    process.env.FIREBASE_PROD_AUTH_DOMAIN,
    process.env.FIREBASE_PROD_PROJECT_ID,
    process.env.FIREBASE_PROD_APP_ID
  );
}

export function getFirebaseProjectId(): string {
  return getFirebaseClientConfig().projectId;
}
