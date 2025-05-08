import { useEffect, useContext } from "react";
import { auth, db, analytics } from "../services/firebase";
import { onSnapshot, collection } from "firebase/firestore";
import { log } from "../utils/logger";
import { UserContext } from '../contexts/UserContext';
import { logEvent } from "firebase/analytics";

const API_URL = process.env.REACT_APP_API_URL;

export const useRealtimeCalendars = (setCalendarsData, setLoadingStates) => { 
	const { currentUser, authReady } = useContext(UserContext);

	useEffect(() => {
		if (!(authReady && currentUser)) return;
	
		const user = auth.currentUser;
		if (!user) return;
	
		const calendarsRef = collection(db, "users", user.uid, "calendars");
	
		const unsubscribe = onSnapshot(calendarsRef, async () => {
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
		});
		
		return () => unsubscribe();
	}, [authReady, currentUser, setCalendarsData, setLoadingStates]);
}

export const useRealtimeSharedCalendars = (setSharedCalendarsData, setLoadingStates) => {
	const { currentUser, authReady } = useContext(UserContext);

	useEffect(() => {
    if (!(authReady && currentUser)) return;
  
    const user = auth.currentUser;
    if (!user) return;
  
    const q = collection(db, "users", user.uid, "shared_calendars");
  
    const unsubscribe = onSnapshot(q, async () => {
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
    });
  
    return () => unsubscribe();
  }, [authReady, currentUser, setSharedCalendarsData, setLoadingStates]);
}
