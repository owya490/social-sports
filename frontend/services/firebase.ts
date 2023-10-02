// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
require("dotenv").config();

console.log(typeof process.env.FIREBASE_DEV_API_KEY);

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDTKH5BMYNnySRdHkI6iYwyvq1I_MStkCs",
  authDomain: "socialsports-44162.firebaseapp.com",
  databaseURL:
    "https://socialsports-44162-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "socialsports-44162",
  storageBucket: "socialsports-44162.appspot.com",
  messagingSenderId: "699959202911",
  appId: "1:699959202911:web:e35bca99c1cce533f2b7ea",
  measurementId: "G-9GBMNWHV49",
};

// const firebaseConfig = {
//   apiKey: process.env.FIREBASE_DEV_API_KEY,
//   authDomain: process.env.FIREBASE_DEV_AUTH_DOMAIN,
//   databaseURL: process.env.FIREBASE_DEV_DATABASE_URL,
//   projectId: process.env.FIREBASE_DEV_PROJECT_ID,
//   storageBucket: process.env.FIREBASE_DEV_STORAGE_BUCKET,
//   messagingSenderId: process.env.FIREBASE_DEV_MESSAGING_SENDER_ID,
//   appId: process.env.FIREBASE_DEV_APP_ID,
//   measurementId: process.env.FIREBASE_DEV_MEASUREMENT_ID,
// };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// const analytics = getAnalytics(app);
export const db = getFirestore(app);
