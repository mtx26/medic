// App.js
import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/Header';
import Footer from './components/Footer';
import AppRoutes from './routes/AppRouter';
import { log } from './utils/logger';
import { auth } from './services/firebase';
import { AuthContext } from './contexts/LoginContext';
import { useCallback } from 'react';

const API_URL = process.env.REACT_APP_API_URL;

function App() {
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [eventsForDay, setEventsForDay] = useState([]);
  const [medicinesData, setMedicinesData] = useState([]);
  const [checked, setChecked] = useState([]);
  const [tokensList, setTokensList] = useState([]);
  const [calendarsData, setCalendarsData] = useState([]);
  const [originalMedicinesData, setOriginalMedicinesData] = useState([]);
  const [notificationsData, setNotificationsData] = useState([]);
  const [sharedCalendarsData, setSharedCalendarsData] = useState([]);

  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { authReady, currentUser } = useContext(AuthContext);


  // Fonction pour obtenir les calendriers
  const fetchCalendars = useCallback(async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/calendars`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      // trier les calendriers par ordre alphabétique
      const sortedCalendars = data.calendars.sort((a, b) => a.calendar_name.localeCompare(b.calendar_name));
      setCalendarsData(sortedCalendars);
      log.info(data.message, {
        origin: "CALENDARS_FETCH_SUCCESS",
        "uid": auth.currentUser.uid,
        "count": data.calendars?.length,
      });
      return { success: true, message: data.message, code: data.code };

    } catch (err) {
      log.error(err.message || "Erreur lors de la récupération des calendriers", err, {
        origin: "CALENDARS_FETCH_ERROR",
        "uid": auth.currentUser.uid,
      });
      return { success: false, error: err.message, code: err.code };
    }
  }, [setCalendarsData]);

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
      fetchCalendars();

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
  }, [fetchCalendars]);

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
      fetchCalendars();
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
  }, [fetchCalendars]);

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
        console.log(data);
        throw new Error(data.error);
      }
      fetchCalendars();
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
  }, [fetchCalendars]);

  // Fonction pour obtenir le nombre de médicaments d'un calendrier 
  const getMedicineCount = useCallback(async (calendarId) => {
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
  const getSharedMedicineCount = useCallback(async (calendarId, ownerUid) => {
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
  const fetchCalendar = useCallback(async (calendarId, startDate ) => {
    try {
      if (!calendarId) {
        log.warn("Nom de calendrier non fourni, calendrier non chargé.", {
          origin: "CALENDAR_NAME_NOT_PROVIDED",
          "uid": auth.currentUser.uid,
        });
        return { success: false, error: "Nom de calendrier non fourni, calendrier non chargé.", code: "CALENDAR_NAME_NOT_PROVIDED" };
      }
      if (!startDate) {
        startDate = new Date().toISOString().slice(0, 10);
      }

      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/calendars/${calendarId}/calendar?startTime=${startDate}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCalendarEvents(data.schedule.map(e => ({ title: e.title, start: e.date, color: e.color })));
      log.info(data.message, {
        origin: "CALENDAR_FETCH_SUCCESS",
        "uid": auth.currentUser.uid,
        "eventCount": data?.length,
        "calendarId": calendarId,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(err.message || "Erreur lors de la récupération du calendrier", err, {
        origin: "CALENDAR_FETCH_ERROR",
        "uid": auth.currentUser.uid,
        "calendarId": calendarId,
        "startDate": startDate,
      });
      return { success: false, error: err.message, code: err.code };
    }
  }, [setCalendarEvents]);


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  // Fonction pour obtenir les différents médicaments
  const fetchCalendarMedicines = useCallback(async (calendarId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/calendars/${calendarId}/medicines`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMedicinesData(data.medicines)
      setOriginalMedicinesData(JSON.parse(JSON.stringify(data.medicines)));
      log.info(data.message, {
        origin: "MED_FETCH_SUCCESS",
        "uid": auth.currentUser.uid,
        "count": data.medicines?.length,
        "calendarId": calendarId,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(err.message || "Erreur lors de la récupération des médicaments", err, {
        origin: "MED_FETCH_ERROR",
        "uid": auth.currentUser.uid,
        "calendarId": calendarId,
      });
      return { success: false, error: err.message, code: err.code };
    }
  }, [setMedicinesData, setOriginalMedicinesData]);
  
  // Fonction pour modifier un médicament
  const updateMedicines = useCallback(async (calendarId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/calendars/${calendarId}/medicines`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ medicines: medicinesData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOriginalMedicinesData(JSON.parse(JSON.stringify(medicinesData)));
      log.info(data.message, {
        origin: "MED_UPDATE_SUCCESS",
        "uid": auth.currentUser.uid,
        "count": medicinesData?.length,
        "calendarId": calendarId,
      });
      return { success: true, message: data.message, code: data.code };
    } catch (err) {
      log.error(err.message || "Erreur lors de la modification des médicaments", err, {
        origin: "MED_UPDATE_ERROR",
        "uid": auth.currentUser.uid,
        "calendarId": calendarId,
      });
      return { success: false, error: err.message, code: err.code };
    }
  }, [medicinesData, setOriginalMedicinesData]);

  // Fonction pour supprimer des médicaments 
  const deleteSelectedMedicines = useCallback(async (calendarId) => {
    if (checked.length === 0) return false;
  
    setMedicinesData(medicinesData.filter((_, i) => !checked.includes(i)));
  
    const rep = await updateMedicines(calendarId);
  
    if (rep.success) {
      setChecked([]);
      log.info(rep.message, {
        origin: "MED_DELETE_SUCCESS",
        "uid": auth.currentUser.uid,
        "count": checked.length,
        "calendarId": calendarId,
      });
      return {success: true, message: "Médicaments supprimés avec succès", code: rep.code};
    } else {
      log.error(rep.error, {
        origin: "MED_DELETE_ERROR",
        "uid": auth.currentUser.uid,
        "count": checked.length,
        "calendarId": calendarId,
      });
      return {success: false, error: "Erreur lors de la suppression des médicaments", code: rep.code};
    }
  }, [checked, medicinesData, setMedicinesData, setChecked, updateMedicines]);
  
  // Fonction pour ajouter un nouveau médicament sanq la variable medicines
  const addMedicine = useCallback(() => {
    setMedicinesData([
      ...medicinesData,
      { name: '', tablet_count: 1, time: ['morning'], interval_days: 1, start_date: '' },
    ]);
  }, [medicinesData, setMedicinesData]);


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  // Fonction pour recupérer un calendrier partagé par un token
  const fetchSharedTokenCalendar = useCallback(async (token, startDate) => {
    try {
      if (!startDate) {
        startDate = new Date().toISOString().slice(0, 10);
      }
      
      const res = await fetch(`${API_URL}/api/tokens/${token}/calendar?startTime=${startDate}`, {
        method: "GET",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCalendarEvents(data.schedule.map(e => ({ title: e.title, start: e.date, color: e.color })));
      log.info(data.message, {
        origin: "SHARED_CALENDAR_FETCH_SUCCESS",
        "token": token,
      });
      return {success: true, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec de récupération du calendrier partagé", err, {
        origin: "SHARED_CALENDAR_FETCH_ERROR",
        "token": token,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, [setCalendarEvents]);

  // Fonction pour récupérer les médicaments d'un calendrier partagé
  const fetchSharedTokenMedicines = useCallback(async (token) => {
    try {
      const  res = await fetch(`${API_URL}/api/tokens/${token}/medecines`, {
        method: "GET",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMedicinesData(data.medicines)
      log.info(data.message, {
        origin: "SHARED_MED_FETCH_SUCCESS",
        "token": token,
      });
      return {success: true, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec de récupération des médicaments partagé", err, {
        origin: "SHARED_MED_FETCH_ERROR",
        "token": token,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, [setMedicinesData]);

  // Fonction pour récupérer les tokens
  const fetchTokens = useCallback(async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/tokens`, {
        method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const sortedTokens = data.tokens.sort((a, b) => a.calendar_name.localeCompare(b.calendar_name));
      setTokensList(sortedTokens);
      log.info(data.message, {
        origin: "TOKENS_FETCH_SUCCESS",
        "uid": auth.currentUser.uid,
        "count": data.tokens?.length,
      });
      return {success: true, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec de récupération des tokens", err, {
        origin: "TOKENS_FETCH_ERROR",
        "uid": auth.currentUser.uid,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, [setTokensList]);

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
      log.info(data.message, {
        origin: "SHARED_CALENDAR_CREATE_SUCCESS",
        "calendarId": calendarId,
        "token": data.token,
      });
      fetchTokens();
      return {success: true, token: data.token, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec de création du lien de partage", err, {
        origin: "SHARED_CALENDAR_CREATE_ERROR",
        "calendarId": calendarId,
      });
      return {success: false, token: null, error: err.message, code: err.code};
    }
  }, [fetchTokens]);

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
      fetchTokens();
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
  }, [fetchTokens]);
  
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
      fetchTokens();
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
  }, [fetchTokens]);

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
      fetchTokens();
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
  }, [fetchTokens]);

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
      fetchTokens();
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
  }, [fetchTokens]);


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

  // Fonction pour récupérer les notifications
  const fetchNotifications = useCallback(async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/notifications`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const sortedNotifications = data.notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setNotificationsData(sortedNotifications);
      log.info(data.message, {
        origin: "NOTIFICATIONS_FETCH_SUCCESS",
        count: data?.notifications?.length,
      });
      return {success: true, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec de récupération des notifications", err, {
        origin: "NOTIFICATIONS_FETCH_ERROR",
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, [setNotificationsData]);

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
      fetchNotifications(); 
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
  }, [fetchNotifications]);

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
      fetchNotifications();
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
  }, [fetchNotifications]);

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
      fetchNotifications();
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
  }, [fetchNotifications]);


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour récupérer les calendriers partagés
  const fetchSharedCalendars = useCallback(async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/shared/users/calendars`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSharedCalendarsData(data.calendars);
      log.info(data.message, {
        origin: "SHARED_CALENDARS_FETCH_SUCCESS",
        count: data?.calendars?.length,
      });
      return {success: true, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec de récupération des calendriers partagés", err, {
        origin: "SHARED_CALENDARS_FETCH_ERROR",
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, [setSharedCalendarsData]);

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
      fetchSharedCalendars();
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
  }, [fetchSharedCalendars]);

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
      log.info(data.message, {
        origin: "SHARED_USERS_FETCH_SUCCESS",
        count: data?.users?.length,
        calendarId,
      });
      return {success: true, message: data.message, code: data.code, data: data.users};
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
  const fetchSharedUserCalendar = useCallback(async (calendarId, startDate) => {
    try {
      if (!startDate) {
        startDate = new Date().toISOString().split('T')[0];
      }
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/shared/users/calendars/${calendarId}?startTime=${startDate}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setCalendarEvents(data.schedule.map(e => ({ title: e.title, start: e.date, color: e.color })));
      log.info(data.message, {
        origin: "SHARED_USER_CALENDAR_FETCH_SUCCESS",
        calendarId,
        startDate,
      });
      return {success: true, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec de récupération du calendrier partagé par un utilisateur", err, {
        origin: "SHARED_USER_CALENDAR_FETCH_ERROR",
        calendarId,
        startDate,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, [setCalendarEvents]);

  // Fonction pour récupérer les médicaments d’un calendrier partagé par un utilisateur
  const fetchSharedUserCalendarMedicines = useCallback(async (calendarId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/shared/users/calendars/${calendarId}/medicines`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMedicinesData(data.medicines);
      setOriginalMedicinesData(JSON.parse(JSON.stringify(data.medicines)));

      log.info(data.message, {
        origin: "SHARED_USER_CALENDAR_MEDICINES_FETCH_SUCCESS",
        calendarId,
      });
      return {success: true, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec de récupération des médicaments du calendrier partagé par un utilisateur", err, {
        origin: "SHARED_USER_CALENDAR_MEDICINES_FETCH_ERROR",
        calendarId,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, [setMedicinesData, setOriginalMedicinesData]);

  // Fonction pour mettre à jour les médicaments d’un calendrier partagé par un utilisateur
  const updateSharedUserCalendarMedicines = useCallback(async (calendarId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/shared/users/calendars/${calendarId}/medicines`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ medicines: medicinesData }),
      }); 
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setOriginalMedicinesData(JSON.parse(JSON.stringify(medicinesData)));

      log.info(data.message, {
        origin: "SHARED_USER_CALENDAR_MEDICINES_UPDATE_SUCCESS",
        calendarId,
      });
      return {success: true, message: data.message, code: data.code};
    } catch (err) {
      log.error(err.message || "Échec de mise à jour des médicaments du calendrier partagé par un utilisateur", err, {
        origin: "SHARED_USER_CALENDAR_MEDICINES_UPDATE_ERROR",
        calendarId,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, [medicinesData]);

  // Fonction pour supprimer les médicaments d’un calendrier partagé par un utilisateur
  const deleteSharedUserCalendarMedicines = useCallback(async (calendarId) => {
    if (checked.length === 0) return false;
  
    setMedicinesData(medicinesData.filter((_, i) => !checked.includes(i)));
  
    const rep = await updateSharedUserCalendarMedicines(calendarId);
    if (rep.success) {
      setChecked([]);
      log.info(rep.message, {
        origin: "SHARED_USER_CALENDAR_MEDICINES_DELETE_SUCCESS",
        calendarId,
      });
      return {success: true, message: "Médicaments supprimés avec succès", code: "SHARED_USER_CALENDAR_MEDICINES_DELETE_SUCCESS"};
    } else {
      log.error(rep.error, {
        origin: "SHARED_USER_CALENDAR_MEDICINES_DELETE_ERROR",
        calendarId,
      });
      return {success: false, error: "Erreur lors de la suppression des médicaments", code: "SHARED_USER_CALENDAR_MEDICINES_DELETE_ERROR"};
    }
  }, [medicinesData, checked, updateMedicines]);

  const sharedProps = {
    // 📅 CALENDRIERS
    calendars: {
      calendarsData, setCalendarsData,                 // Liste des calendriers de l’utilisateur
      sharedCalendarsData, setSharedCalendarsData,     // Liste des calendriers partagés
      fetchCalendars,                                  // Récupération des calendriers (Firestore)
      fetchSharedCalendars,                            // Récupération des calendriers partagés
      addCalendar,                                     // Création d’un nouveau calendrier
      deleteCalendar,                                  // Suppression d’un calendrier existant
      deleteSharedCalendar,                            // Suppression d’un calendrier partagé
      renameCalendar,                                  // Renommage d’un calendrier
      getMedicineCount,                                // Nombre de médicaments dans un calendrier
      getSharedMedicineCount,                          // Nombre de médicaments dans un calendrier partagé
    },
  
    // 🗓️ ÉVÉNEMENTS DU CALENDRIER
    events: {
      calendarEvents, setCalendarEvents,              // Événements affichés dans le calendrier
      selectedDate, setSelectedDate,                  // Date actuellement sélectionnée
      eventsForDay, setEventsForDay,                  // Événements filtrés pour un jour spécifique
      startDate, setStartDate,                        // Date de début pour affichage du calendrier
      calendarsData, setCalendarsData,                // (Redondant, mais peut être utile si nécessaire localement)
      fetchCalendar,                                    // Chargement des données d’un calendrier
    },
  
    // 💊 MÉDICAMENTS
    medicines: {
      medicinesData, setMedicinesData,                          // Liste des médicaments du calendrier actif
      originalMedicinesData, setOriginalMedicinesData,          // Liste des médicaments d’origine
      checked, setChecked,                            // Médicaments cochés pour suppression
      //handleMedChange,                                // Fonction pour modifier un médicament
      updateMedicines,                                     // Mise à jour des médicaments dans Firestore
      deleteSelectedMedicines,                             // Suppression des médicaments sélectionnés
      addMedicine,                                         // Ajout d’un nouveau médicament
      fetchCalendarMedicines,                        // Récupération des médicaments d’un calendrier
    },
  
    // 🔗 LIENS DE PARTAGE (TOKENS)
    sharedTokens: {
      tokensList, setTokensList,                      // Liste des tokens
      fetchTokens,                                    // Récupération des tokens
      createToken,                      // Création d’un lien de partage
      deleteToken,                      // Suppression d’un lien de partage
      updateRevokeToken,                              // Révoquer un token ou le réactiver
      updateTokenExpiration,                          // Mettre à jour l'expiration d'un token
      updateTokenPermissions,                         // Mettre à jour les permissions d'un token
      fetchSharedTokenCalendar,                       // Récupération d’un calendrier partagé
      fetchSharedTokenMedicines,                        // Récupération des médicaments partagés
    },
  
    // 👥 UTILISATEURS PARTAGÉS
    sharedUsers: {
      fetchSharedUsers,                               // Récupération des utilisateurs partagés
      deleteSharedUser,                               // Suppression d’un utilisateur partagé
      fetchSharedUserCalendar,                        // Récupération d’un calendrier partagé
      fetchSharedUserCalendarMedicines,               // Récupération des médicaments d’un calendrier partagé
      updateSharedUserCalendarMedicines,              // Mise à jour des médicaments d’un calendrier partagé
      deleteSharedUserCalendarMedicines,              // Suppression des médicaments d’un calendrier partagé
    },
  
    // ✉️ INVITATIONS
    invitations: {
      sendInvitation,                                 // Envoyer une invitation à un utilisateur
      acceptInvitation,                               // Accepter une invitation
      rejectInvitation,                               // Rejeter une invitation
    },
  
    // 🔔 NOTIFICATIONS
    notifications: {
      notificationsData, setNotificationsData,        // Liste des notifications
      fetchNotifications,                             // Récupération des notifications
      readNotification,                               // Marquer une notification comme lue
    },
  };
  

  const resetAppData = () => {
    // EVENTS
    setCalendarEvents([]);
    setSelectedDate(null);
    setEventsForDay([]);
    setStartDate(null);
  
    // MEDICINES
    setMedicinesData([]);
    setChecked([]);
    setOriginalMedicinesData([]);
    
    // CALENDARS
    setCalendarsData([]);
    
    // TOKENS
    setTokensList([]);

    // NOTIFICATIONS
    setNotificationsData([]);

    // SHARED CALENDARS
    setSharedCalendarsData([]);
  };

  useEffect(() => {
    if (authReady && currentUser === null) {
      resetAppData(); // 🔥 Reset tout
    }
  }, [authReady, currentUser]);
  
  

  return (
    <Router>
      <Navbar sharedProps={sharedProps}/>
      <div className="container mt-4">
        <AppRoutes sharedProps={sharedProps} />
      </div>
      <Footer />
    </Router>
  );
}

export default App;