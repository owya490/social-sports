// Import the functions you need from the SDKs you need
import firebase from "firebase/app";
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDTKH5BMYNnySRdHkI6iYwyvq1I_MStkCs",
  authDomain: "socialsports-44162.firebaseapp.com",
  databaseURL: "https://socialsports-44162-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "socialsports-44162",
  storageBucket: "socialsports-44162.appspot.com",
  messagingSenderId: "699959202911",
  appId: "1:699959202911:web:e35bca99c1cce533f2b7ea",
  measurementId: "G-9GBMNWHV49"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const storage = getStorage(app);