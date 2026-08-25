// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { browserLocalPersistence, getAuth, setPersistence } from "firebase/auth";
import { FirestoreSettings, getFirestore, initializeFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getEnvironment } from "../../utilities/environment";
import { getFirebaseConfigForEnvironment } from "./firebaseConfig";
import { getFirestoreSettingsForCurrentBrowser } from "./firebase/firestoreWebKitTransport";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

const firebaseConfig = getFirebaseConfigForEnvironment(getEnvironment());

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
const webKitFirestoreSettings = getFirestoreSettingsForCurrentBrowser();
export const db = webKitFirestoreSettings
  ? initializeFirestore(app, webKitFirestoreSettings as FirestoreSettings)
  : getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// set persistence to a session - meaning if user closes the window, they will be logged out.
// TODO: change back to browserLocalPersistence after we implement session infrastructure.
setPersistence(auth, browserLocalPersistence);
