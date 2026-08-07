import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAfdRR_EGM2t9sr9o9LANIVbGWVkQGol3g",
  authDomain: "bluelinebusan.firebaseapp.com",
  projectId: "bluelinebusan",
  storageBucket: "bluelinebusan.firebasestorage.app",
  messagingSenderId: "73929017372",
  appId: "1:73929017372:web:36a84b809c06b7411637d9",
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
