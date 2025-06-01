import { useEffect, useRef } from "react";
import { analyticsPromise } from "../services/firebase";
import { log } from "../utils/logger";
import { logEvent } from "firebase/analytics";
import { supabase } from "../services/supabaseClient";

const API_URL = import.meta.env.VITE_API_URL;

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