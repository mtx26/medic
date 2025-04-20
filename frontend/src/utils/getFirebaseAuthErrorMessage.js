// utils/firebaseErrors.js

export function getFirebaseAuthErrorMessage(code) {
  switch (code) {
    case "auth/email-already-in-use":
      return "Cette adresse e-mail est déjà utilisée.";
    case "auth/invalid-email":
      return "Adresse e-mail invalide.";
    case "auth/user-not-found":
      return "Aucun compte trouvé avec cet e-mail.";
    case "auth/wrong-password":
      return "Mot de passe incorrect.";
    case "auth/weak-password":
      return "Le mot de passe est trop faible (au moins 6 caractères).";
    case "auth/missing-password":
      return "Veuillez entrer un mot de passe.";
    case "auth/popup-closed-by-user":
      return "Connexion annulée par l'utilisateur.";
    case "auth/network-request-failed":
      return "Problème de connexion réseau.";
    case "auth/invalid-credential":
      return "Identifiants invalides.";
    default:
      return "Une erreur est survenue. Veuillez réessayer.";
  }
}
