import { supabase } from "../services/supabaseClient";
import { getGlobalReloadUser } from "../contexts/UserContext";
import { log } from "../utils/logger";

/**
 * Connexion avec Google
 */
export const GoogleHandleLogin = async () => {
  try {
    await supabase.auth.signInWithOAuth({ provider: "google" });

    const user = (await supabase.auth.getUser()).data.user;
    getGlobalReloadUser()(user?.user_metadata?.name, user?.user_metadata?.avatar_url);

    log.info("Utilisateur connecté avec Google", {
      origin: "GOOGLE_HANDLE_LOGIN_SUCCESS",
      uid: user?.id || null,
    });

  } catch (err) {
    log.error(err.message || "Erreur lors de la connexion avec Google", err, {
      origin: "GOOGLE_HANDLE_LOGIN_ERROR",
      uid: null,
    });
  }
};

/**
 * Inscription avec email et mot de passe
 */
export const registerWithEmail = async (email, password, name) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          avatar_url: null,
        },
      },
    });

    if (error) throw error;

    const user = data.user;
    getGlobalReloadUser()(name, null);

    log.info("Utilisateur inscrit et connecté :", {
      origin: "REGISTER_WITH_EMAIL_SUCCESS",
      uid: user?.id || null,
    });

    return user;
  } catch (error) {
    log.error("Erreur lors de l'inscription avec email :", error.message, {
      origin: "REGISTER_WITH_EMAIL_ERROR",
      uid: null,
    });
  }
};

/**
 * Connexion avec email et mot de passe
 */
export const loginWithEmail = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;

    const user = data.user;
    getGlobalReloadUser()(user?.user_metadata?.name, user?.user_metadata?.avatar_url);

    log.info("Utilisateur connecté avec email :", {
      origin: "LOGIN_WITH_EMAIL_SUCCESS",
      uid: user?.id || null,
    });

    return user;
  } catch (error) {
    log.error("Erreur lors de la connexion avec email :", error.message, {
      origin: "LOGIN_WITH_EMAIL_ERROR",
      uid: null,
    });
  }
};

/**
 * Envoie un email de réinitialisation du mot de passe
 */
export const resetPassword = async (email) => {
  try {
    await supabase.auth.resetPasswordForEmail(email);

    log.info("Email de réinitialisation envoyé à :", email, {
      origin: "RESET_PASSWORD_SUCCESS",
      uid: null,
    });
  } catch (error) {
    log.error("Erreur lors de l'envoi de l'email de réinitialisation :", error.message, {
      origin: "RESET_PASSWORD_ERROR",
      uid: null,
    });
  }
};

/**
 * Déconnexion
 */
export const handleLogout = async () => {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    await supabase.auth.signOut();

    getGlobalReloadUser()();

    log.info("Utilisateur déconnecté", {
      origin: "HANDLE_LOGOUT_SUCCESS",
      uid: user?.id || null,
    });
  } catch (error) {
    log.error("Erreur de déconnexion :", error.message, {
      origin: "HANDLE_LOGOUT_ERROR",
      uid: null,
    });
  }
};

/**
 * Mise à jour du mot de passe utilisateur
 */
export const updateUserPassword = async (newPassword) => {
  try {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error("Aucun utilisateur connecté.");

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;

    log.info("Mot de passe utilisateur mis à jour", {
      origin: "UPDATE_USER_PASSWORD_SUCCESS",
      uid: user?.id || null,
    });
  } catch (error) {
    log.error("Erreur lors de la mise à jour du mot de passe", error.message, {
      origin: "UPDATE_USER_PASSWORD_ERROR",
      uid: null,
    });
  }
};
