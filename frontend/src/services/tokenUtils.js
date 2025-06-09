import { supabase } from './supabaseClient';

export async function getToken() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return session.access_token;
    } catch (error) {
      return null;
    }
  }