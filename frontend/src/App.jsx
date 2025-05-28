// App.js
import React, { useState, useEffect, useContext, useCallback } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/Header';
import Footer from './components/Footer';
import AppRoutes from './routes/AppRouter';
import { log } from './utils/logger';
import { auth, analyticsPromise, requestPermissionAndGetToken} from './services/firebase';
import { logEvent } from 'firebase/analytics';
import { UserContext } from './contexts/UserContext';
import { useRealtimeCalendars, useRealtimeSharedCalendars } from './hooks/useRealtimeCalendars';
import { useRealtimeNotifications } from './hooks/useRealtimeNotifications';
import { useRealtimeTokens } from './hooks/useRealtimeTokens';
import { formatToLocalISODate } from './utils/dateUtils';
import { v4 as uuidv4 } from 'uuid';
import RealtimeManager from './components/RealtimeManager';

const API_URL = import.meta.env.VITE_API_URL;

function App() {
  const [tokensList, setTokensList] = useState([]);
  const [calendarsData, setCalendarsData] = useState(null);
  const [notificationsData, setNotificationsData] = useState([]);
  const [sharedCalendarsData, setSharedCalendarsData] = useState([]);

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

  // Fonction pour récupérer les calendriers, les calendriers partagés, les notifications et les tokens
  useRealtimeCalendars(setCalendarsData, setLoadingStates);
  useRealtimeSharedCalendars(setSharedCalendarsData, setLoadingStates);
  useRealtimeNotifications(setNotificationsData, setLoadingStates);
  useRealtimeTokens(setTokensList, setLoadingStates);

  // Fonction pour ajouter un calendrier
  const addCalendar = useCallback(async (calendarName) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/calendars`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ calendarName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'add_calendar', {
            calendarName: calendarName,
            uid: auth.currentUser.uid,
          });
        }
      });
      log.info(data.message, {
        origin: "CALENDAR_CREATE_SUCCESS",
        "uid": auth.currentUser.uid,
        "calendarName": calendarName,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {

      log.error(err.message || "Erreur lors de la création du calendrier", err, {
        origin: "CALENDAR_CREATE_ERROR",
        "uid": auth.currentUser.uid,
        "calendarName": calendarName,
      });
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  // Fonction pour supprimer un calendrier
  const deleteCalendar = useCallback(async (calendarId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/calendars`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ calendarId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'delete_calendar', {
            calendarId: calendarId,
            uid: auth.currentUser.uid,
          });
        }
      });
      log.info(data.message, {
        origin: "CALENDAR_DELETE_SUCCESS",
        "uid": auth.currentUser.uid,
        "calendarId": calendarId,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(err.message || "Erreur lors de la suppression du calendrier", err, {
        origin: "CALENDAR_DELETE_ERROR",
        "uid": auth.currentUser.uid,
        "calendarId": calendarId,
      });
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  // Fonction pour renommer un calendrier
  const renameCalendar = useCallback(async (calendarId, newCalendarName) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/calendars`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
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
            uid: auth.currentUser.uid,
            newCalendarName: newCalendarName,
          });
        }
      });
      log.info(data.message, {
        origin: "CALENDAR_RENAME_SUCCESS",
        "uid": auth.currentUser.uid,
        "calendarId": calendarId,
        "newCalendarName": newCalendarName,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(err.message || "Erreur lors du renommage du calendrier", err, {
        origin: "CALENDAR_RENAME_ERROR",
        "uid": auth.currentUser.uid,
        "calendarId": calendarId,
        "newCalendarName": newCalendarName,
      });
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  // Fonction pour obtenir le nombre de médicaments d'un calendrier 
  const fetchPersonalCalendarMedicineCount = useCallback(async (calendarId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/medicines/count?calendarId=${calendarId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'fetch_personal_calendar_medicine_count', {
            calendarId: calendarId,
            uid: auth.currentUser.uid,
            count: data.count,
          });
        }
      });
      log.info(data.message, {
        origin: "MED_COUNT_SUCCESS",
        "uid": auth.currentUser.uid,
        "calendarId": calendarId,
        "count": data.count,
      });
      return { success: true, count: data.count };
    } catch (err) {
      log.error(err.message || "Erreur lors de la récupération du nombre de médicaments", err, {
        origin: "MED_COUNT_ERROR",
        "uid": auth.currentUser.uid,
        "calendarId": calendarId,
      });
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  // Fonction pour obtenir le nombre de médicaments d'un calendrier partagé
  const fetchSharedUserCalendarMedicineCount = useCallback(async (calendarId, ownerUid) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/medicines/shared/count?calendarId=${calendarId}&ownerUid=${ownerUid}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'fetch_shared_user_calendar_medicine_count', {
            calendarId: calendarId,
            uid: auth.currentUser.uid,
            count: data.count,
          });
        }
      });
      log.info(data.message, {
        origin: "MED_SHARED_COUNT_SUCCESS",
        "uid": auth.currentUser.uid,
        "calendarId": calendarId,
        "ownerUid": ownerUid,
        "count": data.count,
      });
      return { success: true, count: data.count };
    } catch (err) {
      log.error(err.message || "Erreur lors de la récupération du nombre de médicaments partagé", err, {
        origin: "MED_SHARED_COUNT_ERROR",
        "uid": auth.currentUser.uid,
        "calendarId": calendarId,
        "ownerUid": ownerUid,
      });
      return { success: false, error: err.message, code: err.code };
    }
  }, []);


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  

  // Fonction pour obtenir le calendrier lier au calendarId
  const fetchPersonalCalendarSchedule = useCallback(async (calendarId, startDate = null) => {
    try {
      if (!calendarId) {
        log.warn("Nom de calendrier non fourni, calendrier non chargé.", {
          origin: "CALENDAR_NAME_NOT_PROVIDED",
          "uid": auth.currentUser.uid,
        });
        return { success: false, error: "Nom de calendrier non fourni, calendrier non chargé.", code: "CALENDAR_NAME_NOT_PROVIDED" };
      }
      if (!startDate) {
        startDate = formatToLocalISODate(new Date());
      }

      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/calendars/${calendarId}/schedule?startTime=${startDate}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'fetch_personal_calendar_schedule', {
            calendarId: calendarId,
            uid: auth.currentUser.uid,
            count: data.count,
          });
        }
      });

      log.info(data.message, {
        origin: "CALENDAR_FETCH_SUCCESS",
        "uid": auth.currentUser.uid,
        "eventCount": data.schedule?.length,
        "calendarId": calendarId,
      });
      return { success: true, message: data.message, code: data.code, schedule: data.schedule, calendarName: data.calendar_name, table: data.table};
    } catch (err) {
      log.error(err.message || "Erreur lors de la récupération du calendrier", err, {
        origin: "CALENDAR_FETCH_ERROR",
        "uid": auth.currentUser.uid,
        "calendarId": calendarId,
        "startDate": startDate,
      });
      return { success: false, error: err.message, code: err.code, schedule: [], calendarName: "", table: {} };
    }
  }, []);


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  // Fonction pour modifier un médicament
  const updatePersonalCalendarMedicines = useCallback(async (calendarId, changes) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/calendars/${calendarId}/medicines`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ changes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'update_personal_calendar_medicines', {
            calendarId: calendarId,
            uid: auth.currentUser.uid,
            changes: changes,
          });
        }
      });
      // trier par ordre alphabétique
      const medicinesSortedByName = data.medicines ? data.medicines.sort((a, b) => a.name.localeCompare(b.name)) : [];
    
      log.info(data.message, {
        origin: "MED_UPDATE_SUCCESS",
        "uid": auth.currentUser.uid,
        "count": changes?.length,
        "calendarId": calendarId,
      });
      return { success: true, message: data.message, code: data.code, medicinesData: medicinesSortedByName, originalMedicinesData: medicinesSortedByName ? JSON.parse(JSON.stringify(medicinesSortedByName)) : [] };
    } catch (err) {
      log.error(err.message || "Erreur lors de la modification des médicaments", err, {
        origin: "MED_UPDATE_ERROR",
        "uid": auth.currentUser.uid,
        "calendarId": calendarId,
      });
      return { success: false, error: err.message, code: err.code };
    }
  }, []);

  // Fonction pour supprimer des médicaments 
  const deletePersonalCalendarMedicines = useCallback(async (calendarId, checked) => {
    try {
      if (checked.length === 0) return false;
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/calendars/${calendarId}/medicines`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ checked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'delete_personal_calendar_medicines', {
            calendarId: calendarId,
            uid: auth.currentUser.uid,
            checked: checked,
          });
        }
      });
      // trier par ordre alphabétique
      const medicinesSortedByName = data.medicines ? data.medicines.sort((a, b) => a.name.localeCompare(b.name)) : [];
      log.info(data.message, {
        origin: "MED_DELETE_SUCCESS",
        "uid": auth.currentUser.uid,
        "calendarId": calendarId,
        "count": checked.length,
      });
      return {success: true, message: data.message, code: data.code, medicinesData: medicinesSortedByName, originalMedicinesData: medicinesSortedByName ? JSON.parse(JSON.stringify(medicinesSortedByName)) : []};
    } catch (err) {
      log.error(err.message || "Erreur lors de la suppression des médicaments", err, {
        origin: "MED_DELETE_ERROR",
        "uid": auth.currentUser.uid,
        "calendarId": calendarId,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, []);
    
  
  // Fonction pour ajouter un nouveau médicament sanq la variable medicines
  const addMedicine = useCallback((medicinesData, name = '') => {
    // générer un uuid unique a 16 caractères 
    const id = uuidv4();
    if (medicinesData.length === 0) {
      const newMedicinesData = [{ name: name, tablet_count: 1, time_of_day: 'morning', interval_days: 1, start_date: null, id: id }];
      return {success: true, message: "Médicament ajouté avec succès", code: "MED_ADD_SUCCESS", medicinesData: newMedicinesData, id: id };
    }
    const newMedicinesData = [
      ...medicinesData,
      { name: name, tablet_count: 1, time_of_day: 'morning', interval_days: 1, start_date: null, id: id },
    ];

    return {success: true, message: "Médicament ajouté avec succès", code: "MED_ADD_SUCCESS", medicinesData: newMedicinesData, id: id };
  }, []);

  // Fonction pour modifier la boîte d'un calendrier personnel
  const updatePersonalBox = useCallback(async (calendarId, boxId, box) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/calendars/${calendarId}/boxes/${boxId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(box),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return {success: true, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Erreur lors de la modification de la boîte", err, {
        origin: "BOX_UPDATE_ERROR",
        "uid": auth.currentUser.uid,
        "calendarId": calendarId,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, []);

  // Fonction pour créer une boîte de médicaments
  const createPersonalBox = useCallback(async (calendarId, name, boxCapacity = 0, stockAlertThreshold = 10, stockQuantity = 0) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/calendars/${calendarId}/boxes`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: name, box_capacity: boxCapacity, stock_alert_threshold: stockAlertThreshold, stock_quantity: stockQuantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return {success: true, boxId: data.box_id, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Erreur lors de la création de la boîte", err, {
        origin: "BOX_CREATE_ERROR",
        "uid": auth.currentUser.uid,
        "calendarId": calendarId,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, []);
  
  

  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  // Fonction pour recupérer un calendrier partagé par un token
  const fetchTokenCalendarSchedule = useCallback(async (token, startDate = null) => {
    try {
      if (!startDate) {
        startDate = formatToLocalISODate(new Date());
      }
      
      const res = await fetch(`${API_URL}/api/tokens/${token}/schedule?startTime=${startDate}`, {
        method: "GET",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'fetch_token_calendar_schedule', {
            token: token,
            uid: auth.currentUser.uid,
            count: data.schedule?.length,
          });
        }
      });
      log.info(data.message, {
        origin: "SHARED_CALENDAR_FETCH_SUCCESS",
        "token": token,
        "eventCount": data.schedule?.length,
      });
      return {success: true, message: data.message, code: data.code, schedule: data.schedule, calendarName: data.calendar_name, table: data.table};
    } catch (err) {
      log.error(err.message || "Échec de récupération du calendrier partagé", err, {
        origin: "SHARED_CALENDAR_FETCH_ERROR",
        "token": token,
      });
      return {success: false, error: err.message, code: err.code, schedule: [], calendarName: "", table: {}};
    }
  }, []);
  
  // Fonction pour créer un lien de partage
  const createToken = useCallback(async (calendarId, expiresAt, permissions) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/tokens/${calendarId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ expiresAt, permissions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'create_token', {
            calendarId: calendarId,
            uid: auth.currentUser.uid,
            token: data.token,
          });
        }
      });
      log.info(data.message, {
        origin: "SHARED_CALENDAR_CREATE_SUCCESS",
        "calendarId": calendarId,
        "token": data.token,
      });
      return {success: true, token: data.token, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec de création du lien de partage", err, {
        origin: "SHARED_CALENDAR_CREATE_ERROR",
        "calendarId": calendarId,
      });
      return {success: false, token: null, error: err.message, code: err.code};
    }
  }, []);

  // Fonction pour supprimer un lien de partage
  const deleteToken = useCallback(async (token) => {
    try {
      const tokenFirebase = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/tokens/${token}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tokenFirebase}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'delete_token', {
            token: token,
            uid: auth.currentUser.uid,
          });
        }
      });
      log.info(data.message, {
        origin: "SHARED_CALENDAR_DELETE_SUCCESS",
        "token": token,
      });
      return {success: true, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec de suppression du lien de partage", err, {
        origin: "SHARED_CALENDAR_DELETE_ERROR",
        "token": token,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, []);
  
  // Fonction pour revoker un token
  const updateRevokeToken = useCallback(async (token) => {
    try {
      const tokenFirebase = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/tokens/revoke/${token}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenFirebase}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'update_revoke_token', {
            token: token,
            uid: auth.currentUser.uid,
          });
        }
      });
      log.info(data.message, {
        origin: "TOKEN_REVOKE_SUCCESS",
        "token": token,
      });
      return {success: true, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec de révoquer le token", err, {
        origin: "TOKEN_REVOKE_ERROR",
        "token": token,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, []);

  // Fonction pour mettre à jour l'expiration d'un token
  const updateTokenExpiration = useCallback(async (token, expiresAt) => {
    try {
      const tokenFirebase = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/tokens/expiration/${token}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenFirebase}`,
        },
        body: JSON.stringify({ expiresAt }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'update_token_expiration', {
            token: token,
            uid: auth.currentUser.uid,
            expiresAt: expiresAt,
          });
        }
      });
      log.info("Expiration du token mise à jour avec succès", {
        origin: "TOKEN_EXPIRATION_UPDATE_SUCCESS",
        "token": token,
        "expiresAt": expiresAt,
      });
      return {success: true, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec de mise à jour de l'expiration du token", err, {
        origin: "TOKEN_EXPIRATION_UPDATE_ERROR",
        "token": token,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, []);

  // Fonction pour mettre à jour les permissions d'un token
  const updateTokenPermissions = useCallback(async (token, permissions) => {
    try {
      const tokenFirebase = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/tokens/permissions/${token}`, {
        method: "POST",
          headers: {
          Authorization: `Bearer ${tokenFirebase}`,
        },
        body: JSON.stringify({ permissions }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'update_token_permissions', {
            token: token,
            uid: auth.currentUser.uid,
            permissions: permissions,
          });
        }
      });
      log.info(data.message, {
        origin: "TOKEN_PERMISSIONS_UPDATE_SUCCESS",
        "token": token,
        "permissions": permissions,
      });
      return {success: true, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Erreur lors de la mise à jour des permissions du token", err, {
        origin: "TOKEN_PERMISSIONS_UPDATE_ERROR",
        "token": token,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, []);


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  // Fonction pour envoyer une invitation à un utilisateur
  const sendInvitation = useCallback(async (email, calendarId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/invitations/send/${calendarId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'send_invitation', {
            email: email,
            uid: auth.currentUser.uid,
            calendarId: calendarId,
          });
        }
      });
      log.info(data.message, {
        origin: "INVITATION_SEND_SUCCESS",
        email,
        calendarId,
      });
      return {success: true, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec d'envoi de l'invitation", err, {
        origin: "INVITATION_SEND_ERROR",
        email,
        calendarId,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, []);

  // Fonction pour accepter une invitation
  const acceptInvitation = useCallback(async (notificationId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/invitations/accept/${notificationId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'accept_invitation', {
            notificationId: notificationId,
            uid: auth.currentUser.uid,
          });
        }
      });
      log.info(data.message, {
        origin: "INVITATION_ACCEPT_SUCCESS",
        notificationId,
      });
      return {success: true, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec d'acceptation de l'invitation", err, {
        origin: "INVITATION_ACCEPT_ERROR",
        notificationId,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, []);

  // Fonction pour rejeter une invitation
  const rejectInvitation = useCallback(async (notificationId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/invitations/reject/${notificationId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'reject_invitation', {
            notificationId: notificationId,
            uid: auth.currentUser.uid,
          });
        }
      });
      log.info(data.message, {
        origin: "INVITATION_REJECT_SUCCESS",
        notificationId,
      });
      return {success: true, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec de rejet de l'invitation", err, {
        origin: "INVITATION_REJECT_ERROR",
        notificationId,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, []);

  // Fonction pour marquer une notification comme lue
  const readNotification = useCallback(async (notificationId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/notifications/${notificationId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'read_notification', {
            notificationId: notificationId,
            uid: auth.currentUser.uid,
          });
        }
      });
      log.info(data.message, {
        origin: "NOTIFICATION_READ_SUCCESS",
        notificationId,
      });
      return {success: true, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec de marquer la notification comme lue", err, {
        origin: "NOTIFICATION_READ_ERROR",
        notificationId,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, []);


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour supprimer un calendrier partagé pour le receiver
  const deleteSharedCalendar = useCallback(async (calendarId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/shared/users/calendars/${calendarId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'delete_shared_calendar', {
            calendarId: calendarId,
            uid: auth.currentUser.uid,
          });
        }
      });
      log.info(data.message, {
        origin: "SHARED_CALENDAR_DELETE_SUCCESS",
        calendarId,
      });
      return {success: true, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec de suppression du calendrier partagé", err, {
        origin: "SHARED_CALENDAR_DELETE_ERROR",
        calendarId,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, []);

  // Fonction pour récupérer les différentes utilisateurs ayant accès à un calendrier
  const fetchSharedUsers = useCallback(async (calendarId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/shared/users/users/${calendarId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'fetch_shared_users', {
            calendarId: calendarId,
            uid: auth.currentUser.uid,
            count: data?.users?.length,
          });
        }
      });
      log.info(data.message, {
        origin: "SHARED_USERS_FETCH_SUCCESS",
        count: data?.users?.length,
        calendarId,
      });
      return {success: true, message: data.message, code: data.code, users: data.users};
    } catch (err) {
      log.error(err.message || "Échec de récupération des utilisateurs partagés", err, {
        origin: "SHARED_USERS_FETCH_ERROR",
        calendarId,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, []);

  // Fonction pour supprimer un utilisateur partagé pour le owner
  const deleteSharedUser = useCallback(async (calendarId, userId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/shared/users/${calendarId}/${userId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'delete_shared_user', {
            calendarId: calendarId,
            uid: auth.currentUser.uid,
            userId: userId,
          });
        }
      });
      log.info(data.message, {
        origin: "SHARED_USER_DELETE_SUCCESS",
        calendarId,
        userId,
      });
      return {success: true, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec de suppression de l'utilisateur partagé", err, {
        origin: "SHARED_USER_DELETE_ERROR",
        calendarId,
        userId,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, []);

  // Fonction pour recup le calendrier partagé par un utilisateur
  const fetchSharedUserCalendarSchedule = useCallback(async (calendarId, startDate = null) => {
    try {
      if (!startDate) {
        startDate = formatToLocalISODate(new Date());
      }
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/shared/users/calendars/${calendarId}/schedule?startTime=${startDate}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'fetch_shared_user_calendar_schedule', {
            calendarId: calendarId,
            uid: auth.currentUser.uid,
            count: data.schedule?.length,
          });
        }
      });
      log.info(data.message, {
        origin: "SHARED_USER_CALENDAR_FETCH_SUCCESS",
        calendarId,
        startDate,
      });
      return {success: true, message: data.message, code: data.code, schedule: data.schedule, calendarName: data.calendar_name, table: data.table};
    } catch (err) {
      log.error(err.message || "Échec de récupération du calendrier partagé par un utilisateur", err, {
        origin: "SHARED_USER_CALENDAR_FETCH_ERROR",
        calendarId,
        startDate,
      });
      return {success: false, error: err.message, code: err.code, schedule: [], calendarName: "", table: {}};
    }
  }, []);

  // Fonction pour mettre à jour les médicaments d’un calendrier partagé par un utilisateur
  const updateSharedUserCalendarMedicines = useCallback(async (calendarId, changes) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/shared/users/calendars/${calendarId}/medicines`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ changes }),
      }); 
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // trier par ordre alphabétique
      const medicinesSortedByName = data.medicines ? data.medicines.sort((a, b) => a.name.localeCompare(b.name)) : [];
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'update_shared_user_calendar_medicines', {
            calendarId: calendarId,
            uid: auth.currentUser.uid,
            medicinesData: medicinesSortedByName,
          });
        }
      });
      log.info(data.message, {
        origin: "SHARED_USER_CALENDAR_MEDICINES_UPDATE_SUCCESS",
        calendarId,
      });
      return {success: true, message: data.message, code: data.code, medicinesData: medicinesSortedByName, originalMedicinesData: JSON.parse(JSON.stringify(medicinesSortedByName))};
    } catch (err) {
      log.error(err.message || "Échec de mise à jour des médicaments du calendrier partagé par un utilisateur", err, {
        origin: "SHARED_USER_CALENDAR_MEDICINES_UPDATE_ERROR",
        calendarId,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, []);

  // Fonction pour supprimer les médicaments d’un calendrier partagé par un utilisateur
  const deleteSharedUserCalendarMedicines = useCallback(async (calendarId, checked, medicinesData) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/shared/users/calendars/${calendarId}/medicines`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ checked }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // trier par ordre alphabétique
      const medicinesSortedByName = data.medicines ? data.medicines.sort((a, b) => a.name.localeCompare(b.name)) : [];
      analyticsPromise.then((analytics) => {
        if (analytics) {
          logEvent(analytics, 'delete_shared_user_calendar_medicines', {
            calendarId: calendarId,
            uid: auth.currentUser.uid,
            medicinesData: medicinesSortedByName,
          });
        }
      });
      log.info(data.message, {
        origin: "SHARED_USER_CALENDAR_MEDICINES_DELETE_SUCCESS",
        calendarId,
      });
      return {success: true, message: data.message, code: data.code, medicinesData: medicinesSortedByName, originalMedicinesData: JSON.parse(JSON.stringify(medicinesSortedByName))};
    } catch (err) {
      log.error(err.message || "Échec de suppression des médicaments du calendrier partagé par un utilisateur", err, {
        origin: "SHARED_USER_CALENDAR_MEDICINES_DELETE_ERROR",
        calendarId,
      });
      return {success: false, error: err.message, code: err.code, medicinesData: [], originalMedicinesData: []};
    }
  }, []);
  
  // Fonction pour mettre à jour une boite de médicaments d'un calendrier partagé
  const updateSharedUserBox = useCallback(async (calendarId, boxId, box) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/shared/users/calendars/${calendarId}/boxes/${boxId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(box),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return {success: true, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec de mise à jour de la boite de médicaments partagée", err, {
        origin: "SHARED_BOX_UPDATE_ERROR",
        calendarId,
        boxId,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, []);

  // Fonction pour créer une boite de médicaments
  const createSharedUserBox = useCallback(async (calendarId, name, boxCapacity = 0, stockAlertThreshold = 10, stockQuantity = 0) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/shared/users/calendars/${calendarId}/boxes`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: name, box_capacity: boxCapacity, stock_alert_threshold: stockAlertThreshold, stock_quantity: stockQuantity }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      return {success: true, boxId: data.box_id, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec de création de la boite de médicaments", err, {
        origin: "SHARED_BOX_CREATE_ERROR",
        "uid": auth.currentUser.uid,
        "calendarId": calendarId,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, []);
  

  const sharedProps = {
    personalCalendars: {
      fetchPersonalCalendarSchedule,
      fetchPersonalCalendarMedicineCount,
      addCalendar,
      renameCalendar,
      deleteCalendar,
      addMedicine,
      updatePersonalCalendarMedicines,
      deletePersonalCalendarMedicines,
      calendarsData,
      setCalendarsData,
      updatePersonalBox,
      createPersonalBox,
    },
  
    sharedUserCalendars: {
      fetchSharedUserCalendarSchedule,
      fetchSharedUserCalendarMedicineCount,
      fetchSharedUsers,
      sendInvitation,
      acceptInvitation,
      rejectInvitation,
      updateSharedUserCalendarMedicines,
      deleteSharedUserCalendarMedicines,
      deleteSharedUser,
      deleteSharedCalendar,
      addMedicine,
      sharedCalendarsData,
      setSharedCalendarsData,
      updateSharedUserBox,
      createSharedUserBox,
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
    setNotificationsData([]);

    // SHARED CALENDARS
    setSharedCalendarsData([]);

  };

  useEffect(() => {
    resetAppData();
    setLoadingStates(current => ({
      ...current,
      calendars: false, 
      sharedCalendars: false, 
      notifications: false, 
      tokens: false,
    }));
  }, [userInfo]);

  useEffect(() => {
    if (!auth.currentUser) return;

    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then((registration) => {
          log.info("[FCM] SW enregistré :", registration, {
            origin: "FCM_SW_REGISTER_SUCCESS",
          });
        })
        .catch((err) => {
          log.error("[FCM] Erreur SW :", err, {
            origin: "FCM_SW_REGISTER_ERROR",
          });
        });
    }

    // 🔐 Demande de permission et envoi du token
    const sendTokenToBackend = async () => {
      const token = await requestPermissionAndGetToken();
      if (!token || !auth.currentUser) return;

      // 🎯 Envoi du token FCM au backend Flask
      fetch(`${import.meta.env.VITE_API_URL}/api/notifications/register-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          uid: auth.currentUser.uid,
          token: token,
        }),
      })
        .then((res) => res.json())
        .then((data) => {
          log.info("[FCM] Token enregistré côté backend", {
            uid: auth.currentUser.uid,
            token: token,
            origin: "FCM_TOKEN_REGISTER_SUCCESS",
          });
        })
        .catch((error) => {
          log.error("[FCM] Erreur d’envoi du token", {
            uid: auth.currentUser.uid,
            token: token,
            origin: "FCM_TOKEN_REGISTER_ERROR",
            error: error,
          });
        });
    };

    sendTokenToBackend();

  }, [auth.currentUser]);

  return (
    <Router>
      <div className="d-flex flex-column min-vh-100">
        <Navbar sharedProps={sharedProps}/>
        <main className="flex-grow-1 d-flex flex-column pb-5 pb-md-0">
          {userInfo && (
            <RealtimeManager
              setCalendarsData={setCalendarsData}
              setSharedCalendarsData={setSharedCalendarsData}
              setNotificationsData={setNotificationsData}
              setTokensList={setTokensList}
              setLoadingStates={setLoadingStates}
            />
          )}

          <div className="container mt-4 pb-5 pb-md-0">
            <AppRoutes sharedProps={sharedProps} />
          </div>

        </main>
        <Footer />
      </div>
    </Router>
  );
}

export default App;