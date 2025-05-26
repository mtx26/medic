import { useEffect, useContext, useRef } from "react";
import { auth, analyticsPromise } from "../services/firebase";
import { UserContext } from "../contexts/UserContext";
import { log } from "../utils/logger";
import { logEvent } from "firebase/analytics";
import { supabase } from "../services/supabaseClient";

const API_URL = import.meta.env.VITE_API_URL;

const fetchPersonalMedicines = async (user, calendarId, setMedicinesData, setOriginalMedicinesData, setLoadingMedicines) => {
  try {
    const token = await user.getIdToken();
    const res = await fetch(`${API_URL}/api/calendars/${calendarId}/medicines`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const sorted = data.medicines.sort((a, b) => a.name.localeCompare(b.name));
    setMedicinesData(sorted);
    setOriginalMedicinesData(JSON.parse(JSON.stringify(sorted)));
    setLoadingMedicines(true);

    analyticsPromise.then((analytics) => {
      if (analytics) {
        logEvent(analytics, 'fetch_personal_calendar_medicines', {
          uid: user.uid,
          count: data.medicines.length,
          calendarId,
        });
      }
    });
    log.info(data.message, {
      origin: "REALTIME_MEDICINES_SUCCESS",
      uid: user.uid,
      count: data.medicines.length,
      calendarId,
    });
  } catch (err) {
    setLoadingMedicines(false);
    log.error(err.message || "Erreur en récupérant les médicaments", err, {
      origin: "REALTIME_MEDICINES_ERROR",
      uid: user?.uid,
      calendarId,
    });
  }
};

const fetchTokenMedicines = async (token, setMedicinesData, setLoadingMedicines) => {
  try {
    const res = await fetch(`${API_URL}/api/tokens/${token}/medicines`);
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const sorted = data.medicines.sort((a, b) => a.name.localeCompare(b.name));
    setMedicinesData(sorted);
    setLoadingMedicines(true);

    analyticsPromise.then((analytics) => {
      if (analytics) {
        logEvent(analytics, "fetch_token_calendar_medicines", {
          count: data.medicines.length,
        });
      }
    });
    log.info(data.message, {
      origin: "REALTIME_TOKEN_MEDICINES_SUCCESS",
      token,
      count: data.medicines.length,
    });
  } catch (err) {
    setLoadingMedicines(false);
    log.error(err.message, err, {
      origin: "REALTIME_TOKEN_MEDICINES_FETCH_ERROR",
      token,
    });
  }
};

const fetchSharedUserMedicines = async (user, calendarId, setMedicinesData, setOriginalMedicinesData, setLoadingMedicines) => {
  try {
    const token = await user.getIdToken();
    const res = await fetch(`${API_URL}/api/shared/users/calendars/${calendarId}/medicines`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const sorted = data.medicines.sort((a, b) => a.name.localeCompare(b.name));
    setMedicinesData(sorted);
    setOriginalMedicinesData(JSON.parse(JSON.stringify(sorted)));
    setLoadingMedicines(true);

    analyticsPromise.then((analytics) => {
      if (analytics) {
        logEvent(analytics, "fetch_shared_user_calendar_medicines", {
          uid: user.uid,
          count: data.medicines.length,
          calendarId,
        });
      }
    });
    log.info(data.message, {
      origin: "REALTIME_SHARED_USER_MEDICINES_SUCCESS",
      uid: user.uid,
      calendarId,
      count: data.medicines.length,
    });
  } catch (err) {
    setLoadingMedicines(false);
    log.error(err.message, err, {
      origin: "REALTIME_SHARED_USER_MEDICINES_ERROR",
      calendarId,
      uid: user?.uid,
    });
  }
};

export const useRealtimePersonalMedicines = (
  calendarId,
  setMedicinesData,
  setOriginalMedicinesData,
  setLoadingMedicines
) => {
  const { userInfo } = useContext(UserContext);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!userInfo || !calendarId) {
      setLoadingMedicines(undefined);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setLoadingMedicines(undefined);
      return;
    }

    // Fetch initial
    fetchPersonalMedicines(user, calendarId, setMedicinesData, setOriginalMedicinesData, setLoadingMedicines);

    // Supabase realtime
    const channel = supabase
      .channel(`personal-meds-${calendarId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'medicines',
          filter: `calendar_id=eq.${calendarId}`,
        },
        () => {
          fetchPersonalMedicines(user, calendarId, setMedicinesData, setOriginalMedicinesData, setLoadingMedicines);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current && typeof channelRef.current.unsubscribe === "function") {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [userInfo, calendarId]);
};

export const useRealtimeTokenMedicines = (
  token,
  setMedicinesData,
  setLoadingMedicines
) => {
  const channelRef = useRef(null);

  useEffect(() => {
    if (!token) return;

    const initListener = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tokens/${token}`);
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const { calendar_id } = data;

        // Fetch initial
        await fetchTokenMedicines(token, setMedicinesData, setLoadingMedicines);

        // Supabase realtime
        const channel = supabase
          .channel(`token-meds-${calendar_id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'medicines',
              filter: `calendar_id=eq.${calendar_id}`,
            },
            () => {
              fetchTokenMedicines(token, setMedicinesData, setLoadingMedicines);
            }
          )
          .subscribe();

        channelRef.current = channel;
      } catch (err) {
        setLoadingMedicines(false);
        log.error(err.message, err, {
          origin: "REALTIME_TOKEN_INIT_ERROR",
          token,
        });
      }
    };

    initListener();

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
  }, [token]);
};

export const useRealtimeSharedUserMedicines = (
  calendarId,
  setMedicinesData,
  setOriginalMedicinesData,
  setLoadingMedicines
) => {
  const { userInfo } = useContext(UserContext);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!calendarId || !userInfo) {
      setLoadingMedicines(undefined);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setLoadingMedicines(undefined);
      return;
    }

    const initListener = async () => {
      try {
        const token = await user.getIdToken();
        const res = await fetch(`${API_URL}/api/shared/users/calendars/${calendarId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        // Fetch initial
        fetchSharedUserMedicines(user, calendarId, setMedicinesData, setOriginalMedicinesData, setLoadingMedicines);

        // Supabase realtime
        const channel = supabase
          .channel(`shared-user-meds-${calendarId}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'medicines',
              filter: `calendar_id=eq.${calendarId}`,
            },
            () => {
              fetchSharedUserMedicines(user, calendarId, setMedicinesData, setOriginalMedicinesData, setLoadingMedicines);
            }
          )
          .subscribe();

        channelRef.current = channel;
      } catch (err) {
        setLoadingMedicines(false);
        log.error(err.message, err, {
          origin: "REALTIME_SHARED_USER_MEDICINES_ERROR",
          calendarId,
          uid: user?.uid,
        });
      }
    };

    initListener();

    return () => {
      try { 
        if (channelRef.current && typeof channelRef.current.unsubscribe === "function") {
          channelRef.current.unsubscribe();
          channelRef.current = null;
        }
      } catch (err) {
        log.error(err.message, err, {
          origin: "REALTIME_SHARED_USER_MEDICINES_ERROR",
          calendarId,
          uid: user?.uid,
        });
      }
    };
  }, [calendarId, userInfo]);
};
