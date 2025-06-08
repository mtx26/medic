import { useContext, useEffect, useRef } from 'react';
import { UserContext } from '../contexts/UserContext';
import { analyticsPromise } from '../services/firebase';
import { log } from '../utils/logger';
import { logEvent } from 'firebase/analytics';
import { supabase } from '../services/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL;

export const useRealtimeTokens = (setTokensList, setLoadingStates) => {
  const { userInfo } = useContext(UserContext);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!userInfo || !setTokensList) return;

    const uid = userInfo.uid;

    const fetchTokens = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("Session Supabase non trouvée");

        const res = await fetch(`${API_URL}/api/tokens`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        setTokensList(data.tokens);
        setLoadingStates(prev => ({ ...prev, tokens: false }));

        analyticsPromise.then((analytics) => {
          if (analytics) {
            logEvent(analytics, 'fetch_tokens', {
              uid,
              count: data.tokens?.length,
            });
          }
        });

        log.info(data.message, {
          origin: "TOKENS_FETCH_SUCCESS",
          uid,
          count: data.tokens.length,
        });
      } catch (err) {
        setLoadingStates(prev => ({ ...prev, tokens: false }));
        log.error(err.message || "Échec de récupération des tokens", err, {
          origin: "TOKENS_FETCH_ERROR",
          uid,
        });
      }
    };

    // Fetch initial
    fetchTokens();

    // Supabase Realtime
    const tokenChannel = supabase
      .channel(`tokens-${uid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_tokens',
          filter: `owner_uid=eq.${uid}`,
        },
        () => fetchTokens()
      )
      .subscribe();

    const deleteChannel = supabase
      .channel(`delete-tokens-${uid}`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'shared_tokens',
        },
        () => fetchTokens()
      )
      .subscribe();

    channelRef.current = [tokenChannel, deleteChannel];

    return () => {
      try {
        tokenChannel.unsubscribe();
        deleteChannel.unsubscribe();
        channelRef.current = null;
      } catch (err) {
        log.error("Erreur lors de la désinscription des canaux token", err, {
          origin: "REALTIME_TOKENS_UNSUBSCRIBE_ERROR",
          uid,
        });
      }
    };
  }, [userInfo, setTokensList, setLoadingStates]);
};
