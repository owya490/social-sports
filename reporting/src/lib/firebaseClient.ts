import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirebaseClientConfig } from "./firebaseConfig";

export function getClientAuth() {
  const app = getApps().length > 0 ? getApp() : initializeApp(getFirebaseClientConfig());
  return getAuth(app);
}
