import { useEffect, useContext, useRef } from "react";
import { supabase } from "../services/supabaseClient";
import { log } from "../utils/logger";
import { UserContext } from '../contexts/UserContext';
import { analyticsPromise } from "../services/firebase";
import { logEvent } from "firebase/analytics";

const API_URL = import.meta.env.VITE_API_URL;

const fetchCalendars = async (uid, setCalendarsData, setLoadingStates) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Session Supabase non trouvée");

    const res = await fetch(`${API_URL}/api/calendars`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const sortedCalendars = data.calendars.sort((a, b) =>
      a.name.localeCompare(b.name)
    );
    setCalendarsData(sortedCalendars);
    setLoadingStates(prev => ({ ...prev, calendars: false }));

    analyticsPromise.then((analytics) => {
      if (analytics) {
        logEvent(analytics, "fetch_calendars", {
          uid,
          count: data.calendars?.length,
        });
      }
    });

    log.info(data.message, {
      origin: "CALENDARS_FETCH_SUCCESS",
      uid,
      count: data.calendars?.length,
    });
  } catch (err) {
    setLoadingStates(prev => ({ ...prev, calendars: false }));
    log.error(err.message || "Échec de récupération des calendriers", {
      origin: "CALENDARS_FETCH_ERROR",
      uid,
    });
  }
};

const fetchSharedCalendars = async (uid, setSharedCalendarsData, setLoadingStates) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Session Supabase non trouvée");

    const res = await fetch(`${API_URL}/api/shared/users/calendars`, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    setSharedCalendarsData(data.calendars);
    setLoadingStates(prev => ({ ...prev, sharedCalendars: false }));

    analyticsPromise.then((analytics) => {
      if (analytics) {
        logEvent(analytics, "fetch_shared_calendars", {
          uid,
          count: data.calendars?.length,
        });
      }
    });

    log.info(data.message, {
      origin: "SHARED_CALENDARS_FETCH_SUCCESS",
      uid,
      count: data.calendars?.length,
    });
  } catch (err) {
    setLoadingStates(prev => ({ ...prev, sharedCalendars: false }));
    log.error(err.message || "Échec de récupération des calendriers partagés", {
      origin: "SHARED_CALENDARS_FETCH_ERROR",
      uid,
    });
  }
};

export const useRealtimeCalendars = (setCalendarsData, setLoadingStates) => {
  const { userInfo } = useContext(UserContext);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!userInfo || !setCalendarsData) return;

    setLoadingStates(prev => ({ ...prev, calendars: true }));
    fetchCalendars(userInfo.uid, setCalendarsData, setLoadingStates);

    const channel = supabase
      .channel('calendars-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendars',
          filter: `owner_uid=eq.${userInfo.uid}`,
        },
        () => fetchCalendars(userInfo.uid, setCalendarsData, setLoadingStates)
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
        () => fetchCalendars(userInfo.uid, setCalendarsData, setLoadingStates)
      )
      .subscribe();

    channelRef.current = { channel, deleteChannel };

    return () => {
      try {
        channel.unsubscribe();
        deleteChannel.unsubscribe();
        channelRef.current = null;
      } catch (err) {
        log.error("Erreur lors de la désinscription des canaux Supabase", {
          error: err,
          origin: "REALTIME_CALENDARS_CLEANUP_ERROR",
        });
      }
    };
  }, [userInfo, setCalendarsData, setLoadingStates]);
};

export const useRealtimeSharedCalendars = (setSharedCalendarsData, setLoadingStates) => {
  const { userInfo } = useContext(UserContext);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!userInfo || !setSharedCalendarsData) return;

    setLoadingStates(prev => ({ ...prev, sharedCalendars: true }));
    fetchSharedCalendars(userInfo.uid, setSharedCalendarsData, setLoadingStates);

    const channel = supabase
      .channel('shared-calendars-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_calendars',
          filter: `receiver_uid=eq.${userInfo.uid}`,
        },
        () => fetchSharedCalendars(userInfo.uid, setSharedCalendarsData, setLoadingStates)
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
        () => fetchSharedCalendars(userInfo.uid, setSharedCalendarsData, setLoadingStates)
      )
      .subscribe();

    channelRef.current = { channel, deleteChannel };

    return () => {
      try {
        channel.unsubscribe();
        deleteChannel.unsubscribe();
        channelRef.current = null;
      } catch (err) {
        log.error("Erreur lors de la désinscription des canaux Supabase", {
          error: err,
          origin: "REALTIME_SHARED_CALENDARS_CLEANUP_ERROR",
        });
      }
    };
  }, [userInfo, setSharedCalendarsData, setLoadingStates]);
};
