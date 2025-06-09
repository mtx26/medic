import { createContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { log } from '../utils/logger';

const API_URL = import.meta.env.VITE_API_URL;

const UserContext = createContext(null);
let globalReloadUser = () => {};

export const UserProvider = ({ children }) => {
  const [userInfo, setUserInfo] = useState(
    () => JSON.parse(localStorage.getItem('userInfo')) || null
  );

  const reloadUser = useCallback(
    async (displayName, photoURL, emailEnabled, pushEnabled) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!user || !session) return;

      const body = {
        uid: user.id,
        display_name: displayName || null,
        email: user.email || null,
        photo_url: photoURL || null,
        email_enabled: emailEnabled ?? true,
        push_enabled: pushEnabled ?? true,
      };

      const sameAsBefore =
        body.display_name === userInfo?.displayName &&
        body.photo_url === userInfo?.photoURL &&
        body.email_enabled === userInfo?.emailEnabled &&
        body.push_enabled === userInfo?.pushEnabled;

      if (sameAsBefore) {
        log.info('[UserContext] Données utilisateur inchangées, skip API');
        return;
      }

      try {
        const res = await fetch(`${API_URL}/api/user/sync`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(body),
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Erreur API Supabase');

        const info = {
          displayName: data.display_name || user.user_metadata?.name || null,
          photoURL: data.photo_url || user.user_metadata?.avatar_url || null,
          role: data.role || 'user',
          uid: user.id,
          email: user.email,
          emailVerified: !!user.email_confirmed_at,
          provider: user.app_metadata?.provider || 'email',
          emailEnabled: data.email_enabled,
          pushEnabled: data.push_enabled,
        };

        setUserInfo(info);
        localStorage.setItem('userInfo', JSON.stringify(info));
      } catch (error) {
        log.error('[UserContext] Erreur lors du chargement API', {
          error,
          origin: 'USER_CONTEXT_RELOAD_USER_ERROR',
        });
      }
    },
    [userInfo]
  );

  useEffect(() => {
    globalReloadUser = reloadUser;
  }, [reloadUser]);

  useEffect(() => {
    const { data: listener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        log.info('[UserContext] AuthStateChange', { event });

        if (['SIGNED_IN', 'TOKEN_REFRESHED'].includes(event) && session) {
          reloadUser();
        } else if (event === 'SIGNED_OUT') {
          setUserInfo(null);
          localStorage.removeItem('userInfo');
        }
      }
    );

    return () => listener?.subscription?.unsubscribe?.();
  }, [reloadUser]);

  return (
    <UserContext.Provider value={{ userInfo }}>{children}</UserContext.Provider>
  );
};

export { UserContext };
export const getGlobalReloadUser = () => globalReloadUser;
