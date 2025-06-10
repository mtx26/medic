export function getSupabaseErrorMessage(message) {
  if (!message) return 'Une erreur est survenue. Veuillez réessayer.';

  const msg = message.toLowerCase();

  if (msg.includes('invalid login credentials')) {
    return 'Identifiants incorrects.';
  }
  if (msg.includes('user already registered')) {
    return 'Cette adresse e-mail est déjà utilisée.';
  }
  if (msg.includes('invalid email')) {
    return 'Adresse e-mail invalide.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Veuillez confirmer votre adresse e-mail avant de vous connecter.';
  }
  if (msg.includes('password should be at least')) {
    return 'Le mot de passe est trop faible (au moins 6 caractères).';
  }
  if (msg.includes('email or password is required')) {
    return 'Veuillez entrer une adresse e-mail et un mot de passe.';
  }
  if (msg.includes('email is required')) {
    return 'Veuillez entrer une adresse e-mail.';
  }
  if (msg.includes('password is required')) {
    return 'Veuillez entrer un mot de passe.';
  }
  if (msg.includes('rate limit')) {
    return 'Trop de tentatives. Veuillez réessayer plus tard.';
  }
  if (msg.includes('email address') && msg.includes('is invalid')) {
    return 'Adresse e-mail invalide.';
  }
  if (msg.includes('user not found')) {
    return 'Aucun compte trouvé avec cet e-mail.';
  }
  if (msg.includes('invalid credentials')) {
    return 'Identifiants incorrects.';
  }
  if (msg.includes('for security purposes') && msg.includes('you can only request this after')) {
    return 'Veuillez patienter quelques secondes avant de réessayer.';
  }
  if (msg.includes('user already exists')) {
    return 'Cette adresse e-mail est déjà utilisée.';
  }
  if (msg.includes('invalid or expired password')) {
    return 'Mot de passe invalide ou expiré.';
  }
  if (msg.includes('invalid or expired credentials')) {
    return 'Identifiants incorrects ou expirés.';
  }
  if (msg.includes('invalid or expired token')) {
    return 'Jeton invalide ou expiré.';
  }
  if (msg.includes('invalid or expired code')) {
    return 'Code invalide ou expiré.';
  }
  if (msg.includes('invalid or expired link')) {
    return 'Lien invalide ou expiré.';
  }
  return 'Une erreur est survenue. Veuillez réessayer.';
}
