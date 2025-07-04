export function getSupabaseErrorMessage(message) {
  if (!message) return 'supabase-error.generic';

  const msg = message.toLowerCase();

  if (msg.includes('invalid login credentials')) {
    return 'supabase-error.invalid-login-credentials';
  }
  if (msg.includes('user already registered')) {
    return 'supabase-error.user-already-registered';
  }
  if (msg.includes('invalid email')) {
    return 'supabase-error.invalid-email';
  }
  if (msg.includes('email not confirmed')) {
    return 'supabase-error.email-not-confirmed';
  }
  if (msg.includes('password should be at least')) {
    return 'supabase-error.password-too-weak';
  }
  if (msg.includes('email or password is required')) {
    return 'supabase-error.email-or-password-required';
  }
  if (msg.includes('email is required')) {
    return 'supabase-error.email-required';
  }
  if (msg.includes('password is required')) {
    return 'supabase-error.password-required';
  }
  if (msg.includes('rate limit')) {
    return 'supabase-error.rate-limit';
  }
  if (msg.includes('email address') && msg.includes('is invalid')) {
    return 'supabase-error.invalid-email';
  }
  if (msg.includes('user not found')) {
    return 'supabase-error.user-not-found';
  }
  if (msg.includes('invalid credentials')) {
    return 'supabase-error.invalid-credentials';
  }
  if (msg.includes('for security purposes') && msg.includes('you can only request this after')) {
    return 'supabase-error.wait-before-retry';
  }
  if (msg.includes('user already exists')) {
    return 'supabase-error.user-already-exists';
  }
  if (msg.includes('invalid or expired password')) {
    return 'supabase-error.invalid-or-expired-password';
  }
  if (msg.includes('invalid or expired credentials')) {
    return 'supabase-error.invalid-or-expired-credentials';
  }
  if (msg.includes('invalid or expired token')) {
    return 'supabase-error.invalid-or-expired-token';
  }
  if (msg.includes('invalid or expired code')) {
    return 'supabase-error.invalid-or-expired-code';
  }
  if (msg.includes('invalid or expired link')) {
    return 'supabase-error.invalid-or-expired-link';
  }
  return 'supabase-error.generic';
}
