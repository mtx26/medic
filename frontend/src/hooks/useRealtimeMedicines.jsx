import { useEffect, useContext, useRef } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { auth, db, analytics } from "../services/firebase";
import { UserContext } from "../contexts/UserContext";
import { log } from "../utils/logger";
import { logEvent } from "firebase/analytics";

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

    logEvent(analytics, 'fetch_personal_calendar_medicines', {
      uid: user.uid,
      count: data.medicines.length,
      calendarId,
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

    logEvent(analytics, "fetch_token_calendar_medicines", {
      count: data.medicines.length,
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

    logEvent(analytics, "fetch_shared_user_calendar_medicines", {
      uid: user.uid,
      count: data.medicines.length,
      calendarId,
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

const listenWithDelay = (ref, delay, callback) => {
  const timeoutRef = { current: null };

  const unsubscribe = onSnapshot(ref, () => {
    clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(callback, delay);
  });

  return { unsubscribe, timeoutRef };
};

export const useRealtimePersonalMedicines = (
  calendarId,
  setMedicinesData,
  setOriginalMedicinesData,
  setLoadingMedicines
) => {
  const { currentUser, authReady } = useContext(UserContext);
  const timeoutRef = useRef(null);
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!authReady || !currentUser || !calendarId) {
      setLoadingMedicines(undefined);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setLoadingMedicines(undefined);
      return;
    }

    const medRef = collection(db, "users", user.uid, "calendars", calendarId, "medicines");

    const { unsubscribe, timeoutRef: tRef } = listenWithDelay(
      medRef,
      250,
      () => fetchPersonalMedicines(user, calendarId, setMedicinesData, setOriginalMedicinesData, setLoadingMedicines)
    );
    unsubscribeRef.current = unsubscribe;
    timeoutRef.current = tRef.current;

    return () => {
      if (unsubscribeRef.current) unsubscribeRef.current();
      clearTimeout(timeoutRef.current);
    };
  }, [authReady, currentUser, calendarId, setMedicinesData, setOriginalMedicinesData, setLoadingMedicines]);
};


export const useRealtimeTokenMedicines = (
  token,
  setMedicinesData,
  setLoadingMedicines
) => {
  const timeoutRef = useRef(null);
  const unsubscribeRef = useRef(null); // 🔧 pour clean up correct

  useEffect(() => {
    if (!token) return;
  
    const initListener = async () => {
      try {
        const res = await fetch(`${API_URL}/api/tokens/${token}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
  
        const medRef = collection(db, "users", data.owner_uid, "calendars", data.calendar_id, "medicines");
        const { unsubscribe, timeoutRef: tRef } = listenWithDelay(
          medRef,
          250,
          () => fetchTokenMedicines(token, setMedicinesData, setLoadingMedicines)
        );
        unsubscribeRef.current = unsubscribe;
        timeoutRef.current = tRef.current;
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
      if (unsubscribeRef.current) unsubscribeRef.current();
      clearTimeout(timeoutRef.current);
    };
  }, [token, setMedicinesData, setLoadingMedicines]);
  
};

  

export const useRealtimeSharedUserMedicines = (
  calendarId,
  setMedicinesData,
  setOriginalMedicinesData,
  setLoadingMedicines
) => {
  const { currentUser, authReady } = useContext(UserContext);
  const timeoutRef = useRef(null); // 🔧 manquant
  const unsubscribeRef = useRef(null);

  useEffect(() => {
    if (!calendarId || !authReady || !currentUser) {
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
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        const medRef = collection(
          db,
          "users",
          data.owner_uid,
          "calendars",
          calendarId,
          "medicines"
        );

        const { unsubscribe, timeoutRef: tRef } = listenWithDelay(
          medRef,
          250,
          () => fetchSharedUserMedicines(user, calendarId, setMedicinesData, setOriginalMedicinesData, setLoadingMedicines)
        );
        unsubscribeRef.current = unsubscribe;
        timeoutRef.current = tRef.current;
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
      if (unsubscribeRef.current) unsubscribeRef.current();
      clearTimeout(timeoutRef.current);
    };
  }, [calendarId, authReady, currentUser, setMedicinesData, setOriginalMedicinesData, setLoadingMedicines]);
};
