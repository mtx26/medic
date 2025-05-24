import { useContext, useEffect, useRef } from 'react';
import { UserContext } from '../contexts/UserContext';
import { auth, analytics } from '../services/firebase';
import { supabase } from '../services/supabaseClient';
import { log } from '../utils/logger';
import { logEvent } from 'firebase/analytics';

const API_URL = import.meta.env.VITE_API_URL;

const fetchNotifications = async (user, setNotificationsData, setLoadingStates) => {
  try {
    const token = await user.getIdToken();
    const res = await fetch(`${API_URL}/api/notifications`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const sortedNotifications = data.notifications.sort(
      (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
    );
    setNotificationsData(sortedNotifications);
    setLoadingStates(prev => ({ ...prev, notifications: false }));

    logEvent(analytics, 'fetch_notifications', {
      uid: user.uid,
      count: data.notifications?.length,
    });
    log.info(data.message, {
      origin: "NOTIFICATIONS_FETCH_SUCCESS",
      uid: user.uid,
      count: data.notifications?.length,
    });
  } catch (err) {
    setLoadingStates(prev => ({ ...prev, notifications: false }));
    log.error(err.message || "Échec de récupération des notifications enrichies", err, {
      origin: "NOTIFICATIONS_FETCH_ERROR",
      uid: user?.uid,
    });
  }
};

export const useRealtimeNotifications = (setNotificationsData, setLoadingStates) => {
  const { currentUser, authReady } = useContext(UserContext);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!(authReady && currentUser)) {
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setLoadingStates(prev => ({ ...prev, notifications: false }));
      return;
    }

    if (setNotificationsData) {
      fetchNotifications(user, setNotificationsData, setLoadingStates);

      // 🔹 Realtime Supabase
      const channel = supabase
      .channel(`notifications-${user.uid}`)
      .on(
        'postgres_changes',
        {
          event: 'insert',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.uid}`,
        },
        () => {
          fetchNotifications(user, setNotificationsData, setLoadingStates);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'delete',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          fetchNotifications(user, setNotificationsData, setLoadingStates);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'update',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.uid}`,
        },
        () => {
          fetchNotifications(user, setNotificationsData, setLoadingStates);
        }
      )
      .subscribe();

      channelRef.current = channel;
      return () => {
        try {
          if (channelRef.current?.unsubscribe) {
            channelRef.current.unsubscribe();
          }
        } catch (err) {
          log.error(err.message, err, {
            origin: "REALTIME_NOTIFICATIONS_UNSUBSCRIBE_ERROR",
          });
        }
      };
    }
  }, [authReady, currentUser, setNotificationsData, setLoadingStates]);
};
