// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDJzyhnHPkWVYzw38CuLBvj0d9syMTf6uw",
  authDomain: "medic-mamy.firebaseapp.com",
  projectId: "medic-mamy",
  storageBucket: "medic-mamy.firebasestorage.app",
  messagingSenderId: "90914528083",
  appId: "1:90914528083:web:84e9a65d36da88b359dfa6",
  measurementId: "G-4119MN124T"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore();

const analytics = (await isSupported()) ? getAnalytics(app) : null;

export { auth, db, analytics };