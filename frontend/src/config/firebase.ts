import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyC_T_YoLCCdN5BSGQJSGAIZBNbbk8CxPPw",
  authDomain: "chessmn-de373.firebaseapp.com",
  projectId: "chessmn-de373",
  storageBucket: "chessmn-de373.firebasestorage.app",
  messagingSenderId: "262841945863",
  appId: "1:262841945863:web:c4eb5e7d3ae40cdcedbfa2",
  measurementId: "G-SN0WCJQCCY"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
