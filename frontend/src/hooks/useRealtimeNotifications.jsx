import { useContext, useEffect, useRef } from 'react';
import { UserContext } from '../contexts/UserContext';
import { auth, db, analytics } from '../services/firebase';
import { onSnapshot, query, collection, orderBy } from 'firebase/firestore';
import { log } from '../utils/logger';
import { logEvent } from 'firebase/analytics';

const API_URL = import.meta.env.VITE_API_URL;

export const useRealtimeNotifications = (setNotificationsData, setLoadingStates) => {
	const { currentUser, authReady } = useContext(UserContext);
	const timeoutRef = useRef(null);
	const unsubscribeRef = useRef(null);

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

		unsubscribeRef.current = onSnapshot(q, async () => {
			try {
				clearTimeout(timeoutRef.current);
				timeoutRef.current = setTimeout(async () => {
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
				}, 10000);
			} catch (err) {
				log.error(err.message || "Échec de récupération des notifications enrichies", err, {
					origin: "NOTIFICATIONS_FETCH_ERROR",
					uid: user?.uid,
				});
			}
		});

		return () => {
			if (unsubscribeRef.current) unsubscribeRef.current();
			clearTimeout(timeoutRef.current);
		};
	}, [authReady, currentUser, setNotificationsData, setLoadingStates]);
};
