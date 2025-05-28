import { useEffect, useRef, useContext } from "react";
import { auth, analyticsPromise } from "../services/firebase";
import { supabase } from "../services/supabaseClient";
import { UserContext } from "../contexts/UserContext";
import { logEvent } from "firebase/analytics";
import { log } from "../utils/logger";

const API_URL = import.meta.env.VITE_API_URL;

const fetchPersonalBoxes = async (user, calendarId, setBoxes, setLoadingBoxes) => {
  try {
    const token = await user.getIdToken();
    const res = await fetch(`${API_URL}/api/calendars/${calendarId}/boxes`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const sorted = data.boxes.sort((a, b) => a.name.localeCompare(b.name));
    setBoxes(sorted);
    setLoadingBoxes(true);

    analyticsPromise.then((analytics) => {
      if (analytics) {
        logEvent(analytics, "fetch_personal_calendar_medicine_boxes", {
          uid: user.uid,
          count: data.boxes.length,
          calendarId,
        });
      }
    });

    log.info(data.message, {
      origin: "REALTIME_PERSONAL_CALENDAR_MEDICINE_BOXES_SUCCESS",
      uid: user.uid,
      count: data.boxes.length,
      calendarId,
    });
  } catch (err) {
    log.error(err.message || "Erreur de récupération des boîtes de médicaments", err, {
      origin: "PERSONAL_CALENDAR_MEDICINE_BOXES_FETCH_ERROR",
      calendarId,
    });
  }
};

const fetchSharedBoxes = async (user, calendarId, setBoxes, setLoadingBoxes) => {
  try {
    const token = await user.getIdToken();
    const res = await fetch(`${API_URL}/api/shared/users/calendars/${calendarId}/boxes`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const sorted = data.boxes.sort((a, b) => a.name.localeCompare(b.name));
    setBoxes(sorted);
    setLoadingBoxes(true);

    analyticsPromise.then((analytics) => {
      if (analytics) {
        logEvent(analytics, "fetch_shared_calendar_medicine_boxes", {
          uid: user.uid,
          count: data.boxes.length,
          calendarId,
        });
      }
    });

    log.info(data.message, {
      origin: "REALTIME_SHARED_CALENDAR_MEDICINE_BOXES_SUCCESS",
      uid: user.uid,
      count: data.boxes.length,
      calendarId,
    });
  } catch (err) {
    log.error(err.message || "Erreur de récupération des boîtes de médicaments partagées", err, {
      origin: "SHARED_CALENDAR_MEDICINE_BOXES_FETCH_ERROR",
      calendarId,
    });
  }
};

export const useRealtimePersonalBoxes = (calendarId, setBoxes, setLoadingBoxes) => {
  const { userInfo } = useContext(UserContext);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!userInfo || !calendarId) {
      setLoadingBoxes(undefined);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setLoadingBoxes(undefined);
      return;
    }

    fetchPersonalBoxes(user, calendarId, setBoxes, setLoadingBoxes);

    const channel = supabase
      .channel(`personal-meds-${calendarId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "medicine_boxes",
          filter: `calendar_id=eq.${calendarId}`,
        },
        () => {
          fetchPersonalBoxes(user, calendarId, setBoxes, setLoadingBoxes);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [userInfo, calendarId]);
};

export const useRealtimeSharedBoxes = (calendarId, setBoxes, setLoadingBoxes) => {
  const { userInfo } = useContext(UserContext);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!userInfo || !calendarId) {
      setLoadingBoxes(undefined);
      return;
    }

    const user = auth.currentUser;
    if (!user) {
      setLoadingBoxes(undefined);
      return;
    }

    fetchSharedBoxes(user, calendarId, setBoxes, setLoadingBoxes);

    const channel = supabase
      .channel(`shared-meds-${calendarId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "medicine_boxes",
          filter: `calendar_id=eq.${calendarId}`,
        },
        () => {
          fetchSharedBoxes(user, calendarId, setBoxes, setLoadingBoxes);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [userInfo, calendarId]);
};

