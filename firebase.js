import { initializeApp } from "firebase/app";

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

const app = initializeApp(firebaseConfig);

export default app;
