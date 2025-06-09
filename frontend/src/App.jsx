// App.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/Header';
import Footer from './components/Footer';
import AppRoutes from './routes/AppRouter';
import { log } from './utils/logger';
import {
  analyticsPromise,
  requestPermissionAndGetToken,
} from './services/firebase';
import { supabase } from './services/supabaseClient';
import { logEvent } from 'firebase/analytics';
import { UserContext } from './contexts/UserContext';
import { formatToLocalISODate } from './utils/dateUtils';
import RealtimeManager from './components/RealtimeManager';

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [tokensList, setTokensList] = useState([]);
  const [calendarsData, setCalendarsData] = useState(null);
  const [notificationsData, setNotificationsData] = useState(null);
  const [sharedCalendarsData, setSharedCalendarsData] = useState(null);

  const { userInfo } = useContext(UserContext);

  const [loadingStates, setLoadingStates] = useState({
    calendars: true,
    sharedCalendars: true,
    tokens: true,
    notifications: true,
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const isLoading = Object.values(loadingStates).some((v) => v);
    setIsInitialLoading(isLoading);
  }, [loadingStates]);

  // Fonction pour ajouter un calendrier
  const addCalendar = useCallback(async (calendarName) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/api/calendars`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ calendarName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'add_calendar', {
            calendarName: calendarName,
            uid: userInfo.uid,
          });
        }
      });
      log.info(data.message, {
        origin: 'CALENDAR_CREATE_SUCCESS',
        uid: userInfo.uid,
        calendarName: calendarName,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(
        err.message || 'Erreur lors de la création du calendrier',
        err,
        {
          origin: 'CALENDAR_CREATE_ERROR',
          uid: userInfo.uid,
          calendarName: calendarName,
        }
      );
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  // Fonction pour supprimer un calendrier
  const deleteCalendar = useCallback(async (calendarId) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/api/calendars`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ calendarId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'delete_calendar', {
            calendarId: calendarId,
            uid: userInfo.uid,
          });
        }
      });
      log.info(data.message, {
        origin: 'CALENDAR_DELETE_SUCCESS',
        uid: userInfo.uid,
        calendarId: calendarId,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(
        err.message || 'Erreur lors de la suppression du calendrier',
        err,
        {
          origin: 'CALENDAR_DELETE_ERROR',
          uid: userInfo.uid,
          calendarId: calendarId,
        }
      );
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  // Fonction pour renommer un calendrier
  const renameCalendar = useCallback(async (calendarId, newCalendarName) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/api/calendars`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ calendarId, newCalendarName }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error);
      }
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'rename_calendar', {
            calendarId: calendarId,
            uid: userInfo.uid,
            newCalendarName: newCalendarName,
          });
        }
      });
      log.info(data.message, {
        origin: 'CALENDAR_RENAME_SUCCESS',
        uid: userInfo.uid,
        calendarId: calendarId,
        newCalendarName: newCalendarName,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(err.message || 'Erreur lors du renommage du calendrier', err, {
        origin: 'CALENDAR_RENAME_ERROR',
        uid: userInfo.uid,
        calendarId: calendarId,
        newCalendarName: newCalendarName,
      });
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  // Fonction pour obtenir le nombre de médicaments d'un calendrier
  const fetchPersonalCalendarMedicineCount = useCallback(async (calendarId) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${API_URL}/api/medicines/count?calendarId=${calendarId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'fetch_personal_calendar_medicine_count', {
            calendarId: calendarId,
            uid: userInfo.uid,
            count: data.count,
          });
        }
      });
      log.info(data.message, {
        origin: 'MED_COUNT_SUCCESS',
        uid: userInfo.uid,
        calendarId: calendarId,
        count: data.count,
      });
      return { success: true, count: data.count };
    } catch (err) {
      log.error(
        err.message ||
          'Erreur lors de la récupération du nombre de médicaments',
        err,
        {
          origin: 'MED_COUNT_ERROR',
          uid: userInfo.uid,
          calendarId: calendarId,
        }
      );
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  // Fonction pour obtenir le nombre de médicaments d'un calendrier partagé
  const fetchSharedUserCalendarMedicineCount = useCallback(
    async (calendarId, ownerUid) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch(
          `${API_URL}/api/medicines/shared/count?calendarId=${calendarId}&ownerUid=${ownerUid}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        analyticsPromise.then((analytics) => {
          if (analytics) {
            logEvent(analytics, 'fetch_shared_user_calendar_medicine_count', {
              calendarId: calendarId,
              uid: userInfo.uid,
              count: data.count,
            });
          }
        });
        log.info(data.message, {
          origin: 'MED_SHARED_COUNT_SUCCESS',
          uid: userInfo.uid,
          calendarId: calendarId,
          ownerUid: ownerUid,
          count: data.count,
        });
        return { success: true, count: data.count };
      } catch (err) {
        log.error(
          err.message ||
            'Erreur lors de la récupération du nombre de médicaments partagé',
          err,
          {
            origin: 'MED_SHARED_COUNT_ERROR',
            uid: userInfo.uid,
            calendarId: calendarId,
            ownerUid: ownerUid,
          }
        );
        return { success: false, error: err.message, code: err.code };
      }
    },
    []
  );

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour obtenir le calendrier lier au calendarId
  const fetchPersonalCalendarSchedule = useCallback(
    async (calendarId, startDate = null) => {
      try {
        if (!startDate) {
          startDate = formatToLocalISODate(new Date());
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch(
          `${API_URL}/api/calendars/${calendarId}/schedule?startTime=${startDate}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        analyticsPromise.then((analytics) => {
          if (analytics) {
            logEvent(analytics, 'fetch_personal_calendar_schedule', {
              calendarId: calendarId,
              uid: userInfo.uid,
              count: data.count,
            });
          }
        });

        log.info(data.message, {
          origin: 'CALENDAR_FETCH_SUCCESS',
          uid: userInfo?.uid,
          eventCount: data.schedule?.length,
          calendarId: calendarId,
        });
        return {
          success: true,
          message: data.message,
          code: data.code,
          schedule: data.schedule,
          calendarName: data.calendar_name,
          table: data.table,
        };
      } catch (err) {
        log.error(
          err.message || 'Erreur lors de la récupération du calendrier',
          err,
          {
            origin: 'CALENDAR_FETCH_ERROR',
            uid: userInfo?.uid,
            calendarId: calendarId,
            startDate: startDate,
          }
        );
        return {
          success: false,
          error: err.message,
          code: err.code,
          schedule: [],
          calendarName: '',
          table: {},
        };
      }
    },
    []
  );

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour modifier la boîte d'un calendrier personnel
  const updatePersonalBox = useCallback(async (calendarId, boxId, box) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${API_URL}/api/calendars/${calendarId}/boxes/${boxId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(box),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'update_personal_box', {
            calendarId: calendarId,
            uid: userInfo.uid,
          });
        }
      });
      log.info(data.message, {
        origin: 'BOX_UPDATE_SUCCESS',
        uid: userInfo.uid,
        calendarId: calendarId,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(
        err.message || 'Erreur lors de la modification de la boîte',
        err,
        {
          origin: 'BOX_UPDATE_ERROR',
          uid: userInfo.uid,
          calendarId: calendarId,
        }
      );
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  // Fonction pour créer une boîte de médicaments
  const createPersonalBox = useCallback(
    async (
      calendarId,
      name,
      boxCapacity = 0,
      stockAlertThreshold = 10,
      stockQuantity = 0
    ) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch(
          `${API_URL}/api/calendars/${calendarId}/boxes`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({
              name: name,
              box_capacity: boxCapacity,
              stock_alert_threshold: stockAlertThreshold,
              stock_quantity: stockQuantity,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        analyticsPromise.then((analytics) => {
          if (analytics) {
            logEvent(analytics, 'create_personal_box', {
              calendarId: calendarId,
              uid: userInfo.uid,
            });
          }
        });
        log.info(data.message, {
          origin: 'BOX_CREATE_SUCCESS',
          uid: userInfo.uid,
          calendarId: calendarId,
        });
        return {
          success: true,
          boxId: data.box_id,
          message: data.message,
          code: data.code,
        };
      } catch (err) {
        log.error(
          err.message || 'Erreur lors de la création de la boîte',
          err,
          {
            origin: 'BOX_CREATE_ERROR',
            uid: userInfo.uid,
            calendarId: calendarId,
          }
        );
        return { success: false, error: err.message, code: err.code };
      }
    },
    []
  );

  // Fonction pour supprimer une boîte
  const deletePersonalBox = useCallback(async (calendarId, boxId) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${API_URL}/api/calendars/${calendarId}/boxes/${boxId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'delete_personal_box', {
            calendarId: calendarId,
            uid: userInfo.uid,
          });
        }
      });
      log.info(data.message, {
        origin: 'BOX_DELETE_SUCCESS',
        uid: userInfo.uid,
        calendarId: calendarId,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(
        err.message || 'Erreur lors de la suppression de la boîte',
        err,
        {
          origin: 'BOX_DELETE_ERROR',
          uid: userInfo.uid,
          calendarId: calendarId,
        }
      );
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour recupérer un calendrier partagé par un token
  const fetchTokenCalendarSchedule = useCallback(
    async (token, startDate = null) => {
      try {
        if (!startDate) {
          startDate = formatToLocalISODate(new Date());
        }

        const res = await fetch(
          `${API_URL}/api/tokens/${token}/schedule?startTime=${startDate}`,
          {
            method: 'GET',
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);

        analyticsPromise.then((analytics) => {
          if (analytics) {
            logEvent(analytics, 'fetch_token_calendar_schedule', {
              token: token,
              count: data.schedule?.length,
            });
          }
        });
        log.info(data.message, {
          origin: 'SHARED_CALENDAR_FETCH_SUCCESS',
          token: token,
          eventCount: data.schedule?.length,
        });
        return {
          success: true,
          message: data.message,
          code: data.code,
          schedule: data.schedule,
          calendarName: data.calendar_name,
          table: data.table,
        };
      } catch (err) {
        log.error(
          err.message || 'Échec de récupération du calendrier partagé',
          err,
          {
            origin: 'SHARED_CALENDAR_FETCH_ERROR',
            token: token,
          }
        );
        return {
          success: false,
          error: err.message,
          code: err.code,
          schedule: [],
          calendarName: '',
          table: {},
        };
      }
    },
    []
  );

  // Fonction pour créer un lien de partage
  const createToken = useCallback(
    async (calendarId, expiresAt, permissions) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch(`${API_URL}/api/tokens/${calendarId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ expiresAt, permissions }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        analyticsPromise.then((analytics) => {
          if (analytics) {
            logEvent(analytics, 'create_token', {
              calendarId: calendarId,
              token: data.token,
            });
          }
        });
        log.info(data.message, {
          origin: 'SHARED_CALENDAR_CREATE_SUCCESS',
          calendarId: calendarId,
          token: data.token,
        });
        return {
          success: true,
          token: data.token,
          message: data.message,
          code: data.code,
        };
      } catch (err) {
        log.error(err.message || 'Échec de création du lien de partage', err, {
          origin: 'SHARED_CALENDAR_CREATE_ERROR',
          calendarId: calendarId,
        });
        return {
          success: false,
          token: null,
          error: err.message,
          code: err.code,
        };
      }
    },
    []
  );

  // Fonction pour supprimer un lien de partage
  const deleteToken = useCallback(async (token) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/api/tokens/${token}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'delete_token', {
            token: token,
            uid: userInfo.uid,
          });
        }
      });
      log.info(data.message, {
        origin: 'SHARED_CALENDAR_DELETE_SUCCESS',
        uid: userInfo.uid,
        token: token,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(err.message || 'Échec de suppression du lien de partage', err, {
        origin: 'SHARED_CALENDAR_DELETE_ERROR',
        uid: userInfo.uid,
        token: token,
      });
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  // Fonction pour revoker un token
  const updateRevokeToken = useCallback(async (token) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/api/tokens/revoke/${token}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'update_revoke_token', {
            token: token,
            uid: userInfo.uid,
          });
        }
      });
      log.info(data.message, {
        origin: 'TOKEN_REVOKE_SUCCESS',
        token: token,
        uid: userInfo.uid,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(err.message || 'Échec de révoquer le token', err, {
        origin: 'TOKEN_REVOKE_ERROR',
        token: token,
        uid: userInfo.uid,
      });
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  // Fonction pour mettre à jour l'expiration d'un token
  const updateTokenExpiration = useCallback(async (token, expiresAt) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/api/tokens/expiration/${token}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ expiresAt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'update_token_expiration', {
            token: token,
            uid: userInfo.uid,
            expiresAt: expiresAt,
          });
        }
      });
      log.info('Expiration du token mise à jour avec succès', {
        origin: 'TOKEN_EXPIRATION_UPDATE_SUCCESS',
        token: token,
        expiresAt: expiresAt,
        uid: userInfo.uid,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(
        err.message || "Échec de mise à jour de l'expiration du token",
        err,
        {
          origin: 'TOKEN_EXPIRATION_UPDATE_ERROR',
          token: token,
          uid: userInfo.uid,
        }
      );
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  // Fonction pour mettre à jour les permissions d'un token
  const updateTokenPermissions = useCallback(async (token, permissions) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/api/tokens/permissions/${token}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ permissions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'update_token_permissions', {
            token: token,
            uid: userInfo.uid,
            permissions: permissions,
          });
        }
      });
      log.info(data.message, {
        origin: 'TOKEN_PERMISSIONS_UPDATE_SUCCESS',
        token: token,
        permissions: permissions,
        uid: userInfo.uid,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(
        err.message || 'Erreur lors de la mise à jour des permissions du token',
        err,
        {
          origin: 'TOKEN_PERMISSIONS_UPDATE_ERROR',
          token: token,
          uid: userInfo.uid,
        }
      );
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour envoyer une invitation à un utilisateur
  const sendInvitation = useCallback(async (email, calendarId) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(`${API_URL}/api/invitations/send/${calendarId}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'send_invitation', {
            email: email,
            uid: userInfo.uid,
            calendarId: calendarId,
          });
        }
      });
      log.info(data.message, {
        origin: 'INVITATION_SEND_SUCCESS',
        email,
        calendarId,
        uid: userInfo.uid,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(err.message || "Échec d'envoi de l'invitation", err, {
        origin: 'INVITATION_SEND_ERROR',
        email,
        calendarId,
        uid: userInfo.uid,
      });
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  // Fonction pour accepter une invitation
  const acceptInvitation = useCallback(async (notificationId) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${API_URL}/api/invitations/accept/${notificationId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'accept_invitation', {
            notificationId: notificationId,
            uid: userInfo.uid,
          });
        }
      });
      log.info(data.message, {
        origin: 'INVITATION_ACCEPT_SUCCESS',
        notificationId,
        uid: userInfo.uid,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(err.message || "Échec d'acceptation de l'invitation", err, {
        origin: 'INVITATION_ACCEPT_ERROR',
        notificationId,
        uid: userInfo.uid,
      });
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  // Fonction pour rejeter une invitation
  const rejectInvitation = useCallback(async (notificationId) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${API_URL}/api/invitations/reject/${notificationId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'reject_invitation', {
            notificationId: notificationId,
            uid: userInfo.uid,
          });
        }
      });
      log.info(data.message, {
        origin: 'INVITATION_REJECT_SUCCESS',
        notificationId,
        uid: userInfo.uid,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(err.message || "Échec de rejet de l'invitation", err, {
        origin: 'INVITATION_REJECT_ERROR',
        notificationId,
        uid: userInfo.uid,
      });
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  // Fonction pour marquer une notification comme lue
  const readNotification = useCallback(async (notificationId) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${API_URL}/api/notifications/${notificationId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'read_notification', {
            notificationId: notificationId,
            uid: userInfo.uid,
          });
        }
      });
      log.info(data.message, {
        origin: 'NOTIFICATION_READ_SUCCESS',
        notificationId,
        uid: userInfo.uid,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(
        err.message || 'Échec de marquer la notification comme lue',
        err,
        {
          origin: 'NOTIFICATION_READ_ERROR',
          notificationId,
          uid: userInfo.uid,
        }
      );
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour supprimer un calendrier partagé pour le receiver
  const deleteSharedCalendar = useCallback(async (calendarId) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${API_URL}/api/shared/users/calendars/${calendarId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'delete_shared_calendar', {
            calendarId: calendarId,
            uid: userInfo.uid,
          });
        }
      });
      log.info(data.message, {
        origin: 'SHARED_CALENDAR_DELETE_SUCCESS',
        calendarId,
        uid: userInfo.uid,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(
        err.message || 'Échec de suppression du calendrier partagé',
        err,
        {
          origin: 'SHARED_CALENDAR_DELETE_ERROR',
          calendarId,
          uid: userInfo.uid,
        }
      );
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  // Fonction pour récupérer les différentes utilisateurs ayant accès à un calendrier
  const fetchSharedUsers = useCallback(async (calendarId) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${API_URL}/api/shared/users/users/${calendarId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'fetch_shared_users', {
            calendarId: calendarId,
            uid: userInfo.uid,
            count: data?.users?.length,
          });
        }
      });
      log.info(data.message, {
        origin: 'SHARED_USERS_FETCH_SUCCESS',
        count: data?.users?.length,
        calendarId,
        uid: userInfo.uid,
      });
      return {
        success: true,
        message: data.message,
        code: data.code,
        users: data.users,
      };
    } catch (err) {
      log.error(
        err.message || 'Échec de récupération des utilisateurs partagés',
        err,
        {
          origin: 'SHARED_USERS_FETCH_ERROR',
          calendarId,
          uid: userInfo.uid,
        }
      );
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  // Fonction pour supprimer un utilisateur partagé pour le owner
  const deleteSharedUser = useCallback(async (calendarId, userId) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${API_URL}/api/shared/users/${calendarId}/${userId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'delete_shared_user', {
            calendarId: calendarId,
            uid: userInfo.uid,
            userId: userId,
          });
        }
      });
      log.info(data.message, {
        origin: 'SHARED_USER_DELETE_SUCCESS',
        calendarId,
        userId,
        uid: userInfo.uid,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(
        err.message || "Échec de suppression de l'utilisateur partagé",
        err,
        {
          origin: 'SHARED_USER_DELETE_ERROR',
          calendarId,
          userId,
          uid: userInfo.uid,
        }
      );
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  // Fonction pour recup le calendrier partagé par un utilisateur
  const fetchSharedUserCalendarSchedule = useCallback(
    async (calendarId, startDate = null) => {
      try {
        if (!startDate) {
          startDate = formatToLocalISODate(new Date());
        }
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch(
          `${API_URL}/api/shared/users/calendars/${calendarId}/schedule?startTime=${startDate}`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
            },
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        analyticsPromise.then((analytics) => {
          if (analytics) {
            logEvent(analytics, 'fetch_shared_user_calendar_schedule', {
              calendarId: calendarId,
              uid: userInfo.uid,
              count: data.schedule?.length,
            });
          }
        });
        log.info(data.message, {
          origin: 'SHARED_USER_CALENDAR_FETCH_SUCCESS',
          calendarId,
          startDate,
          uid: userInfo.uid,
        });
        return {
          success: true,
          message: data.message,
          code: data.code,
          schedule: data.schedule,
          calendarName: data.calendar_name,
          table: data.table,
        };
      } catch (err) {
        log.error(
          err.message ||
            'Échec de récupération du calendrier partagé par un utilisateur',
          err,
          {
            origin: 'SHARED_USER_CALENDAR_FETCH_ERROR',
            calendarId,
            startDate,
            uid: userInfo.uid,
          }
        );
        return {
          success: false,
          error: err.message,
          code: err.code,
          schedule: [],
          calendarName: '',
          table: {},
        };
      }
    },
    []
  );

  // Fonction pour mettre à jour une boite de médicaments d'un calendrier partagé
  const updateSharedUserBox = useCallback(async (calendarId, boxId, box) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${API_URL}/api/shared/users/calendars/${calendarId}/boxes/${boxId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(box),
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'update_shared_user_box', {
            calendarId: calendarId,
            uid: userInfo.uid,
          });
        }
      });
      log.info(data.message, {
        origin: 'SHARED_BOX_UPDATE_SUCCESS',
        calendarId,
        uid: userInfo.uid,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(
        err.message ||
          'Échec de mise à jour de la boite de médicaments partagée',
        err,
        {
          origin: 'SHARED_BOX_UPDATE_ERROR',
          calendarId,
          boxId,
          uid: userInfo.uid,
        }
      );
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  // Fonction pour créer une boite de médicaments
  const createSharedUserBox = useCallback(
    async (
      calendarId,
      name,
      boxCapacity = 0,
      stockAlertThreshold = 10,
      stockQuantity = 0
    ) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        const res = await fetch(
          `${API_URL}/api/shared/users/calendars/${calendarId}/boxes`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: name,
              box_capacity: boxCapacity,
              stock_alert_threshold: stockAlertThreshold,
              stock_quantity: stockQuantity,
            }),
          }
        );
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        analyticsPromise.then((analytics) => {
          if (analytics) {
            logEvent(analytics, 'create_shared_user_box', {
              calendarId: calendarId,
              uid: userInfo.uid,
            });
          }
        });
        log.info(data.message, {
          origin: 'SHARED_BOX_CREATE_SUCCESS',
          calendarId,
          uid: userInfo.uid,
        });
        return {
          success: true,
          boxId: data.box_id,
          message: data.message,
          code: data.code,
        };
      } catch (err) {
        log.error(
          err.message || 'Échec de création de la boite de médicaments',
          err,
          {
            origin: 'SHARED_BOX_CREATE_ERROR',
            uid: userInfo.uid,
            calendarId: calendarId,
          }
        );
        return { success: false, error: err.message, code: err.code };
      }
    },
    []
  );

  // Fonction pour supprimer une boîte
  const deleteSharedUserBox = useCallback(async (calendarId, boxId) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const res = await fetch(
        `${API_URL}/api/shared/users/calendars/${calendarId}/boxes/${boxId}`,
        {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'delete_shared_user_box', {
            calendarId: calendarId,
            uid: userInfo.uid,
          });
        }
      });
      log.info(data.message, {
        origin: 'SHARED_BOX_DELETE_SUCCESS',
        calendarId,
        uid: userInfo.uid,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(
        err.message || 'Erreur lors de la suppression de la boîte',
        err,
        {
          origin: 'SHARED_BOX_DELETE_ERROR',
          uid: userInfo.uid,
          calendarId: calendarId,
        }
      );
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  const sharedProps = {
    personalCalendars: {
      fetchPersonalCalendarSchedule,
      fetchPersonalCalendarMedicineCount,
      addCalendar,
      renameCalendar,
      deleteCalendar,
      calendarsData,
      setCalendarsData,
      updatePersonalBox,
      createPersonalBox,
      deletePersonalBox,
    },

    sharedUserCalendars: {
      fetchSharedUserCalendarSchedule,
      fetchSharedUserCalendarMedicineCount,
      fetchSharedUsers,
      sendInvitation,
      acceptInvitation,
      rejectInvitation,
      deleteSharedUser,
      deleteSharedCalendar,
      sharedCalendarsData,
      setSharedCalendarsData,
      updateSharedUserBox,
      createSharedUserBox,
      deleteSharedUserBox,
    },

    tokenCalendars: {
      fetchTokenCalendarSchedule,
      createToken,
      updateTokenPermissions,
      updateTokenExpiration,
      updateRevokeToken,
      deleteToken,
      tokensList,
      setTokensList,
    },

    notifications: {
      readNotification,
      notificationsData,
      setNotificationsData,
    },

    loadingStates: {
      isInitialLoading,
    },
  };

  const resetAppData = () => {
    // CALENDARS
    setCalendarsData(null);

    // TOKENS
    setTokensList([]);

    // NOTIFICATIONS
    setNotificationsData(null);

    // SHARED CALENDARS
    setSharedCalendarsData(null);
  };

  useEffect(() => {
    resetAppData();
    setLoadingStates((current) => ({
      ...current,
      calendars: false,
      sharedCalendars: false,
      notifications: false,
      tokens: false,
    }));
  }, [userInfo?.uid]);

  useEffect(() => {
    if (!userInfo?.uid) return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/firebase-messaging-sw.js')
        .then((registration) => {
          log.info('[FCM] SW enregistré :', registration, {
            origin: 'FCM_SW_REGISTER_SUCCESS',
          });
        })
        .catch((err) => {
          log.error('[FCM] Erreur SW :', err, {
            origin: 'FCM_SW_REGISTER_ERROR',
          });
        });
    }

    // 🔐 Demande de permission et envoi du token
    const sendTokenToBackend = async () => {
      const token = await requestPermissionAndGetToken(userInfo?.uid);
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!token || !userInfo?.uid) return;

      // 🎯 Envoi du token FCM au backend Flask
      fetch(`${API_URL}/api/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          token: token,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          log.info('[FCM] Token enregistré côté backend', {
            uid: userInfo.uid,
            token: token,
            origin: 'FCM_TOKEN_REGISTER_SUCCESS',
          });
        })
        .catch((error) => {
          log.error('[FCM] Erreur d’envoi du token', {
            uid: userInfo.uid,
            token: token,
            origin: 'FCM_TOKEN_REGISTER_ERROR',
            error: error,
          });
        });
    };

    sendTokenToBackend();
  }, [userInfo?.uid]);

  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Navbar sharedProps={sharedProps} />
        <main className="flex-grow-1 d-flex flex-column pb-5 pb-lg-0">
          {userInfo && (
            <RealtimeManager
              setCalendarsData={setCalendarsData}
              setSharedCalendarsData={setSharedCalendarsData}
              setNotificationsData={setNotificationsData}
              setTokensList={setTokensList}
              setLoadingStates={setLoadingStates}
            />
          )}

          <div className="container mt-4 pb-5 pb-lg-0">
            <AppRoutes sharedProps={sharedProps} />
          </div>
        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;
