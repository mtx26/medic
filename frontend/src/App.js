// App.js
import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/Header';
import Footer from './components/Footer';
import AppRoutes from './routes/AppRouter';
import { log } from './utils/logger';
import { auth } from './services/firebase';
import { AuthContext } from './contexts/LoginContext';


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
  const [sharedUsersData, setSharedUsersData] = useState([]);

  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));

  const { authReady, currentUser } = useContext(AuthContext);


  // Fonction pour obtenir les calendriers
  const fetchCalendars = async () => {
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
      setCalendarsData(data.calendars ?? []);

    } catch (err) {
      log.error("Échec de récupération des calendriers", err, {
        id: "CALENDARS_FETCH_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
    }
  };

  // Fonction pour ajouter un calendrier

  const addCalendar = async (calendarName) => {
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
  };

  // Fonction pour supprimer un calendrier

  const deleteCalendar = async (calendarName) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/calendars`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ calendarName }),
      });
      if (!res.ok) throw new Error("Erreur HTTP DELETE /api/calendars");
      fetchCalendars();
      log.info("Calendrier supprimé avec succès", {
        id: "CALENDAR_DELETE_SUCCESS",
        origin: "App.js",
        calendarName,
      });
    } catch (err) {
      log.error("Échec de suppression du calendrier", err, {
        id: "CALENDAR_DELETE_FAIL",
        origin: "App.js",
        calendarName,
        stack: err.stack,
      });
    }
  };

  // Fonction pour renommer un calendrier

  const RenameCalendar = async (oldCalendarName, newCalendarName) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/calendars`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ oldCalendarName, newCalendarName }),
      });
      if (!res.ok) throw new Error("Erreur HTTP PUT /api/calendars");
      fetchCalendars();
      log.info("Calendrier renommé avec succès", {
        id: "CALENDAR_RENAME_SUCCESS",
        origin: "App.js",
        oldCalendarName,
        newCalendarName,
      });
    } catch (err) {
      log.error("Échec de renommage du calendrier", err, {
        id: "CALENDAR_RENAME_FAIL",
        origin: "App.js",
        oldCalendarName,
        newCalendarName,
        stack: err.stack,
      });
    }
  };

  // Fonction pour obtenir le nombre de médicaments d'un calendrier 

  const getMedicineCount = async (calendarName) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/countmedicines?calendarName=${calendarName}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
      });
      if (!res.ok) throw new Error("Erreur HTTP GET /api/medicines");
      const data = await res.json();
      const count = data.count;
      log.info("Nombre de médicaments récupéré avec succès", {
        id: "MED_COUNT_SUCCESS",
        origin: "App.js",
        calendarName,
        count,
      });
      return count ?? 0;
    } catch (err) {
      log.error("Échec de récupération du nombre de médicaments", err, {
        id: "MED_COUNT_FAIL",
        origin: "App.js",
        calendarName,
        stack: err.stack,
      });
      return 0;
    }
  };

  // Fonction pour obtenir le nombre de médicaments d'un calendrier partagé
  const getSharedMedicineCount = async (calendarName, calendarOwnerUid) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/shared/countmedicines?calendarName=${calendarName}&calendarOwnerUid=${calendarOwnerUid}`, {
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
        calendarName,
        calendarOwnerUid,
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
  };

  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  // Fonction pour obtenir le calendrier lier au calendarName
  const getCalendar = async (calendarName, startDate ) => {
    try {
      if (!currentUser) {
        log.warn("Utilisateur non connecté, calendrier non chargé.", {
          id: "USER_NOT_AUTHENTICATED",
          origin: "App.js",
        });
        return;
      }
      if (!calendarName) {
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
      const res = await fetch(`${API_URL}/api/calendars/${calendarName}/calendar?startTime=${startDate}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Erreur HTTP GET /api/calendars/${calendarName}/calendar`);
      const data = await res.json();
      setCalendarEvents(data.map(e => ({ title: e.title, start: e.date, color: e.color })));
      log.info("Calendrier récupéré avec succès", {
        id: "CALENDAR_FETCH_SUCCESS",
        origin: "App.js",
        eventCount: data?.length,
        calendarName: calendarName,
      });
    } catch (err) {
      log.error("Échec de récupération du calendrier", err, {
        id: "CALENDAR_FETCH_FAIL",
        origin: "App.js",
        calendarName: calendarName,
        startDate,
        stack: err.stack,
      });
    }
  };

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour obtenir les différents médicaments
  const fetchCalendarsMedecines = async (calendarName) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/calendars/${calendarName}/medicines`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Erreur HTTP GET /api/calendars/${calendarName}/medicines`);
      const data = await res.json();
      setMedsData(data.medicines)
      setOriginalMedsData(JSON.parse(JSON.stringify(data.medicines)));
      log.info("Médicaments récupérés avec succès", {
        id: "MED_FETCH_SUCCESS",
        origin: "App.js",
        count: medsData?.length,
      });
    } catch (err) {
      log.error("Échec de récupération des médicaments", err, {
        id: "MED_FETCH_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
    }
  };
    


  // Fonction pour mettre à jour un médicament dans la variable meds
  const handleMedChange = (index, field, value) => {
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
  };

    // Fonction pour mettre à jour les médicaments
  const updateMeds = async (calendarName, newMeds = medsData) => {
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
  };


  // Fonction pour supprimer des médicaments 
  const deleteSelectedMeds = async (nameCalendar) => {
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
  };
  

  // Fonction pour ajouter un nouveau médicament sanq la variable meds
  const addMed = () => {
    setMedsData([
      ...medsData,
      { name: '', tablet_count: 1, time: ['morning'], interval_days: 1, start_date: '' },
    ]);
  };

//////////////////////////////////////////////////////////////////////////////////////////////////


  // Fonction pour recupérer un calendrier partagé par sharedTokens
  const getSharedCalendar = async (sharedToken, startDate) => {
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
  }

  // Fonction pour récupérer les médicaments d'un calendrier partagé
  const getSharedMedecines = async (sharedToken) => {
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
        count: medsData?.length,
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
  }
  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour récupérer les tokens
  const fetchTokens = async () => {
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
  }

  // Fonction pour créer un lien de partage
  const createSharedTokenCalendar = async (calendarName, expiresAt, permissions) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/set-shared/${calendarName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ expiresAt, permissions }),
      });
      if (!res.ok) throw new Error(`Erreur HTTP POST /api/set-shared/${calendarName}`);
      const data = await res.json();
      log.info("Lien de partage créé avec succès", {
        id: "SHARED_CALENDAR_CREATE_SUCCESS",
        origin: "App.js",
        calendarName,
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
  }

  // Fonction pour supprimer un lien de partage
  const deleteSharedTokenCalendar = async (token) => {
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
  }
  
  // Fonction pour revoker un token
  const revokeToken = async (token) => {
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
  }

  // Fonction pour mettre à jour l'expiration d'un token
  const updateTokenExpiration = async (token, expiresAt) => {
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
  }

  // Fonction pour mettre à jour les permissions d'un token
  const updateTokenPermissions = async (token, permissions) => {
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
  }

  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  // Fonction pour envoyer une invitation à un utilisateur
  const sendInvitation = async (email, calendarName) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/send-invitation/${calendarName}`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error(`Erreur HTTP POST /api/send-invitation/${calendarName}`);
      log.info("Invitation envoyée avec succès", {
        id: "INVITATION_SEND_SUCCESS",
        origin: "App.js",
        email,
        calendarName,
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
  }

  // Fonction pour récupérer les notifications
  const fetchNotifications = async () => {
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
  }

  // Fonction pour accepter une invitation
  const acceptInvitation = async (notificationToken) => {
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
  }

  // Fonction pour rejeter une invitation
  const rejectInvitation = async (notificationToken) => {
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
  }

  // Fonction pour marquer une notification comme lue
  const readNotification = async (notificationToken) => {
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
  }

  // Fonction pour récupérer les calendriers partagés
  const fetchSharedCalendars = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/shared/calendars`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Erreur HTTP GET /api/shared/calendars`);
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
  }

  // Fonction pour supprimer un calendrier partagé
  const deleteSharedCalendar = async (calendarName) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/shared/calendars/${calendarName}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Erreur HTTP DELETE /api/shared/${calendarName}`);
      fetchSharedCalendars();
      log.info("Calendrier partagé supprimé avec succès", {
        id: "SHARED_CALENDAR_DELETE_SUCCESS",
        origin: "App.js",
        calendarName,
      });
      return true;
    } catch (err) {
      log.error("Échec de suppression du calendrier partagé", err, {
        id: "SHARED_CALENDAR_DELETE_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
      return false;
    }
  }

  // Fonction pour récupérer les différentes utilisateurs ayant accès à un calendrier
  const fetchSharedUsers = async (calendarName) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/shared/users/${calendarName}`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Erreur HTTP GET /api/shared/users/${calendarName}`);
      const data = await res.json();
      setSharedUsersData(data.users);
      log.info("Utilisateurs partagés récupérés avec succès", {
        id: "SHARED_USERS_FETCH_SUCCESS",
        origin: "App.js",
        count: data?.users?.length,
      });
      return true;
    } catch (err) {
      log.error("Échec de récupération des utilisateurs partagés", err, {
        id: "SHARED_USERS_FETCH_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
      return false;
    }
  }
  
  
  const sharedProps = {
    // 🗓️ ÉVÉNEMENTS DU CALENDRIER
    events: {
      calendarEvents, setCalendarEvents,      // Événements affichés dans le calendrier
      selectedDate, setSelectedDate,          // Date actuellement sélectionnée
      eventsForDay, setEventsForDay,          // Événements filtrés pour un jour spécifique
      startDate, setStartDate,                // Date de début pour affichage du calendrier
      calendarsData, setCalendarsData,        // Liste des calendriers de l’utilisateur
      getCalendar,                            // Chargement des données d’un calendrier
    },
    meds: {
      // 💊 MÉDICAMENTS
      medsData, setMedsData,                  // Liste des médicaments du calendrier actif
      checked, setChecked,                    // Médicaments cochés pour suppression
      calendarsData, setCalendarsData,        // Liste des calendriers de l’utilisateur
      originalMedsData, setOriginalMedsData,  // Liste des médicaments d’origine
      handleMedChange,                        // Fonction pour modifier un médicament
      updateMeds,                             // Mise à jour des médicaments dans Firestore
      deleteSelectedMeds,                     // Suppression des médicaments sélectionnés
      addMed,                                 // Ajout d’un nouveau médicament
      fetchCalendarsMedecines,                // Récupération des médicaments d’un calendrier
    },
    calendars: {
      // 📅 CALENDRIERS
      calendarsData, setCalendarsData,        // Liste des calendriers de l’utilisateur
      sharedCalendarsData, setSharedCalendarsData, // Liste des calendriers partagés
      fetchCalendars,                         // Récupération des calendriers (Firestore)
      addCalendar,                            // Création d’un nouveau calendrier
      deleteCalendar,                         // Suppression d’un calendrier existant
      RenameCalendar,                         // Renommage d’un calendrier
      getMedicineCount,                       // Nombre de médicaments dans un calendrier
      getSharedMedicineCount,                 // Nombre de médicaments dans un calendrier partagé
      fetchSharedCalendars,                   // Récupération des calendriers partagés
      deleteSharedCalendar,                   // Suppression d’un calendrier partagé
    },
    shared: {
      medsData, setMedsData,                  // Liste des médicaments du calendrier actif      
      getSharedCalendar,                      // Récupération d’un calendrier partagé
      getSharedMedecines,                     // Récupération des médicaments partagé

    },
    tokens: {
      tokensList, setTokensList,              // Liste des tokens
      fetchTokens,                            // Récupération des tokens
      createSharedTokenCalendar,              // Création d’un lien de partage
      deleteSharedTokenCalendar,              // Suppression d’un lien de partage
      revokeToken,                            // Révoquer un token ou le réactiver
      updateTokenExpiration,                  // Mettre à jour l'expiration d'un token
      updateTokenPermissions,                 // Mettre à jour les permissions d'un token
    },
    invitations: {
      sendInvitation,                         // Envoyer une invitation à un utilisateur
      acceptInvitation,                       // Accepter une invitation
      rejectInvitation,                       // Rejeter une invitation
    },
    notifications: {
      notificationsData, setNotificationsData,        // Liste des notifications
      fetchNotifications,                     // Récupération des notifications
      readNotification,                       // Marquer une notification comme lue
    },
    sharedUsers: {
      sharedUsersData, setSharedUsersData,      // Liste des utilisateurs partagés
      fetchSharedUsers,                       // Récupération des utilisateurs partagés
    },
  }

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