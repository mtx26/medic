import { supabase } from '../services/supabaseClient';
import { log } from '../utils/logger';

/**
 * Connexion avec Google
 */
export const GoogleHandleLogin = async () => {
  try {
    console.log(window.location.origin);
    await supabase.auth.signInWithOAuth({ 
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
        flowType: 'redirect',
      },
    });
  } catch (err) {
    log.error(err.message || 'Erreur lors de la connexion avec Google', err, {
      origin: 'GOOGLE_HANDLE_LOGIN',
      uid: null,
    });
  }
};

/**
 * Connexion avec Github
 */
export const GithubHandleLogin = async () => {
  try {
    await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
        flowType: 'redirect',
      },
    });
  } catch (err) {
    log.error(err.message || 'Erreur lors de la connexion avec Github', err, {
      origin: 'GITHUB_HANDLE_LOGIN',
      uid: null,
    });
  }
};

/**
 * Connexion avec Twitter
 */
export const TwitterHandleLogin = async () => {
  try {
    await supabase.auth.signInWithOAuth({
      provider: 'twitter',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
        flowType: 'redirect',
      },
    });
  } catch (err) {
    log.error(err.message || 'Erreur lors de la connexion avec Twitter', err, {
      origin: 'TWITTER_HANDLE_LOGIN',
      uid: null,
    });
  }
};

/**
 * Connexion avec Facebook
 */
export const FacebookHandleLogin = async () => {
  try {
    await supabase.auth.signInWithOAuth({
      provider: 'facebook',
      options: {
        redirectTo: window.location.origin + '/auth/callback',
        queryParams: {
          prompt: 'select_account',
          access_type: 'offline',
        },
        flowType: 'redirect',
      },
    });
  } catch (err) {
    log.error(err.message || 'Erreur lors de la connexion avec Facebook', err, {
      origin: 'FACEBOOK_HANDLE_LOGIN',
      uid: null,
    });
  }
};

/**
 * Inscription avec email et mot de passe
 */
export const registerWithEmail = async (email, password, name) => {
  try {
    await supabase.auth.signUp({
      email,
      password,
      options: {
        redirectTo: window.location.origin + '/auth/callback',
        data: {
          name,
          avatar_url: null,
        },
      },
    });
  } catch (error) {
    log.error("Erreur lors de l'inscription avec email :", error.message, {
      origin: 'REGISTER_WITH_EMAIL',
      uid: null,
    });
  }
};

/**
 * Connexion avec email et mot de passe
 */
export const loginWithEmail = async (email, password) => {
  try {
    await supabase.auth.signInWithPassword({
      email,
      password,
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    });
  } catch (error) {
    log.error('Erreur lors de la connexion avec email :', error.message, {
      origin: 'LOGIN_WITH_EMAIL',
      uid: null,
    });
  }
};

/**
 * Envoie un email de réinitialisation du mot de passe
 */
export const resetPassword = async (email) => {
  try {
    await supabase.auth.resetPasswordForEmail(email, {
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    });
  } catch (error) {
    log.error(
      "Erreur lors de l'envoi de l'email de réinitialisation :",
      error.message,
      {
        origin: 'RESET_PASSWORD',
        uid: null,
      }
    );
  }
};

/**
 * Déconnexion
 */
export const handleLogout = async () => {
  try {
    await supabase.auth.signOut({
      options: {
        redirectTo: window.location.origin,
      },
    });
  } catch (error) {
    log.error('Erreur de déconnexion :', error.message, {
      origin: 'HANDLE_LOGOUT',
      uid: null,
    });
  }
};

/**
 * Mise à jour du mot de passe utilisateur
 */
export const updateUserPassword = async (newPassword) => {
  try {
    await supabase.auth.updateUser({
      password: newPassword,
      options: {
        redirectTo: window.location.origin + '/auth/callback',
      },
    });
  } catch (error) {
    log.error('Erreur lors de la mise à jour du mot de passe', error.message, {
      origin: 'UPDATE_USER_PASSWORD',
      uid: null,
    });
  }
};
