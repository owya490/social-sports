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
import { getEnvironment, Environment } from "../utilities/environment";
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

const firebaseConfigProd = {
  apiKey: process.env.FIREBASE_PROD_API_KEY,
  authDomain: process.env.FIREBASE_PROD_AUTH_DOMAIN,
  databaseURL: process.env.FIREBASE_PROD_DATABASE_URL,
  projectId: process.env.FIREBASE_PROD_PROJECT_ID,
  storageBucket: process.env.FIREBASE_PROD_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_PROD_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_PROD_APP_ID,
  measurementId: process.env.FIREBASE_PROD_MEASUREMENT_ID,
};

// Obtain from .env file which environment we are currently in
let firebaseConfig = firebaseConfigDev;
switch (getEnvironment()) {
  case Environment.PREVIEW || Environment.DEVELOPMENT: {
    firebaseConfig = firebaseConfigDev;
    break;
  }
  case Environment.PRODUCTION: {
    firebaseConfig = firebaseConfigProd;
    break;
  }
  default: {
  }
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);
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
