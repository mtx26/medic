import { useEffect, useRef, useContext } from "react";
import { supabase } from "../services/supabaseClient";
import { UserContext } from "../contexts/UserContext";
import { log } from "../utils/logger";
import { analyticsPromise } from "../services/firebase";
import { logEvent } from "firebase/analytics";

const API_URL = import.meta.env.VITE_API_URL;

const fetchBoxes = async ({ uid, calendarId, setBoxes, setLoadingBoxes, sourceType }) => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw new Error("Session Supabase non trouvée");

    const endpoint =
      sourceType === "personal"
        ? `${API_URL}/api/calendars/${calendarId}/boxes`
        : `${API_URL}/api/shared/users/calendars/${calendarId}/boxes`;

    const res = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    const sorted = data.boxes.sort((a, b) => a.name.localeCompare(b.name));
    setBoxes(sorted);
    setLoadingBoxes(true);

    const eventName =
      sourceType === "personal"
        ? "fetch_personal_calendar_medicine_boxes"
        : "fetch_shared_calendar_medicine_boxes";

    const logOrigin =
      sourceType === "personal"
        ? "REALTIME_PERSONAL_CALENDAR_MEDICINE_BOXES_SUCCESS"
        : "REALTIME_SHARED_CALENDAR_MEDICINE_BOXES_SUCCESS";

    analyticsPromise.then((analytics) => {
      if (analytics) {
        logEvent(analytics, eventName, {
          uid,
          count: data.boxes.length,
          calendarId,
        });
      }
    });

    log.info(data.message, {
      origin: logOrigin,
      uid,
      count: data.boxes.length,
      calendarId,
    });
  } catch (err) {
    const errorOrigin =
      sourceType === "personal"
        ? "PERSONAL_CALENDAR_MEDICINE_BOXES_FETCH_ERROR"
        : "SHARED_CALENDAR_MEDICINE_BOXES_FETCH_ERROR";

    log.error(
      err.message || "Erreur de récupération des boîtes de médicaments",
      err,
      {
        origin: errorOrigin,
        calendarId,
      }
    );
  }
};

const useRealtimeBoxes = (sourceType, calendarId, setBoxes, setLoadingBoxes) => {
  const { userInfo } = useContext(UserContext);
  const channelRef = useRef(null);

  useEffect(() => {
    if (!userInfo || !calendarId) {
      setLoadingBoxes(undefined);
      return;
    }

    const uid = userInfo.uid;
    fetchBoxes({ uid, calendarId, setBoxes, setLoadingBoxes, sourceType });

    const baseChannel = sourceType === "personal" ? "personal-meds" : "shared-meds";
    const deleteChannel = sourceType === "personal" ? "delete-personal-meds" : "delete-shared-meds";

    const channel = supabase
      .channel(`${baseChannel}-${calendarId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "medicine_boxes",
          filter: `calendar_id=eq.${calendarId}`,
        },
        () => fetchBoxes({ uid, calendarId, setBoxes, setLoadingBoxes, sourceType })
      )
      .subscribe();

    const deletion = supabase
      .channel(`${deleteChannel}-${calendarId}`)
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "medicine_boxes",
        },
        () => fetchBoxes({ uid, calendarId, setBoxes, setLoadingBoxes, sourceType })
      )
      .subscribe();

    channelRef.current = { channel, deletion };

    return () => {
      try {
        channel.unsubscribe();
        deletion.unsubscribe();
        channelRef.current = null;
      } catch (err) {
        log.error("Erreur lors de la désinscription des canaux Supabase", {
          error: err,
          origin: "REALTIME_MEDICINE_BOXES_CLEANUP_ERROR",
        });
      }
    };
  }, [userInfo, calendarId, sourceType]);
};

export const useRealtimePersonalBoxes = (calendarId, setBoxes, setLoadingBoxes) => {
  useRealtimeBoxes("personal", calendarId, setBoxes, setLoadingBoxes);
};

export const useRealtimeSharedBoxes = (calendarId, setBoxes, setLoadingBoxes) => {
  useRealtimeBoxes("shared", calendarId, setBoxes, setLoadingBoxes);
};
