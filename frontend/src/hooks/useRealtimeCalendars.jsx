import { useEffect, useContext } from "react";
import { UserContext } from '../contexts/UserContext';
import { supabase } from "../services/supabaseClient";
import { log } from "../utils/logger";
import { logEvent } from "firebase/analytics";
import { analytics } from "../services/firebase";

const API_URL = import.meta.env.VITE_API_URL;

export const useRealtimeCalendars = (setCalendarsData, setLoadingStates) => {
  const { currentUser, authReady } = useContext(UserContext);

  useEffect(() => {
    if (!(authReady && currentUser)) return;
  
    const user = currentUser;
  
    const fetchCalendars = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_URL}/api/calendars`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
  
        const sorted = data.calendars.sort((a, b) => a.name.localeCompare(b.name));
        setCalendarsData(sorted);
        setLoadingStates(prev => ({ ...prev, calendars: false }));
      } catch (err) {
        setLoadingStates(prev => ({ ...prev, calendars: true }));
        console.error("Erreur lors de la récupération des calendriers :", err);
      }
    };
  
    fetchCalendars();
  
    const modifChannel = supabase
      .channel("calendar_changes")
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'calendars',
          filter: `owner_uid=eq.${user.uid}`,
        },
        (payload) => {
          console.log("✅ Realtime INSERT/UPDATE :", payload);
          fetchCalendars();
        }
      )
      .subscribe();
  
    const deleteChannel = supabase
      .channel("calendar_deletes")
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'calendars',
        },
        (payload) => {
          console.log("🧪 UID utilisateur React :", user.uid);
          console.log("payload", payload);
          console.log("🧪 UID de l’élément supprimé :", payload?.old?.owner_uid);
          console.log("🧪 Match ?", payload?.old?.owner_uid === user.uid);
          if (payload.old?.owner_uid === user.uid) {
            console.log("🗑️ Realtime DELETE :", payload);
            fetchCalendars();
          }
        }
      )
      .subscribe();
  
    return () => {
      supabase.removeChannel(modifChannel);
      supabase.removeChannel(deleteChannel);
    };
  }, [authReady, currentUser, setCalendarsData, setLoadingStates]);  
  
};




export const useRealtimeSharedCalendars = (setSharedCalendarsData, setLoadingStates) => {
  const { currentUser, authReady } = useContext(UserContext);

  useEffect(() => {
    if (!(authReady && currentUser)) return;

    const user = currentUser;

    const fetchSharedCalendars = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_URL}/api/shared/users/calendars`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
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
        setLoadingStates(prev => ({ ...prev, sharedCalendars: true }));
        log.error(err.message, err, {
          origin: "SHARED_CALENDARS_FETCH_ERROR",
          uid: user?.uid,
        });
      }
    };

    fetchSharedCalendars();

    const channel = supabase
      .channel(`realtime:shared_calendars:${user.uid}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_calendars',
          filter: `receiver_uid=eq.${user.uid}`,
        },
        () => fetchSharedCalendars()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [authReady, currentUser, setSharedCalendarsData, setLoadingStates]);
};


