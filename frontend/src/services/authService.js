import { auth, db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getGlobalReloadUser } from "../contexts/UserContext";
import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { log } from "../utils/logger";

const GoogleProvider = new GoogleAuthProvider();




/**
 * Connexion avec Google
 */
export const GoogleHandleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, GoogleProvider);
    const user = result.user;

    // Vérifier si l'utilisateur est déjà dans Firestore
    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      await setDoc(userRef, {
        displayName: user.displayName || "Utilisateur",
        photoURL: user.photoURL || "",
        role: "user",
        email: user.email
      });

    }

    getGlobalReloadUser()(); // ✅ Rafraîchir les infos utilisateur
    log.info("Utilisateur connecté avec Google :", user.uid);

  } catch (error) {
    log.error("Erreur de connexion avec Google :", error.message);
  }
};

/**
 * Inscription avec email et mot de passe
 */
export const registerWithEmail = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(doc(db, "users", user.uid), {
      displayName: name,
      photoURL: "",
      role: "user",
      email: user.email
    });

    getGlobalReloadUser()(); // ✅ Rafraîchir les infos utilisateur
    loginWithEmail(email, password); // ✅ Connexion après inscription

    log.info("Utilisateur inscrit et ajouté à Firestore :", user.uid);
  } catch (error) {
    log.error("Erreur d'inscription :", error.message);
  }
};

/**
 * Connexion avec email et mot de passe
 */
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    getGlobalReloadUser()(); // ✅ Rafraîchir les infos utilisateur

    log.info("Utilisateur connecté :", userCredential.user.uid);
  } catch (error) {
    log.error("Erreur de connexion :", error.message);
  }
};

/**
 * Envoie un email de réinitialisation du mot de passe
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    log.info("Email de réinitialisation envoyé à :", email);
  } catch (error) {
    log.error("Erreur lors de l'envoi de l'email de réinitialisation :", error.message);
  }
};

/**
 * Déconnexion
 */
export const handleLogout = async () => {
  try {
    await signOut(auth);

    getGlobalReloadUser()(); // ✅ Réinitialiser l'état utilisateur après la déconnexion

    log.info("Utilisateur déconnecté");
  } catch (error) {
    log.error("Erreur de déconnexion :", error.message);
  }
};
