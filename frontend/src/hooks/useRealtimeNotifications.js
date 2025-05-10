import { useContext, useEffect } from 'react';
import { UserContext } from '../contexts/UserContext';
import { auth, db, analytics } from '../services/firebase';
import { onSnapshot, query, collection, orderBy } from 'firebase/firestore';
import { log } from '../utils/logger';

const API_URL = process.env.REACT_APP_API_URL;

export const useRealtimeNotifications = (setNotificationsData, setLoadingStates) => {
	const { currentUser, authReady } = useContext(UserContext);

	useEffect(() => {
		if (!(authReady && currentUser)) {
			setLoadingStates(prev => ({ ...prev, notifications: false }));
			return;
		}
  
    const user = auth.currentUser;
    if (!user) {
			setLoadingStates(prev => ({ ...prev, notifications: false }));
			return;
		}
  
    const q = query(
      collection(db, "users", user.uid, "notifications"),
      orderBy("timestamp", "desc")
    );
  
    const unsubscribe = onSnapshot(q, async () => {
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
        log.info(data.message, {
          origin: "NOTIFICATIONS_FETCH_SUCCESS",
          uid: user.uid,
          count: data.notifications?.length,
        });
      } catch (err) {
        log.error(err.message || "Échec de récupération des notifications enrichies", err, {
          origin: "NOTIFICATIONS_FETCH_ERROR",
          uid: user?.uid,
        });
      }
    });
  
    return () => unsubscribe();
  }, [authReady, currentUser, setNotificationsData, setLoadingStates]);
}