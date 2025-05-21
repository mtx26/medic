import { useEffect, useContext, useRef } from "react";
import { auth, analytics } from "../services/firebase";
import { log } from "../utils/logger";
import { UserContext } from '../contexts/UserContext';
import { logEvent } from "firebase/analytics";
import { supabase } from "../services/supabaseClient";

const API_URL = import.meta.env.VITE_API_URL;

const fetchCalendars = async (user, setCalendarsData, setLoadingStates) => {
  try {
    const token = await user.getIdToken();
    const res = await fetch(`${API_URL}/api/calendars`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const sortedCalendars = data.calendars.sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    setCalendarsData(sortedCalendars);
    setLoadingStates(prev => ({ ...prev, calendars: false }));

    logEvent(analytics, 'fetch_calendars', {
      uid: user.uid,
      count: data.calendars?.length,
    });
  } catch (err) {
    setLoadingStates(prev => ({ ...prev, calendars: false }));
  }
};

const fetchSharedCalendars = async (user, setSharedCalendarsData, setLoadingStates) => {
  try {
    const token = await user.getIdToken();
    const res = await fetch(`${API_URL}/api/shared/users/calendars`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setSharedCalendarsData(data.calendars);
    setLoadingStates(prev => ({ ...prev, sharedCalendars: false }));

    logEvent(analytics, 'fetch_shared_calendars', {
      uid: user.uid,
      count: data.calendars?.length,
    });
    log.info(data.message, {
      origin: "SHARED_CALENDARS_FETCH_SUCCESS",
      uid: user.uid,
      count: data.calendars?.length,
    });
  } catch (err) {
    setLoadingStates(prev => ({ ...prev, sharedCalendars: false }));
    log.error(err.message || "Échec de récupération des calendriers partagés", err, {
      origin: "SHARED_CALENDARS_FETCH_ERROR",
      uid: user?.uid,
    });
  }
};

export const useRealtimeCalendars = (setCalendarsData, setLoadingStates) => {
  const { currentUser, authReady } = useContext(UserContext);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!(authReady && currentUser)) {
      setLoadingStates(prev => ({ ...prev, calendars: false }));
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setLoadingStates(prev => ({ ...prev, calendars: false }));
      return;
    }

    fetchCalendars(user, setCalendarsData, setLoadingStates);

    // Abonnement realtime Supabase
    const channel = supabase
      .channel('calendars-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendars',
          filter: `owner_uid=eq.${user.uid}`,
        },
        () => {
          fetchCalendars(user, setCalendarsData, setLoadingStates);
        }
      )
      .subscribe();

    const deleteChannel = supabase
      .channel('calendars-delete-watch')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'calendars',
        },
        () => {
          fetchCalendars(user, setCalendarsData, setLoadingStates);
        }
      )
      .subscribe();

    channelRef.current = { channel, deleteChannel };

    return () => {
      try {
        if (channelRef.current && typeof channelRef.current.unsubscribe === "function") {
          channelRef.current.unsubscribe();
          channelRef.current = null;
        }
      } catch (err) {
        log.error(err.message, err, {
          origin: "REALTIME_TOKEN_INIT_ERROR",
          token,
        });
      }
    };
  }, [authReady, currentUser, setCalendarsData, setLoadingStates]);
};

export const useRealtimeSharedCalendars = (setSharedCalendarsData, setLoadingStates) => {
  const { currentUser, authReady } = useContext(UserContext);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!(authReady && currentUser)) {
      setLoadingStates(prev => ({ ...prev, sharedCalendars: false }));
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setLoadingStates(prev => ({ ...prev, sharedCalendars: false }));
      return;
    }

    fetchSharedCalendars(user, setSharedCalendarsData, setLoadingStates);

    // Abonnement realtime Supabase pour les shared_calendars
    const channel = supabase
      .channel('shared-calendars-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_calendars',
          filter: `receiver_uid=eq.${user.uid}`,
        },
        () => {
          fetchSharedCalendars(user, setSharedCalendarsData, setLoadingStates);
        }
      )
      .subscribe();

    const deleteChannel = supabase
      .channel('shared-calendars-delete-watch')
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'shared_calendars',
        },
        () => {
          fetchSharedCalendars(user, setSharedCalendarsData, setLoadingStates);
        }
      )
      .subscribe();

    channelRef.current = { channel, deleteChannel };
    return () => {
      try {
        if (channelRef.current && typeof channelRef.current.unsubscribe === "function") {
          channelRef.current.unsubscribe();
          channelRef.current = null;
        }
      } catch (err) {
        log.error(err.message, err, {
          origin: "REALTIME_TOKEN_INIT_ERROR",
          token,
        });
      }
    };
  }, [authReady, currentUser, setSharedCalendarsData, setLoadingStates]);
};
