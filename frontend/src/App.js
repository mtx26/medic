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
  const [medsData, setMedsData] = useState([]);
  const [checked, setChecked] = useState([]);
  const [tokensList, setTokensList] = useState([]);
  const [calendarsData, setCalendarsData] = useState([]);
  const [originalMedsData, setOriginalMedsData] = useState([]);
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
      if (!res.ok) throw new Error("Erreur HTTP GET /api/calendars");
      const data = await res.json();
      log.info("Calendriers récupérés avec succès", {
        id: "CALENDARS_FETCH_SUCCESS",
        origin: "App.js",
        count: data.calendars?.length,
      });
      // trier les calendriers par ordre alphabétique
      const sortedCalendars = data.calendars.sort((a, b) => a.calendar_name.localeCompare(b.calendar_name));
      setCalendarsData(sortedCalendars);

    } catch (err) {
      log.error("Échec de récupération des calendriers", err, {
        id: "CALENDARS_FETCH_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
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
      if (!res.ok) throw new Error("Erreur HTTP POST /api/calendars");
      fetchCalendars();
      log.info("Calendrier créé avec succès", {
        id: "CALENDAR_CREATE_SUCCESS",
        origin: "App.js",
        calendarName,
      });
      return true;
    } catch (err) {
      log.error("Échec de création du calendrier", err, {
        id: "CALENDAR_CREATE_FAIL",
        origin: "App.js",
        calendarName,
        stack: err.stack,
      });
      return false;
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
      if (!res.ok) throw new Error("Erreur HTTP DELETE /api/calendars");
      fetchCalendars();
      log.info("Calendrier supprimé avec succès", {
        id: "CALENDAR_DELETE_SUCCESS",
        origin: "App.js",
        calendarId,
      });
      return true;
    } catch (err) {
      log.error("Échec de suppression du calendrier", err, {
        id: "CALENDAR_DELETE_FAIL",
        origin: "App.js",
        calendarId,
        stack: err.stack,
      });
      return false;
    }
  }, [fetchCalendars]);

  // Fonction pour renommer un calendrier

  const RenameCalendar = useCallback(async (calendarId, newCalendarName) => {
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
      if (!res.ok) throw new Error("Erreur HTTP PUT /api/calendars");
      fetchCalendars();
      log.info("Calendrier renommé avec succès", {
        id: "CALENDAR_RENAME_SUCCESS",
        origin: "App.js",
        calendarId,
        newCalendarName,
      });
      return true;
    } catch (err) {
      log.error("Échec de renommage du calendrier", err, {
        id: "CALENDAR_RENAME_FAIL",
        origin: "App.js",
        calendarId,
        newCalendarName,
        stack: err.stack,
      });
      return false;
    }
  }, [fetchCalendars]);

  // Fonction pour obtenir le nombre de médicaments d'un calendrier 

  const getMedicineCount = useCallback(async (calendarId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/countmedicines?calendarId=${calendarId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });
      if (!res.ok) throw new Error("Erreur HTTP GET /api/medicines");
      const data = await res.json();
      log.info("Nombre de médicaments récupéré avec succès", {
        id: "MED_COUNT_SUCCESS",
        origin: "App.js",
        calendarId,
        count: data.count,
      });
      return data.count ?? 0;
    } catch (err) {
      log.error("Échec de récupération du nombre de médicaments", err, {
        id: "MED_COUNT_FAIL",
        origin: "App.js",
        calendarId,
        stack: err.stack,
      });
      return 0;
    }
  }, []);

  // Fonction pour obtenir le nombre de médicaments d'un calendrier partagé
  const getSharedMedicineCount = useCallback(async (calendarId, ownerUid) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/shared/countmedicines?calendarId=${calendarId}&ownerUid=${ownerUid}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Erreur HTTP GET /api/shared/countmedicines");
      const data = await res.json();
      log.info("Nombre de médicaments récupéré avec succès", {
        id: "SHARED_MED_COUNT_SUCCESS",
        origin: "App.js",
        calendarId,
        ownerUid,
        count: data.count,
      });
      return data.count;
    } catch (err) {
      log.error("Échec de récupération du nombre de médicaments partagé", err, {
        id: "SHARED_MED_COUNT_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
      return 0;
    }
  }, []);

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  // Fonction pour obtenir le calendrier lier au calendarName
  const getCalendar = useCallback(async (calendarId, startDate ) => {
    try {
      if (!calendarId) {
        log.warn("Nom de calendrier non fourni, calendrier non chargé.", {
          id: "CALENDAR_NAME_NOT_PROVIDED",
          origin: "App.js",
        });
        return;
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
      if (!res.ok) throw new Error(`Erreur HTTP GET /api/calendars/${calendarId}/calendar`);
      const data = await res.json();
      setCalendarEvents(data.schedule.map(e => ({ title: e.title, start: e.date, color: e.color })));
      log.info("Calendrier récupéré avec succès", {
        id: "CALENDAR_FETCH_SUCCESS",
        origin: "App.js",
        eventCount: data?.length,
        calendarId: calendarId,
      });
      return true;
    } catch (err) {
      log.error("Échec de récupération du calendrier", err, {
        id: "CALENDAR_FETCH_FAIL",
        origin: "App.js",
        calendarId: calendarId,
        startDate,
        stack: err.stack,
      });
      return false;
    }
  }, [setCalendarEvents]);

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour obtenir les différents médicaments
  const fetchCalendarsMedecines = useCallback(async (calendarId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/calendars/${calendarId}/medicines`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Erreur HTTP GET /api/calendars/${calendarId}/medicines`);
      const data = await res.json();
      setMedsData(data.medicines)
      setOriginalMedsData(JSON.parse(JSON.stringify(data.medicines)));
      log.info("Médicaments récupérés avec succès", {
        id: "MED_FETCH_SUCCESS",
        origin: "App.js",
        count: data.medicines?.length,
        calendarId,
      });
    } catch (err) {
      log.error("Échec de récupération des médicaments", err, {
        id: "MED_FETCH_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
    }
  }, [setMedsData, setOriginalMedsData]);
    


  // Fonction pour mettre à jour un médicament dans la variable meds
  const handleMedChange = useCallback((index, field, value) => {
    if (value !== null && field !== null && index !== null) {
      const updated = [...medsData];
      const numericFields = ['tablet_count', 'interval_days'];
      if (field === 'time') {
        updated[index][field] = [value];
      } else if (numericFields.includes(field)) {
        updated[index][field] = value === '' ? '' : parseFloat(value);
      } else {
        updated[index][field] = value;
      }
      setMedsData(updated);
    }
    else {
      log.warn("Valeur indéfinie pour le champ", {
        id: "MED_CHANGE_UNDEFINED_VALUE",
        origin: "App.js",
        field,
        index,
      });
    }
  }, [medsData, setMedsData]);

    // Fonction pour mettre à jour les médicaments
  const updateMeds = useCallback(async (calendarName, newMeds = medsData) => {
    try {
      if (medsData.length === 0) {
        log.warn("Aucun médicament à mettre à jour", {
          id: "MED_UPDATE_NO_MEDS",
          origin: "App.js",
          calendarName,
        });
        return false;
      };

      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/calendars/${calendarName}/medicines`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ medicines: newMeds  }),
      });
      if (!res.ok) throw new Error(`Erreur HTTP POST /api/calendars/${calendarName}/medicines`);
      log.info("Médicaments mis à jour avec succès", {
        id: "MED_UPDATE_SUCCESS",
        origin: "App.js",
        count: newMeds?.length,
      });
      return true;
    } catch (err) {
      log.error("Échec de mise à jour des médicaments", err, {
        id: "MED_UPDATE_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
      return false;
    }
  }, [medsData]);


  // Fonction pour supprimer des médicaments 
  const deleteSelectedMeds = useCallback(async (nameCalendar) => {
    if (checked.length === 0) return false;
  
    const updatedMeds = medsData.filter((_, i) => !checked.includes(i));
    setMedsData(updatedMeds);
    setChecked([]);
  
    const success = await updateMeds(nameCalendar, updatedMeds);
  
    if (success) {
      log.info("Médicaments supprimés avec succès", {
        id: "MED_DELETE_SUCCESS",
        origin: "App.js",
        count: checked.length,
      });
    } else {
      log.error("Échec de suppression des médicaments", {
        id: "MED_DELETE_FAIL",
        origin: "App.js",
        count: checked.length,
      });
    }
    return success;
  }, [checked, medsData, setMedsData, setChecked, updateMeds]);
  

  // Fonction pour ajouter un nouveau médicament sanq la variable meds
  const addMed = useCallback(() => {
    setMedsData([
      ...medsData,
      { name: '', tablet_count: 1, time: ['morning'], interval_days: 1, start_date: '' },
    ]);
  }, [medsData, setMedsData]);

//////////////////////////////////////////////////////////////////////////////////////////////////


  // Fonction pour recupérer un calendrier partagé par sharedTokens
  const fetchSharedTokenCalendar = useCallback(async (sharedToken, startDate) => {
    try {
      if (!startDate) {
        startDate = new Date().toISOString().slice(0, 10);
      }
      
      const res = await fetch(`${API_URL}/api/shared/${sharedToken}?startTime=${startDate}`, {
        method: "GET",
      });
      if (!res.ok) throw new Error(`Erreur HTTP GET /api/shared/${sharedToken}`);
      const data = await res.json();
      setCalendarEvents(data.map(e => ({ title: e.title, start: e.date, color: e.color })));
      log.info("Calendrier partagé recuperé avec succès", {
        id: "SHARED_CALENDAR_FETCH_SUCCESS",
        origin: "App.js",
        count: data?.length,
      });
      return true;
    } catch (err) {
      log.error("Échec de récupération du calendrier partagé", err, {
        id: "SHARED_CALENDAR_FETCH_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
      return false;
    }
  }, [setCalendarEvents]);

  // Fonction pour récupérer les médicaments d'un calendrier partagé
  const getSharedTokenMedecines = useCallback(async (sharedToken) => {
    try {
      const  res = await fetch(`${API_URL}/api/shared/${sharedToken}/medecines`, {
        method: "GET",
      });
      if (!res.ok) throw new Error(`Erreur HTTP GET /api/shared/${sharedToken}/medecines`);
      const data = await res.json();
      setMedsData(data.medicines)
      log.info("Médicaments récupérés avec succès", {
        id: "SHARED_MED_FETCH_SUCCESS",
        origin: "App.js",
        count: data.medicines?.length,
      });
      return true;
    } catch (err) {
      log.error("Échec de récupération des médicaments partagé", err, {
        id: "SHARED_MED_FETCH_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
      return false;
    }
  }, [setMedsData]);
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour récupérer les tokens
  const fetchTokens = useCallback(async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/tokens`, {
        method: "GET",
      headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`Erreur HTTP GET /api/tokens`);
      const data = await res.json();
      const sortedTokens = data.tokens.sort((a, b) => a.calendar_name.localeCompare(b.calendar_name));
      setTokensList(sortedTokens);
      log.info("Tokens récupérés avec succès", {
        id: "TOKENS_FETCH_SUCCESS",
        origin: "App.js",
        count: data.tokens?.length,
      });
      return true;
    } catch (err) {
      log.error("Échec de récupération des tokens", err, {
        id: "TOKENS_FETCH_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
      return false;
    }
  }, [setTokensList]);

  // Fonction pour créer un lien de partage
  const createSharedTokenCalendar = useCallback(async (calendarId, expiresAt, permissions) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/set-shared/${calendarId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ expiresAt, permissions }),
      });
      if (!res.ok) throw new Error(`Erreur HTTP POST /api/set-shared/${calendarId}`);
      const data = await res.json();
      log.info("Lien de partage créé avec succès", {
        id: "SHARED_CALENDAR_CREATE_SUCCESS",
        origin: "App.js",
        calendarId,
        token: data.token,
      });
      fetchTokens();
      return {token: data.token, success: true};
    } catch (err) {
      log.error("Échec de création du lien de partage", err, {
        id: "SHARED_CALENDAR_CREATE_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
      return {token: null, success: false};
    }
  }, [fetchTokens]);

  // Fonction pour supprimer un lien de partage
  const deleteSharedTokenCalendar = useCallback(async (token) => {
    try {
      const tokenFirebase = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/shared/${token}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${tokenFirebase}`,
        },
      });
      if (!res.ok) throw new Error(`Erreur HTTP DELETE /api/shared/${token}`);
      fetchTokens();
      log.info("Lien de partage supprimé avec succès", {
        id: "SHARED_CALENDAR_DELETE_SUCCESS",
        origin: "App.js",
        token,
      });
      return true;
    } catch (err) {
      log.error("Échec de suppression du lien de partage", err, {
        id: "SHARED_CALENDAR_DELETE_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
      return false;
    }
  }, [fetchTokens]);
  
  // Fonction pour revoker un token
  const revokeToken = useCallback(async (token) => {
    try {
      const tokenFirebase = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/revoke-token/${token}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenFirebase}`,
        },
      });
      if (!res.ok) throw new Error(`Erreur HTTP POST /api/revoke-token/${token}`);
      fetchTokens();
      log.info("Token révoqué avec succès", {
        id: "TOKEN_REVOKE_SUCCESS",
        origin: "App.js",
        token,
      });
      return true;
    } catch (err) {
      log.error("Échec de révoquer le token", err, {
        id: "TOKEN_REVOKE_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
      return false;
    }
  }, [fetchTokens]);

  // Fonction pour mettre à jour l'expiration d'un token
  const updateTokenExpiration = useCallback(async (token, expiresAt) => {
    try {
      const tokenFirebase = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/update-token-expiration/${token}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${tokenFirebase}`,
        },
        body: JSON.stringify({ expiresAt }),
      });
      if (!res.ok) throw new Error(`Erreur HTTP POST /api/update-token-expiration/${token}`);
      fetchTokens();
      log.info("Expiration du token mise à jour avec succès", {
        id: "TOKEN_EXPIRATION_UPDATE_SUCCESS",
        origin: "App.js",
        token,
        expiresAt,
      });
      return true;
    } catch (err) {
      log.error("Échec de mise à jour de l'expiration du token", err, {
        id: "TOKEN_EXPIRATION_UPDATE_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
      return false;
    }
  }, [fetchTokens]);

  // Fonction pour mettre à jour les permissions d'un token
  const updateTokenPermissions = useCallback(async (token, permissions) => {
    try {
      const tokenFirebase = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/update-token-permissions/${token}`, {
        method: "POST",
          headers: {
          Authorization: `Bearer ${tokenFirebase}`,
        },
        body: JSON.stringify({ permissions }),
      });
      if (!res.ok) throw new Error(`Erreur HTTP POST /api/update-token-permissions/${token}`);
      fetchTokens();
      log.info("Permissions du token mises à jour avec succès", {
        id: "TOKEN_PERMISSIONS_UPDATE_SUCCESS",
        origin: "App.js",
        token,
        permissions,
      });
      return true;
    } catch (err) {
      log.error("Échec de mise à jour des permissions du token", err, {
        id: "TOKEN_PERMISSIONS_UPDATE_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
      return false;
    }
  }, [fetchTokens]);

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour envoyer une invitation à un utilisateur
  const sendInvitation = useCallback(async (email, calendarId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/send-invitation/${calendarId}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(`Erreur HTTP POST /api/send-invitation/${calendarId}`);
      log.info("Invitation envoyée avec succès", {
        id: "INVITATION_SEND_SUCCESS",
        origin: "App.js",
        email,
        calendarId,
      });
      return true;
    } catch (err) {
      log.error("Échec d'envoi de l'invitation", err, {
        id: "INVITATION_SEND_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
      return false;
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
      if (!res.ok) throw new Error(`Erreur HTTP GET /api/notifications`);
      const data = await res.json();
      const sortedNotifications = data.notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setNotificationsData(sortedNotifications);
      log.info("Notifications récupérées avec succès", {
        id: "NOTIFICATIONS_FETCH_SUCCESS",
        origin: "App.js",
        count: data?.notifications?.length,
      });
      return true;
    } catch (err) {
      log.error("Échec de récupération des notifications", err, {
        id: "NOTIFICATIONS_FETCH_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
      return false;
    }
  }, [setNotificationsData]);

  // Fonction pour accepter une invitation
  const acceptInvitation = useCallback(async (notificationToken) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/accept-invitation/${notificationToken}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Erreur HTTP POST /api/accept-invitation/${notificationToken}`);
      fetchNotifications(); 
      log.info("Invitation acceptée avec succès", {
        id: "INVITATION_ACCEPT_SUCCESS",
        origin: "App.js",
        notificationToken,
      });
      return true;
    } catch (err) {
      log.error("Échec d'acceptation de l'invitation", err, {
        id: "INVITATION_ACCEPT_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
      return false;
    }
  }, [fetchNotifications]);

  // Fonction pour rejeter une invitation
  const rejectInvitation = useCallback(async (notificationToken) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/reject-invitation/${notificationToken}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Erreur HTTP POST /api/reject-invitation/${notificationToken}`);
      fetchNotifications();
      log.info("Invitation rejetée avec succès", {
        id: "INVITATION_REJECT_SUCCESS",
        origin: "App.js",
        notificationToken,
      });
      return true;
    } catch (err) {
      log.error("Échec de rejet de l'invitation", err, {
        id: "INVITATION_REJECT_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
      return false;
    }
  }, [fetchNotifications]);

  // Fonction pour marquer une notification comme lue
  const readNotification = useCallback(async (notificationToken) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/notifications/${notificationToken}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Erreur HTTP POST /api/notifications/${notificationToken}`);
      fetchNotifications();
      log.info("Notification marquée comme lue avec succès", {
        id: "NOTIFICATION_READ_SUCCESS",
        origin: "App.js",
        notificationToken,
      });
      return true;
    } catch (err) {
      log.error("Échec de marquer la notification comme lue", err, {
        id: "NOTIFICATION_READ_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
      return false;
    }
  }, [fetchNotifications]);


  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

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
      if (!res.ok) throw new Error(`Erreur HTTP GET /api/shared/users/calendars`);
      const data = await res.json();
      setSharedCalendarsData(data.calendars);
      log.info("Calendriers partagés récupérés avec succès", {
        id: "SHARED_CALENDARS_FETCH_SUCCESS",
        origin: "App.js",
        count: data?.calendars?.length,
      });
      return true;
    } catch (err) {
      log.error("Échec de récupération des calendriers partagés", err, {
        id: "SHARED_CALENDARS_FETCH_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
      return false;
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
      if (!res.ok) throw new Error(`Erreur HTTP DELETE /api/shared/users/calendars/${calendarId}`);
      fetchSharedCalendars();
      log.info("Calendrier partagé supprimé avec succès", {
        id: "SHARED_CALENDAR_DELETE_SUCCESS",
        origin: "App.js",
        calendarId,
      });
      return true;
    } catch (err) {
      log.error("Échec de suppression du calendrier partagé", err, {
        id: "SHARED_CALENDAR_DELETE_FAIL",
        origin: "App.js",
        stack: err.stack,
        calendarId,
      });
      return false;
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
      if (!res.ok) throw new Error(`Erreur HTTP GET /api/shared/users/users/${calendarId}`);
      const data = await res.json();
      log.info("Utilisateurs partagés récupérés avec succès", {
        id: "SHARED_USERS_FETCH_SUCCESS",
        origin: "App.js",
        count: data?.users?.length,
      });
      return data.users;
    } catch (err) {
      log.error("Échec de récupération des utilisateurs partagés", err, {
        id: "SHARED_USERS_FETCH_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
      return [];
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
      if (!res.ok) throw new Error(`Erreur HTTP DELETE /api/shared/users/${calendarId}/${userId}`);
      log.info("Utilisateur partagé supprimé avec succès", {
        id: "SHARED_USER_DELETE_SUCCESS",
        origin: "App.js",
        calendarId,
        userId,
      });
      return true;
    } catch (err) {
      log.error("Échec de suppression de l'utilisateur partagé", err, {
        id: "SHARED_USER_DELETE_FAIL",
        origin: "App.js",
        stack: err.stack,
        calendarId,
        userId,
      });
      return false;
    }
  }, []);

  // Fonction pour recup le calendrier partagé par un utilisateur
  const fetchSharedUserCalendar = useCallback(async (calendarId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/shared/user-calendar/${calendarId}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Erreur HTTP GET /api/shared/user-calendar/${calendarId}`);
      const data = await res.json();
      return data;
    } catch (err) {
      log.error("Échec de récupération du calendrier partagé par un utilisateur", err, {
        id: "SHARED_USER_CALENDAR_FETCH_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
      return false;
    }
  }, []);
  
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
      RenameCalendar,                                  // Renommage d’un calendrier
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
      getCalendar,                                    // Chargement des données d’un calendrier
    },
  
    // 💊 MÉDICAMENTS
    meds: {
      medsData, setMedsData,                          // Liste des médicaments du calendrier actif
      originalMedsData, setOriginalMedsData,          // Liste des médicaments d’origine
      checked, setChecked,                            // Médicaments cochés pour suppression
      handleMedChange,                                // Fonction pour modifier un médicament
      updateMeds,                                     // Mise à jour des médicaments dans Firestore
      deleteSelectedMeds,                             // Suppression des médicaments sélectionnés
      addMed,                                         // Ajout d’un nouveau médicament
      fetchCalendarsMedecines,                        // Récupération des médicaments d’un calendrier
    },
  
    // 🔗 LIENS DE PARTAGE (TOKENS)
    sharedTokens: {
      tokensList, setTokensList,                      // Liste des tokens
      fetchTokens,                                    // Récupération des tokens
      createSharedTokenCalendar,                      // Création d’un lien de partage
      deleteSharedTokenCalendar,                      // Suppression d’un lien de partage
      revokeToken,                                    // Révoquer un token ou le réactiver
      updateTokenExpiration,                          // Mettre à jour l'expiration d'un token
      updateTokenPermissions,                         // Mettre à jour les permissions d'un token
      fetchSharedTokenCalendar,                       // Récupération d’un calendrier partagé
      getSharedTokenMedecines,                        // Récupération des médicaments partagés
    },
  
    // 👥 UTILISATEURS PARTAGÉS
    sharedUsers: {
      fetchSharedUsers,                               // Récupération des utilisateurs partagés
      deleteSharedUser,                               // Suppression d’un utilisateur partagé
      fetchSharedUserCalendar,                        // Récupération d’un calendrier partagé
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
  
    // MEDS
    setMedsData([]);
    setChecked([]);
    setOriginalMedsData([]);
    
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