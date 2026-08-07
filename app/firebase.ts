import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAIaO0LIVhvSyz0s7MQVIKsE8Bx_qwgCFg",
  authDomain: "blue-line-busan.firebaseapp.com",
  projectId: "blue-line-busan",
  storageBucket: "blue-line-busan.firebasestorage.app",
  messagingSenderId: "234503136010",
  appId: "1:234503136010:web:d4d708d54f7a842f31d0f3",
};

export const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);
