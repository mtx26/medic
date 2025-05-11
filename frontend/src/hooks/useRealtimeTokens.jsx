import { useContext, useEffect } from 'react';
import { UserContext } from '../contexts/UserContext';
import { auth, db, analytics } from '../services/firebase';
import { onSnapshot, query, where, collection } from 'firebase/firestore';
import { log } from '../utils/logger';
import { logEvent } from 'firebase/analytics';

const API_URL = import.meta.env.VITE_API_URL;

export const useRealtimeTokens = (setTokensList, setLoadingStates) => { 
	const { currentUser, authReady } = useContext(UserContext);

	useEffect(() => {
		if (!(authReady && currentUser)) {
			setLoadingStates(prev => ({ ...prev, tokens: false }));
			return;
		}

		const user = auth.currentUser;
		if (!user) {
			setLoadingStates(prev => ({ ...prev, tokens: false }));
			return;
		}

		const q = query(
			collection(db, "shared_tokens"),
			where("owner_uid", "==", user.uid)
		);

		const unsubscribe = onSnapshot(q, async () => {
			try {
				const token = await user.getIdToken();
				const res = await fetch(`${API_URL}/api/tokens`, {
					method: "GET",
					headers: { Authorization: `Bearer ${token}` },
				});
				const data = await res.json();
				if (!res.ok) throw new Error(data.error);
				setTokensList(data.tokens);
				setLoadingStates(prev => ({ ...prev, tokens: false }));
				logEvent(analytics, 'fetch_tokens', {
					uid: user.uid,
					count: data.tokens?.length,
				});
				log.info(data.message, {
					origin: "TOKENS_FETCH_SUCCESS",
					uid: user.uid,
					count: data.tokens.length,
				});
			} catch (err) {
				log.error(err.message || "Échec de récupération des tokens", err, {
					origin: "TOKENS_FETCH_ERROR",
					uid: user?.uid,
				});
			}
		});
		
		return () => unsubscribe();
	}, [authReady, currentUser, setTokensList, setLoadingStates]);
}