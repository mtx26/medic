import { auth, db } from "./firebase";
import { doc, setDoc, getDoc, updateDoc } from "firebase/firestore";
import { getGlobalReloadUser } from "../contexts/UserContext";

import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updateEmail as firebaseUpdateEmail, 
  updatePassword as firebaseUpdatePassword,
  sendEmailVerification
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

    getGlobalReloadUser()(); // Rafraîchir les infos utilisateur
    log.info("Utilisateur connecté avec Google", {
      id: "GOOGLEHANDLELOGIN",
      origin: "authService.js",
      user: user.uid,
    });

  } catch (error) {
    log.error("Erreur de connexion avec Google", error, {
      id: "GOOGLEHANDLELOGIN",
      origin: "authService.js",
      stack: error.stack,
    });
  }
};

/**
 * Inscription avec email et mot de passe
 */
export const registerWithEmail = async (email, password, name) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
    displayName: name,
    photoURL: "",
    role: "user",
    email: user.email
  });

  await sendEmailVerification(user);

  getGlobalReloadUser()(); // Rafraîchir les infos utilisateur

  log.info("Utilisateur inscrit et connecté :", {
    id: "REGISTERWITHEMAIL",
    origin: "authService.js",
    user: user.uid,
  });

  return user;
};

/**
 * Connexion avec email et mot de passe
 */
export const loginWithEmail = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);

  getGlobalReloadUser()(); // Rafraîchir les infos utilisateur

  log.info("Utilisateur connecté avec email :", {
    id: "LOGINWITHEMAIL",
    origin: "authService.js",
    user: userCredential.user.uid,
  });
  return userCredential.user;
};

/**
 * Envoie un email de réinitialisation du mot de passe
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    log.info("Email de réinitialisation envoyé à :", email, {
      id: "RESETPASSWORD",
      origin: "authService.js",
    });
  } catch (error) {
    log.error("Erreur lors de l'envoi de l'email de réinitialisation :", error.message, {
      id: "RESETPASSWORD",
      origin: "authService.js",
      stack: error.stack,
    });
  }
};

/**
 * Déconnexion
 */
export const handleLogout = async () => {
  try {
    await signOut(auth);

    getGlobalReloadUser()(); // Réinitialiser l'état utilisateur après la déconnexion

    log.info("Utilisateur déconnecté", {
      id: "HANDLELOGOUT",
      origin: "authService.js",
    });
  } catch (error) {
    log.error("Erreur de déconnexion :", error.message, {
      id: "HANDLELOGOUT",
      origin: "authService.js",
      stack: error.stack,
    });
  }
};

/**
 * Mise à jour de l'email utilisateur
 */
export const updateUserEmail = async (newEmail) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Aucun utilisateur connecté.");
    
    await firebaseUpdateEmail(user, newEmail);

    // Mettre aussi à jour Firestore
    const userRef = doc(db, "users", user.uid);
    await updateDoc(userRef, { email: newEmail });

    getGlobalReloadUser()(); // Rafraîchir le contexte utilisateur
    log.info("Email utilisateur mis à jour", {
      id: "UPDATEUSEREMAIL",
      origin: "authService.js",
      user: user.uid,
    });
  } catch (error) {
    log.error("Erreur lors de la mise à jour de l'email", error.message, {
      id: "UPDATEUSEREMAIL",
      origin: "authService.js",
      stack: error.stack,
    });
    throw error;
  }
};

/**
 * Mise à jour du mot de passe utilisateur
 */
export const updateUserPassword = async (newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Aucun utilisateur connecté.");

    await firebaseUpdatePassword(user, newPassword);

    log.info("Mot de passe utilisateur mis à jour", {
      id: "UPDATEUSERPASSWORD",
      origin: "authService.js",
      user: user.uid,
    });
  } catch (error) {
    log.error("Erreur lors de la mise à jour du mot de passe", error.message, {
      id: "UPDATEUSERPASSWORD",
      origin: "authService.js",
      stack: error.stack,
    });
    throw error;
  }
};
