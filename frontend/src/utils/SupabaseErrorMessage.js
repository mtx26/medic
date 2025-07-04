export function getSupabaseErrorMessage(message) {
  if (!message) return 'supabase-error.generic';
  const msg = message.toLowerCase();

  const rules = [
    { includes: ['invalid login credentials'], code: 'supabase-error.invalid-login-credentials' },
    { includes: ['user already registered'], code: 'supabase-error.user-already-registered' },
    { includes: ['invalid email'], code: 'supabase-error.invalid-email' },
    { includes: ['email not confirmed'], code: 'supabase-error.email-not-confirmed' },
    { includes: ['password should be at least'], code: 'supabase-error.password-too-weak' },
    { includes: ['email or password is required'], code: 'supabase-error.email-or-password-required' },
    { includes: ['email is required'], code: 'supabase-error.email-required' },
    { includes: ['password is required'], code: 'supabase-error.password-required' },
    { includes: ['rate limit'], code: 'supabase-error.rate-limit' },
    { includes: ['email address', 'is invalid'], code: 'supabase-error.invalid-email' },
    { includes: ['user not found'], code: 'supabase-error.user-not-found' },
    { includes: ['invalid credentials'], code: 'supabase-error.invalid-credentials' },
    { includes: ['for security purposes', 'you can only request this after'], code: 'supabase-error.wait-before-retry' },
    { includes: ['user already exists'], code: 'supabase-error.user-already-exists' },
    { includes: ['invalid or expired password'], code: 'supabase-error.invalid-or-expired-password' },
    { includes: ['invalid or expired credentials'], code: 'supabase-error.invalid-or-expired-credentials' },
    { includes: ['invalid or expired token'], code: 'supabase-error.invalid-or-expired-token' },
    { includes: ['invalid or expired code'], code: 'supabase-error.invalid-or-expired-code' },
    { includes: ['invalid or expired link'], code: 'supabase-error.invalid-or-expired-link' },
  ];

  for (const rule of rules) {
    if (rule.includes.every(text => msg.includes(text))) {
      return rule.code;
    }
  }

  return 'supabase-error.generic';
}
