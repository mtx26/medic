import { useContext, useEffect, useRef } from 'react';
import { UserContext } from '../contexts/UserContext';
import { auth, analytics } from '../services/firebase';
import { log } from '../utils/logger';
import { logEvent } from 'firebase/analytics';
import { supabase } from '../services/supabaseClient';

const API_URL = import.meta.env.VITE_API_URL;

export const useRealtimeTokens = (setTokensList, setLoadingStates) => { 
	const { currentUser, authReady } = useContext(UserContext);
	const channelRef = useRef(null);

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

		const fetchTokens = async () => {
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
				setLoadingStates(prev => ({ ...prev, tokens: false }));
				log.error(err.message || "Échec de récupération des tokens", err, {
					origin: "TOKENS_FETCH_ERROR",
					uid: user?.uid,
				});
			}
		};

		// 🔹 Fetch initial
		fetchTokens();

		// 🔹 Supabase Realtime : écoute de shared_tokens pour owner_uid
		const channel = supabase
			.channel(`tokens-${user.uid}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'shared_tokens',
					filter: `owner_uid=eq.${user.uid}`,
				},
				() => {
					fetchTokens();
				}
			)
			.subscribe();
		
		const deleteChannel = supabase
			.channel(`delete-tokens-${user.uid}`)
			.on(
				'postgres_changes',
				{
					event: 'DELETE',
					schema: 'public',
					table: 'shared_tokens',
				},
				() => {
					fetchTokens();
				}
			)
			.subscribe();

		channelRef.current = [channel, deleteChannel];

		return () => {
			if (channelRef.current && typeof channelRef.current.unsubscribe === "function") {
				channelRef.current.unsubscribe();
				channelRef.current = null;
			}
		};
	}, [authReady, currentUser, setTokensList, setLoadingStates]);
};
