// Import the functions you need from the SDKs you need
import firebase from "firebase/app";
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { getStorage } from "firebase/storage";
require("dotenv").config();

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfigDev = {
  apiKey: process.env.FIREBASE_DEV_API_KEY,
  authDomain: process.env.FIREBASE_DEV_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_DEV_DATABASE_URL,
  projectId: process.env.FIREBASE_DEV_PROJECT_ID,
  storageBucket: process.env.FIREBASE_DEV_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_DEV_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_DEV_APP_ID,
  measurementId: process.env.FIREBASE_DEV_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfigDev);
// const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// set persistence to local storage
setPersistence(auth, browserLocalPersistence);

// Handle changes in user logged in status
let authUser: User | null = null;
onAuthStateChanged(auth, (currUser) => {
  authUser = currUser;
});

export { authUser };
