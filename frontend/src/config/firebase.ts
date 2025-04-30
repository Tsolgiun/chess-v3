import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// Import App Check (optional but recommended for additional security)
// import { initializeAppCheck, ReCaptchaV3Provider } from "firebase/app-check";

// Your web app's Firebase configuration
// Using environment variables for security
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Optional: Initialize Firebase App Check for additional security
// Uncomment the following lines and replace 'YOUR_RECAPTCHA_SITE_KEY' with your actual reCAPTCHA site key
// const appCheck = initializeAppCheck(app, {
//   provider: new ReCaptchaV3Provider('YOUR_RECAPTCHA_SITE_KEY'),
//   isTokenAutoRefreshEnabled: true
// });

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
