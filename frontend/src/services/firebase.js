import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { log } from "../utils/logger";

// 🔐 Configuration Firebase
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// 🚀 Initialisation
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const messaging = getMessaging(app);

// 🔔 Récupérer le token de notifications
export const requestPermissionAndGetToken = async (uid) => {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Permission refusée");

    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FCM_SERVER_KEY,
    });

    log.info("[FCM] Token reçu :", {
      uid: uid,
      token: token,
      origin: "FCM_TOKEN_RECEIVED",
    });
    return token;
  } catch (err) {
    log.error("[FCM] Erreur permission ou token", {
      uid: uid,
      token: token,
      origin: "FCM_TOKEN_ERROR",
      error: err,
    });
    return null;
  }
};

const analyticsPromise = isSupported().then((yes) =>
  yes ? getAnalytics(app) : null
);

// 📤 Exportation
export { db, analyticsPromise, messaging, onMessage };
