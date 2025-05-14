import { auth } from "./firebase";
import { getGlobalReloadUser } from "../contexts/UserContext";

import {
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  sendEmailVerification,
} from "firebase/auth";
import { log } from "../utils/logger";

const GoogleProvider = new GoogleAuthProvider();
const API_URL = import.meta.env.VITE_API_URL;

/**
 * Envoie les infos à Flask pour créer ou synchroniser l’utilisateur dans Supabase
 */
const syncUserToBackend = async (user, photoURL) => {
  try {

    console.log(user)
    const token = await user.getIdToken();
    if (!token) return;
    
    const body = {
      displayName: user.displayName || "Utilisateur",
      email: user.email,
      photoURL,
    };
    await fetch(`${API_URL}/api/user/sync`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });
  } catch (error) {
    log.error("Erreur lors de la synchro Supabase :", error.message, {
      origin: "USER_SYNC_ERROR",
      uid: user.uid,
    });
  }
};

/**
 * Connexion Google
 */
export const GoogleHandleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, GoogleProvider);
    const user = result.user;

    // upload la photo de profil sur Cloudinary via Flask
    let photoURL = null;
    if (user.photoURL) {
      try {
        const blob = await fetch(user.photoURL).then((r) => r.blob());
        const formData = new FormData();
        formData.append("file", blob, "photo.jpg");

        const token = await user.getIdToken();
        const res = await fetch(`${API_URL}/api/upload/logo`, {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        photoURL = data.url;
      } catch (err) {
        log.error("Erreur upload photo Google", {
          origin: "UPLOAD_PHOTO_ERROR",
          uid: user.uid,
        });
      }
    }

    await syncUserToBackend(user, photoURL);
    getGlobalReloadUser()();

    log.info("Utilisateur connecté avec Google", {
      origin: "GOOGLE_LOGIN_SUCCESS",
      uid: user.uid,
    });
  } catch (err) {
    log.error("Erreur Google login", err.message, {
      origin: "GOOGLE_LOGIN_ERROR",
      uid: auth.currentUser?.uid,
    });
  }
};

/**
 * Inscription Email
 */
export const registerWithEmail = async (email, password, name) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await sendEmailVerification(user);
    await syncUserToBackend(user, ""); // pas de photo à ce stade
    getGlobalReloadUser()();

    log.info("Utilisateur inscrit avec email", {
      origin: "REGISTER_EMAIL_SUCCESS",
      uid: user.uid,
    });

    return user;
  } catch (error) {
    log.error("Erreur inscription email", error.message, {
      origin: "REGISTER_EMAIL_ERROR",
      uid: auth.currentUser?.uid,
    });
  }
};

/**
 * Connexion Email
 */
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await syncUserToBackend(userCredential.user); // s'assurer que Supabase est bien à jour
    getGlobalReloadUser()();

    log.info("Utilisateur connecté avec email", {
      origin: "LOGIN_EMAIL_SUCCESS",
      uid: userCredential.user.uid,
    });

    return userCredential.user;
  } catch (error) {
    log.error("Erreur connexion email", error.message, {
      origin: "LOGIN_EMAIL_ERROR",
      uid: auth.currentUser?.uid,
    });
  }
};

/**
 * Réinitialisation mot de passe
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    log.info("Email réinitialisation envoyé", {
      origin: "RESET_PASSWORD_SUCCESS",
      uid: auth.currentUser?.uid,
    });
  } catch (error) {
    log.error("Erreur réinitialisation mot de passe", error.message, {
      origin: "RESET_PASSWORD_ERROR",
      uid: auth.currentUser?.uid,
    });
  }
};

/**
 * Déconnexion
 */
export const handleLogout = async () => {
  try {
    await signOut(auth);
    getGlobalReloadUser()();

    log.info("Déconnexion réussie", {
      origin: "LOGOUT_SUCCESS",
      uid: null,
    });
  } catch (error) {
    log.error("Erreur déconnexion", error.message, {
      origin: "LOGOUT_ERROR",
      uid: null,
    });
  }
};

/**
 * Mise à jour mot de passe
 */
export const updateUserPassword = async (newPassword) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error("Aucun utilisateur connecté.");
    await firebaseUpdatePassword(user, newPassword);

    log.info("Mot de passe mis à jour", {
      origin: "UPDATE_PASSWORD_SUCCESS",
      uid: user.uid,
    });
  } catch (error) {
    log.error("Erreur MAJ mot de passe", error.message, {
      origin: "UPDATE_PASSWORD_ERROR",
      uid: auth.currentUser?.uid,
    });
  }
};
