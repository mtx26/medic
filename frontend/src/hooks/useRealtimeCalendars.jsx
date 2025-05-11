import { useEffect, useContext, useRef } from "react";
import { auth, db, analytics } from "../services/firebase";
import { onSnapshot, collection } from "firebase/firestore";
import { log } from "../utils/logger";
import { UserContext } from '../contexts/UserContext';
import { logEvent } from "firebase/analytics";

const API_URL = import.meta.env.VITE_API_URL;

export const useRealtimeCalendars = (setCalendarsData, setLoadingStates) => { 
  const { currentUser, authReady } = useContext(UserContext);
  const timeoutRef = useRef(null);
  const unsubscribeRef = useRef(null);

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

    const calendarsRef = collection(db, "users", user.uid, "calendars");

    unsubscribeRef.current = onSnapshot(calendarsRef, async () => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
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
            a.calendar_name.localeCompare(b.calendar_name)
          );
          setCalendarsData(sortedCalendars);
          setLoadingStates(prev => ({ ...prev, calendars: false }));

          logEvent(analytics, 'fetch_calendars', {
            uid: user.uid,
            count: data.calendars?.length,
          });
          log.info(data.message, {
            origin: "CALENDARS_REALTIME_UPDATE",
            uid: user.uid,
            count: data.calendars?.length,
          });
        } catch (err) {
          setLoadingStates(prev => ({ ...prev, calendars: true }));
          log.error(err.message || "Échec de mise à jour en temps réel des calendriers", err, {
            origin: "CALENDARS_REALTIME_ERROR",
            uid: user?.uid,
          });
        }
      }, 10000);
    });

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      clearTimeout(timeoutRef.current);
    };

  }, [authReady, currentUser, setCalendarsData, setLoadingStates]);
}


export const useRealtimeSharedCalendars = (setSharedCalendarsData, setLoadingStates) => {
  const { currentUser, authReady } = useContext(UserContext);
  const timeoutRef = useRef(null);
  const unsubscribeRef = useRef(null);

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

    const q = collection(db, "users", user.uid, "shared_calendars");

    unsubscribeRef.current = onSnapshot(q, async () => {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(async () => {
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
          setLoadingStates(prev => ({ ...prev, sharedCalendars: true }));
          log.error(err.message || "Échec de récupération des calendriers partagés", err, {
            origin: "SHARED_CALENDARS_FETCH_ERROR",
            uid: user?.uid,
          });
        }
      }, 10000);
    });

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      clearTimeout(timeoutRef.current);
    };
  }, [authReady, currentUser, setSharedCalendarsData, setLoadingStates]);
}

