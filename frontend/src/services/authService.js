import { auth, db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { getGlobalReloadUser } from "../contexts/UserContext";

import { 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  updatePassword as firebaseUpdatePassword,
  sendEmailVerification
} from "firebase/auth";
import { log } from "../utils/logger";

const GoogleProvider = new GoogleAuthProvider();

const API_URL = process.env.REACT_APP_API_URL;


/**
 * Connexion avec Google
 */
export const GoogleHandleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, GoogleProvider);
    const user = result.user;

    const fetchPhotoUrl = async (googlePhotoUrl) => {
      const token = await user.getIdToken(); // Firebase Auth ID token
    
      const res = await fetch(`${API_URL}/api/upload/logo`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ googlePhotoUrl }),
      });
    
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erreur de l'API");
    
      return data.url;
    };    

    const userRef = doc(db, "users", user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      let photoUrlDB = "";
      if (user.photoURL) {
        try {
          photoUrlDB = await fetchPhotoUrl(user.photoURL)
        } catch (error) {
          log.error(error.message, {
            origin: "GOOGLE_HANDLE_LOGIN_ERROR",
            "uid": user.uid,
          });
        }
      }

      await setDoc(userRef, {
        display_name: user.displayName || "Utilisateur",
        role: "user",
        email: user.email,
        photo_url: photoUrlDB
      });
    }

    getGlobalReloadUser()(); // Rafraîchir les infos utilisateur
    log.info("Utilisateur connecté avec Google", {
      origin: "GOOGLE_HANDLE_LOGIN_SUCCESS",
      "uid": auth.currentUser.uid,
    });

  } catch (err) {
    log.error(err.message || "Erreur lors de la connexion avec Google", err, {
      origin: "GOOGLE_HANDLE_LOGIN_ERROR",
      "uid": auth.currentUser.uid,
    });
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
      display_name: name,
      photo_url: "",
      role: "user",
      email: user.email
    });

    await sendEmailVerification(user);

    getGlobalReloadUser()(); // Rafraîchir les infos utilisateur

    log.info("Utilisateur inscrit et connecté :", {
      origin: "REGISTER_WITH_EMAIL_SUCCESS",
      "uid": user.uid,
    });

    return user;
  } catch (error) {
    log.error("Erreur lors de l'inscription avec email :", error.message, {
      origin: "REGISTER_WITH_EMAIL_ERROR",
      "uid": auth.currentUser.uid,
    });
  }
};

/**
 * Connexion avec email et mot de passe
 */
export const loginWithEmail = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    getGlobalReloadUser()(); // Rafraîchir les infos utilisateur

    log.info("Utilisateur connecté avec email :", {
      origin: "LOGIN_WITH_EMAIL_SUCCESS",
      "uid": userCredential.user.uid,
    });
    return userCredential.user;
  } catch (error) {
    log.error("Erreur lors de la connexion avec email :", error.message, {
      origin: "LOGIN_WITH_EMAIL_ERROR",
      "uid": auth.currentUser.uid,
    });
  }
};

/**
 * Envoie un email de réinitialisation du mot de passe
 */
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    log.info("Email de réinitialisation envoyé à :", email, {
      origin: "RESET_PASSWORD_SUCCESS",
      "uid": auth.currentUser.uid,
    });
  } catch (error) {
    log.error("Erreur lors de l'envoi de l'email de réinitialisation :", error.message, {
      origin: "RESET_PASSWORD_ERROR",
      "uid": auth.currentUser.uid,
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
      origin: "HANDLE_LOGOUT_SUCCESS",
      "uid": null,
    });
  } catch (error) {
    log.error("Erreur de déconnexion :", error.message, {
      origin: "HANDLE_LOGOUT_ERROR",
      "uid": null,
    });
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
      origin: "UPDATE_USER_PASSWORD_SUCCESS",
      "uid": auth.currentUser.uid,
    });
  } catch (error) {
    log.error("Erreur lors de la mise à jour du mot de passe", error.message, {
      origin: "UPDATE_USER_PASSWORD_ERROR",
      "uid": auth.currentUser.uid,
    });
  }
};
