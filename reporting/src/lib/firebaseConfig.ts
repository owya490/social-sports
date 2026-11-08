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

export function getFirebaseClientConfig(): FirebaseClientConfig {
  const apiKey = process.env.FIREBASE_PROD_API_KEY;
  const authDomain = process.env.FIREBASE_PROD_AUTH_DOMAIN;
  const projectId = process.env.FIREBASE_PROD_PROJECT_ID;
  const appId = process.env.FIREBASE_PROD_APP_ID;
  if (!apiKey || !authDomain || !projectId || !appId) {
    throw new FirebaseConfigError();
  }
  return { apiKey, authDomain, projectId, appId };
}

export function getFirebaseProjectId(): string {
  return getFirebaseClientConfig().projectId;
}
