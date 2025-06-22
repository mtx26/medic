// App.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/Header';
import Footer from './components/Footer';
import AppRoutes from './routes/AppRouter';
import { log } from './utils/logger';
import { requestPermissionAndGetToken } from './services/firebase';
import { UserContext } from './contexts/UserContext';
import { formatToLocalISODate } from './utils/dateUtils';
import RealtimeManager from './components/RealtimeManager';
import { getToken } from './services/tokenUtils';
import { performApiCall } from './services/apiUtils';

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [tokensList, setTokensList] = useState([]);
  const [calendarsData, setCalendarsData] = useState(null);
  const [notificationsData, setNotificationsData] = useState(null);
  const [sharedCalendarsData, setSharedCalendarsData] = useState(null);

  const { userInfo } = useContext(UserContext);
  const uid = userInfo?.uid ?? null;

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
    return await performApiCall({
      url: `${API_URL}/api/calendars`,
      method: 'POST',
      body: { calendarName },
      origin: 'CALENDAR_CREATE',
      uid,
      analyticsEvent: 'add_calendar',
      analyticsData: { calendarName, uid },
    });
  }, []);

  // Fonction pour supprimer un calendrier
  const deleteCalendar = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars`,
      method: 'DELETE',
      body: { calendarId },
      origin: 'CALENDAR_DELETE',
      uid,
      analyticsEvent: 'delete_calendar',
      analyticsData: { calendarId, uid },
    });
  }, []);
  

  // Fonction pour renommer un calendrier
  const renameCalendar = useCallback(async (calendarId, newCalendarName) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars`,
      method: 'PUT',
      body: { calendarId, newCalendarName },
      origin: 'CALENDAR_RENAME',
      uid,
      analyticsEvent: 'rename_calendar',
      analyticsData: {
        calendarId,
        newCalendarName,
        uid,
      },
    });
  }, []);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour obtenir le calendrier lier au calendarId
  const fetchPersonalCalendarSchedule = useCallback(async (calendarId, startDate = null) => {
    const start = startDate || formatToLocalISODate(new Date());

    const result = await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/schedule?startTime=${start}`,
      method: 'GET',
      origin: 'CALENDAR_FETCH',
      uid,
      analyticsEvent: 'fetch_personal_calendar_schedule',
      analyticsData: {
        calendarId,
        uid,
        startTime: start,
      },
    });

    if (result.success) {
      return {
        success: true,
        message: result.message,
        code: result.code,
        schedule: result.schedule ?? [],
        calendarName: result.calendar_name ?? '',
        table: result.table ?? {},
      };
    } else {
      return {
        success: false,
        error: result.error,
        code: result.code,
        schedule: [],
        calendarName: '',
        table: {},
      };
    }
  }, []);
  

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour modifier la boîte d'un calendrier personnel
  const updatePersonalBox = useCallback(async (calendarId, boxId, box) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/boxes/${boxId}`,
      method: 'PUT',
      body: box,
      origin: 'BOX_UPDATE',
      uid,
      analyticsEvent: 'update_personal_box',
      analyticsData: { calendarId, uid },
    });
  }, []);
  

  // Fonction pour créer une boîte de médicaments
  const createPersonalBox = useCallback(async (calendarId, name, boxCapacity = 0, stockAlertThreshold = 10, stockQuantity = 0 ) => {
    const result = await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/boxes`,
      method: 'POST',
      body: {
        name,
        box_capacity: boxCapacity,
        stock_alert_threshold: stockAlertThreshold,
        stock_quantity: stockQuantity,
      },
      origin: 'BOX_CREATE',
      uid,
      analyticsEvent: 'create_personal_box',
      analyticsData: { calendarId, uid },
    });

    if (result.success) {
      return {
        success: true,
        boxId: result.box_id,
        message: result.message,
        code: result.code,
      };
    } else {
      return {
        success: false,
        error: result.error,
        code: result.code,
      };
    }
  }, []);
  

  // Fonction pour supprimer une boîte
  const deletePersonalBox = useCallback(async (calendarId, boxId) => {
    return await performApiCall({
      url: `${API_URL}/api/calendars/${calendarId}/boxes/${boxId}`,
      method: 'DELETE',
      origin: 'BOX_DELETE',
      uid,
      analyticsEvent: 'delete_personal_box',
      analyticsData: { calendarId, uid },
    });
  }, []);
  

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour recupérer un calendrier partagé par un token
  const fetchTokenCalendarSchedule = useCallback(async (token, startDate = null) => {
    const start = startDate || formatToLocalISODate(new Date());

    const result = await performApiCall({
      url: `${API_URL}/api/tokens/${token}/schedule?startTime=${start}`,
      method: 'GET',
      origin: 'SHARED_CALENDAR_FETCH',
      analyticsEvent: 'fetch_token_calendar_schedule',
      analyticsData: {
        token,
        startTime: start,
      },
    });

    return {
      success: result.success,
      message: result.message,
      code: result.code,
      schedule: result.schedule ?? [],
      calendarName: result.calendar_name ?? '',
      table: result.table ?? {},
      error: result.error,
    };
  }, []);
  

  // Fonction pour créer un lien de partage
  const createToken = useCallback(async (calendarId, expiresAt, permissions) => {
    return await performApiCall({
      url: `${API_URL}/api/tokens/${calendarId}`,
      method: 'POST',
      body: { expiresAt, permissions },
      origin: 'SHARED_CALENDAR_CREATE',
      analyticsEvent: 'create_token',
      analyticsData: { calendarId },
    });
  }, []);
  

  // Fonction pour supprimer un lien de partage
  const deleteToken = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/tokens/${token}`,
      method: 'DELETE',
      origin: 'SHARED_CALENDAR_DELETE',
      uid,
      analyticsEvent: 'delete_token',
      analyticsData: { token, uid },
    });
  }, []);
  

  // Fonction pour revoker un token
  const updateRevokeToken = useCallback(async (token) => {
    return await performApiCall({
      url: `${API_URL}/api/tokens/revoke/${token}`,
      method: 'POST',
      origin: 'TOKEN_REVOKE',
      uid,
      analyticsEvent: 'update_revoke_token',
      analyticsData: { token, uid },
    });
  }, []);
  

  // Fonction pour mettre à jour l'expiration d'un token
  const updateTokenExpiration = useCallback(async (token, expiresAt) => {
    return await performApiCall({
      url: `${API_URL}/api/tokens/expiration/${token}`,
      method: 'POST',
      body: { expiresAt },
      origin: 'TOKEN_EXPIRATION_UPDATE',
      uid,
      analyticsEvent: 'update_token_expiration',
      analyticsData: { token, uid, expiresAt },
    });
  }, []);
  

  // Fonction pour mettre à jour les permissions d'un token
  const updateTokenPermissions = useCallback(async (token, permissions) => {
    return await performApiCall({
      url: `${API_URL}/api/tokens/permissions/${token}`,
      method: 'POST',
      body: { permissions },
      origin: 'TOKEN_PERMISSIONS_UPDATE',
      uid,
      analyticsEvent: 'update_token_permissions',
      analyticsData: { token, uid, permissions },
    });
  }, []);
  

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour envoyer une invitation à un utilisateur
  const sendInvitation = useCallback(async (email, calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/invitations/send/${calendarId}`,
      method: 'POST',
      body: { email },
      origin: 'INVITATION_SEND',
      uid,
      analyticsEvent: 'send_invitation',
      analyticsData: { email, calendarId, uid },
    });
  }, []);
  

  // Fonction pour accepter une invitation
  const acceptInvitation = useCallback(async (notificationId) => {
    return await performApiCall({
      url: `${API_URL}/api/invitations/accept/${notificationId}`,
      method: 'POST',
      origin: 'INVITATION_ACCEPT',
      uid,
      analyticsEvent: 'accept_invitation',
      analyticsData: { notificationId, uid },
    });
  }, []);
  

  // Fonction pour rejeter une invitation
  const rejectInvitation = useCallback(async (notificationId) => {
    return await performApiCall({
      url: `${API_URL}/api/invitations/reject/${notificationId}`,
      method: 'POST',
      origin: 'INVITATION_REJECT',
      uid,
      analyticsEvent: 'reject_invitation',
      analyticsData: { notificationId, uid },
    });
  }, []);
  

  // Fonction pour marquer une notification comme lue
  const readNotification = useCallback(async (notificationId) => {
    return await performApiCall({
      url: `${API_URL}/api/notifications/${notificationId}`,
      method: 'POST',
      origin: 'NOTIFICATION_READ',
      uid,
      analyticsEvent: 'read_notification',
      analyticsData: { notificationId, uid },
    });
  }, []);
  

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour supprimer un calendrier partagé pour le receiver
  const deleteSharedCalendar = useCallback(async (calendarId) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}`,
      method: 'DELETE',
      origin: 'SHARED_CALENDAR_DELETE',
      uid,
      analyticsEvent: 'delete_shared_calendar',
      analyticsData: { calendarId, uid },
    });
  }, []);
  

  // Fonction pour récupérer les différentes utilisateurs ayant accès à un calendrier
  const fetchSharedUsers = useCallback(async (calendarId) => {
    const result = await performApiCall({
      url: `${API_URL}/api/shared/users/users/${calendarId}`,
      method: 'GET',
      origin: 'SHARED_USERS_FETCH',
      uid,
      analyticsEvent: 'fetch_shared_users',
      analyticsData: { calendarId, uid },
    });
  
    return {
      ...result,
      users: result.users ?? [],
    };
  }, []);
  

  // Fonction pour supprimer un utilisateur partagé pour le owner
  const deleteSharedUser = useCallback(async (calendarId, userId) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/${calendarId}/${userId}`,
      method: 'DELETE',
      origin: 'SHARED_USER_DELETE',
      uid,
      analyticsEvent: 'delete_shared_user',
      analyticsData: { calendarId, userId, uid },
    });
  }, []);
  

  // Fonction pour recup le calendrier partagé par un utilisateur
  const fetchSharedUserCalendarSchedule = useCallback(
    async (calendarId, startDate = null) => {
      const startTime = startDate || formatToLocalISODate(new Date());
  
      const response = await performApiCall({
        url: `${API_URL}/api/shared/users/calendars/${calendarId}/schedule?startTime=${startTime}`,
        method: 'GET',
        origin: 'SHARED_USER_CALENDAR_FETCH',
        uid,
        analyticsEvent: 'fetch_shared_user_calendar_schedule',
        analyticsData: { calendarId, uid, startTime },
      });
  
      if (response.success) {
        return {
          ...response,
          schedule: response.schedule,
          calendarName: response.calendar_name,
          table: response.table,
        };
      }
  
      return {
        ...response,
        schedule: [],
        calendarName: '',
        table: {},
      };
    },
    []
  );
  

  // Fonction pour mettre à jour une boite de médicaments d'un calendrier partagé
  const updateSharedUserBox = useCallback(async (calendarId, boxId, box) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/boxes/${boxId}`,
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: box,
      origin: 'SHARED_BOX_UPDATE',
      uid,
      analyticsEvent: 'update_shared_user_box',
      analyticsData: { calendarId, uid },
    });
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
      const result = await performApiCall({
        url: `${API_URL}/api/shared/users/calendars/${calendarId}/boxes`,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: {
          name,
          box_capacity: boxCapacity,
          stock_alert_threshold: stockAlertThreshold,
          stock_quantity: stockQuantity,
        },
        origin: 'SHARED_BOX_CREATE',
        uid,
        analyticsEvent: 'create_shared_user_box',
        analyticsData: { calendarId, uid },
      });
  
      if (result.success) {
        return {
          ...result,
          boxId: result?.data?.box_id ?? null,
        };
      }
  
      return result;
    },
    []
  );
  

  // Fonction pour supprimer une boîte
  const deleteSharedUserBox = useCallback(async (calendarId, boxId) => {
    return await performApiCall({
      url: `${API_URL}/api/shared/users/calendars/${calendarId}/boxes/${boxId}`,
      method: 'DELETE',
      origin: 'SHARED_BOX_DELETE',
      uid,
      analyticsEvent: 'delete_shared_user_box',
      analyticsData: { calendarId, uid },
    });
  }, []);

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  const downloadPersonalCalendarPdf = useCallback(async (calendarId) => {
    const url = `${API_URL}/api/calendars/${calendarId}/pdf`;
    window.open(url, '_blank');
  }, []);
  
  

  const sharedProps = {
    personalCalendars: {
      fetchPersonalCalendarSchedule,
      addCalendar,
      renameCalendar,
      deleteCalendar,
      calendarsData,
      setCalendarsData,
      updatePersonalBox,
      createPersonalBox,
      deletePersonalBox,
      downloadPersonalCalendarPdf,
    },

    sharedUserCalendars: {
      fetchSharedUserCalendarSchedule,
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
      const tokenFcm = await requestPermissionAndGetToken(userInfo?.uid);
      const token = await getToken();
      if (!token || !userInfo?.uid) return;

      // 🎯 Envoi du token FCM au backend Flask
      fetch(`${API_URL}/api/notifications/register-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          token: tokenFcm,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          log.info('[FCM] Token enregistré côté backend', {
            uid: userInfo.uid,
            token: tokenFcm,
            origin: 'FCM_TOKEN_REGISTER_SUCCESS',
          });
        })
        .catch((error) => {
          log.error('[FCM] Erreur d’envoi du token', {
            uid: userInfo.uid,
            token: tokenFcm,
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
