import { useContext, useEffect, useRef } from 'react';
import { UserContext } from '../contexts/UserContext';
import { analyticsPromise } from '../services/firebase';
import { supabase } from '../services/supabaseClient';
import { log } from '../utils/logger';
import { logEvent } from 'firebase/analytics';

const API_URL = import.meta.env.VITE_API_URL;

const fetchNotifications = async (
  uid,
  setNotificationsData,
  setLoadingStates
) => {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error('Session Supabase non trouvée');

    const res = await fetch(`${API_URL}/api/notifications`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const sortedNotifications = data.notifications.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    setNotificationsData(sortedNotifications);
    setLoadingStates((prev) => ({ ...prev, notifications: false }));

    analyticsPromise.then((analytics) => {
      if (analytics) {
        logEvent(analytics, 'fetch_notifications', {
          uid,
          count: data.notifications?.length,
        });
      }
    });

    log.info(data.message, {
      origin: 'NOTIFICATIONS_FETCH_SUCCESS',
      uid,
      count: data.notifications?.length,
    });
  } catch (err) {
    setNotificationsData([]);
    setLoadingStates((prev) => ({ ...prev, notifications: false }));
    log.error(err.message || 'Échec de récupération des notifications', err, {
      origin: 'NOTIFICATIONS_FETCH_ERROR',
      uid,
    });
  }
};

export const useRealtimeNotifications = (
  setNotificationsData,
  setLoadingStates
) => {
  const { userInfo } = useContext(UserContext);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!userInfo || !setNotificationsData) return;

    const uid = userInfo.uid;
    setLoadingStates((prev) => ({ ...prev, notifications: true }));
    fetchNotifications(uid, setNotificationsData, setLoadingStates);

    const channel = supabase
      .channel(`notifications-${uid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${uid}`,
        },
        () => {
          fetchNotifications(uid, setNotificationsData, setLoadingStates);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      try {
        channelRef.current?.unsubscribe();
        channelRef.current = null;
      } catch (err) {
        log.error('Erreur lors de la désinscription du canal Supabase', err, {
          origin: 'REALTIME_NOTIFICATIONS_UNSUBSCRIBE_ERROR',
        });
      }
    };
  }, [userInfo, setNotificationsData, setLoadingStates]);
};
