import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

// 🔐 Configuration Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDJzyhnHPkWVYzw38CuLBvj0d9syMTf6uw",
  authDomain: "medic-mamy.firebaseapp.com",
  projectId: "medic-mamy",
  storageBucket: "medic-mamy.firebasestorage.app",
  messagingSenderId: "90914528083",
  appId: "1:90914528083:web:84e9a65d36da88b359dfa6",
  measurementId: "G-4119MN124T",
};

// 🚀 Initialisation
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// ✅ Promesse exportée pour éviter `let` mutable
const analyticsPromise = isSupported().then((yes) =>
  yes ? getAnalytics(app) : null
);

// 📤 Exportation
export { auth, db, analyticsPromise };
