import { Environment } from "../../utilities/environment";

export type FirebaseConfig = {
  apiKey: string | undefined;
  authDomain: string | undefined;
  databaseURL: string | undefined;
  projectId: string | undefined;
  storageBucket: string | undefined;
  messagingSenderId: string | undefined;
  appId: string | undefined;
  measurementId: string | undefined;
};

export const firebaseConfigDev: FirebaseConfig = {
  apiKey: process.env.FIREBASE_DEV_API_KEY,
  authDomain: process.env.FIREBASE_DEV_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DEV_DATABASE_URL,
  projectId: process.env.FIREBASE_DEV_PROJECT_ID,
  storageBucket: process.env.FIREBASE_DEV_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_DEV_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_DEV_APP_ID,
  measurementId: process.env.FIREBASE_DEV_MEASUREMENT_ID,
};

export const firebaseConfigProd: FirebaseConfig = {
  apiKey: process.env.FIREBASE_PROD_API_KEY,
  authDomain: process.env.FIREBASE_PROD_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_PROD_DATABASE_URL,
  projectId: process.env.FIREBASE_PROD_PROJECT_ID,
  storageBucket: process.env.FIREBASE_PROD_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_PROD_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_PROD_APP_ID,
  measurementId: process.env.FIREBASE_PROD_MEASUREMENT_ID,
};

export function getFirebaseConfigForEnvironment(environment: Environment | undefined): FirebaseConfig {
  switch (environment) {
    case Environment.DEVELOPMENT:
    case Environment.PREVIEW: {
      return firebaseConfigDev;
    }
    case Environment.PRODUCTION: {
      return firebaseConfigProd;
    }
    default: {
      throw new Error(
        "Unknown environment for Firebase config. Set NEXT_PUBLIC_ENVIRONMENT to DEVELOPMENT, PREVIEW, or PRODUCTION."
      );
    }
  }
}
