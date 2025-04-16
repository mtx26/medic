// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBRHGXq1g7JOXkfWWcI2f7lUPA4AcGhzOA",
  authDomain: "sportmetrics-ea5ef.firebaseapp.com",
  projectId: "sportmetrics-ea5ef",
  storageBucket: "sportmetrics-ea5ef.firebasestorage.app",
  messagingSenderId: "421357672292",
  appId: "1:421357672292:web:579bd18b621708dd314c71",
  measurementId: "G-C7HVSPZJTM"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore();

export { auth, db };