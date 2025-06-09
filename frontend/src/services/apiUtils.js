import { getToken } from './tokenUtils.js';
import { analyticsPromise } from './firebase';
import { log } from '../utils/logger';
import { logEvent } from 'firebase/analytics';

export async function performApiCall({
  url,
  method = 'GET',
  body = null,
  origin,
  uid = null,
  analyticsEvent = null,
  analyticsData = {},
}) {
  try {
    const token = await getToken();
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    };

    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error);

    // Analytics
    if (analyticsEvent) {
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, analyticsEvent, { ...analyticsData });
        }
      });
    }

    // Log de succès
    log.info(data.message, { origin, uid, ...analyticsData });

    return { success: true, ...data };
  } catch (err) {
    log.error(err.message || 'Erreur API', err, { origin, uid, ...analyticsData });
    return { success: false, error: err.message, code: err.code || null };
  }
}
