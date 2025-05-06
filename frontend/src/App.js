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
  const [sharedUserCalendarEvents, setSharedUserCalendarEvents] = useState([]);
  const [tokensList, setTokensList] = useState([]);
  const [calendarsData, setCalendarsData] = useState([]);
  const [notificationsData, setNotificationsData] = useState([]);
  const [sharedCalendarsData, setSharedCalendarsData] = useState([]);

  const { authReady, currentUser } = useContext(AuthContext);

  const generateHexToken = (length = 16) =>
    [...crypto.getRandomValues(new Uint8Array(length))]
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  


  // Fonction pour obtenir les calendriers
  const fetchPersonalCalendars = useCallback(async () => {
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
      fetchPersonalCalendars();

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
  }, [fetchPersonalCalendars]);

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
      fetchPersonalCalendars();
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
  }, [fetchPersonalCalendars]);

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
      fetchPersonalCalendars();
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
  }, [fetchPersonalCalendars]);

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
  const fetchPersonalCalendarSchedule = useCallback(async (calendarId, startDate ) => {
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
      // trier les events par titre et par date
      const scheduleSortedByTitle = data.schedule.sort((a, b) => a.title.localeCompare(b.title));
      const scheduleSortedByMoment = scheduleSortedByTitle.sort((a, b) => new Date(a.start) - new Date(b.start));

      setCalendarEvents(scheduleSortedByMoment);
      
      log.info(data.message, {
        origin: "CALENDAR_FETCH_SUCCESS",
        "uid": auth.currentUser.uid,
        "eventCount": scheduleSortedByMoment?.length,
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
  const fetchPersonalCalendarMedicines = useCallback(async (calendarId) => {
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
      // trier par ordre alphabétique
      const medicinesSortedByName = data.medicines.sort((a, b) => a.name.localeCompare(b.name));

      log.info(data.message, {
        origin: "MED_FETCH_SUCCESS",
        "uid": auth.currentUser.uid,
        "count": data.medicines?.length,
        "calendarId": calendarId,
      });
      return { success: true, message: data.message, code: data.code, medicinesData: medicinesSortedByName, originalMedicinesData: JSON.parse(JSON.stringify(medicinesSortedByName)) };
    } catch (err) {
      log.error(err.message || "Erreur lors de la récupération des médicaments", err, {
        origin: "MED_FETCH_ERROR",
        "uid": auth.currentUser.uid,
        "calendarId": calendarId,
      });
      return { success: false, error: err.message, code: err.code };
    }
  }, []);
  
  // Fonction pour modifier un médicament
  const updatePersonalCalendarMedicines = useCallback(async (calendarId, medicinesData) => {
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
      // trier par ordre alphabétique
      const medicinesSortedByName = data.medicines.sort((a, b) => a.name.localeCompare(b.name));
      log.info(data.message, {
        origin: "MED_UPDATE_SUCCESS",
        "uid": auth.currentUser.uid,
        "count": medicinesData?.length,
        "calendarId": calendarId,
      });
      return { success: true, message: data.message, code: data.code, medicinesData: medicinesSortedByName, originalMedicinesData: JSON.parse(JSON.stringify(medicinesSortedByName)) };
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
  const deletePersonalCalendarMedicines = useCallback(async (calendarId, checked, medicinesData) => {
    if (checked.length === 0) return false;
    const medicinesDataFiltered = medicinesData.filter((med) => !checked.includes(String(med.id)));

  
    const rep = await updatePersonalCalendarMedicines(calendarId, medicinesDataFiltered);
    if (rep.success) {
      log.info(rep.message, {
        origin: "MED_DELETE_SUCCESS",
        "uid": auth.currentUser.uid,
        "count": checked.length,
        "calendarId": calendarId,
      });
      return {success: true, message: "Médicaments supprimés avec succès", code: rep.code, medicinesData: rep.medicinesData, originalMedicinesData: JSON.parse(JSON.stringify(rep.medicinesData))};
    } else {
      log.error(rep.error, {
        origin: "MED_DELETE_ERROR",
        "uid": auth.currentUser.uid,
        "count": checked.length,
        "calendarId": calendarId,
      });
      return {success: false, error: "Erreur lors de la suppression des médicaments", code: rep.code};
    }
  }, [updatePersonalCalendarMedicines]);
  
  // Fonction pour ajouter un nouveau médicament sanq la variable medicines
  const addPersonalCalendarMedicine = useCallback((medicinesData) => {
    // générer un id unique a 16 caractères
    const id = generateHexToken();
    const newMedicinesData = [
      ...medicinesData,
      { name: '', tablet_count: 1, time: ['morning'], interval_days: 1, start_date: '', id: id },
    ];
    return {success: true, message: "Médicament ajouté avec succès", code: "MED_ADD_SUCCESS", medicinesData: newMedicinesData, id: id };
  }, []);


  ////////////////////////////////////////////////////////////////////////////////////////////////////////////////


  // Fonction pour recupérer un calendrier partagé par un token
  const fetchTokenCalendarSchedule = useCallback(async (token, startDate) => {
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
  const fetchTokenCalendarMedicines = useCallback(async (token) => {
    try {
      const  res = await fetch(`${API_URL}/api/tokens/${token}/medecines`, {
        method: "GET",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      log.info(data.message, {
        origin: "SHARED_MED_FETCH_SUCCESS",
        "token": token,
      });
      return {success: true, message: data.message, code: data.code, medicinesData: data.medicines};
    } catch (err) {
      log.error(err.message || "Échec de récupération des médicaments partagé", err, {
        origin: "SHARED_MED_FETCH_ERROR",
        "token": token,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, []);

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
  const fetchSharedUserCalendarSchedule = useCallback(async (calendarId, startDate) => {
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
      setSharedUserCalendarEvents(data.schedule);
      console.log(data.schedule);
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
  }, [setSharedUserCalendarEvents]);

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
      // trier par ordre alphabétique
      const medicinesSortedByName = data.medicines.sort((a, b) => a.name.localeCompare(b.name));

      log.info(data.message, {
        origin: "SHARED_USER_CALENDAR_MEDICINES_FETCH_SUCCESS",
        calendarId,
      });
      return {success: true, message: data.message, code: data.code, medicinesData: medicinesSortedByName, originalMedicinesData: JSON.parse(JSON.stringify(medicinesSortedByName))};
    } catch (err) {
      log.error(err.message || "Échec de récupération des médicaments du calendrier partagé par un utilisateur", err, {
        origin: "SHARED_USER_CALENDAR_MEDICINES_FETCH_ERROR",
        calendarId,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, []);

  // Fonction pour mettre à jour les médicaments d’un calendrier partagé par un utilisateur
  const updateSharedUserCalendarMedicines = useCallback(async (calendarId, medicinesData) => {
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
      // trier par ordre alphabétique
      const medicinesSortedByName = data.medicines.sort((a, b) => a.name.localeCompare(b.name));

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
    if (checked.length === 0) return false;
  
    const medicinesDataFiltered = medicinesData.filter((med) => !checked.includes(String(med.id)));
    const rep = await updateSharedUserCalendarMedicines(calendarId, medicinesDataFiltered);
    if (rep.success) {
      log.info(rep.message, {
        origin: "SHARED_USER_CALENDAR_MEDICINES_DELETE_SUCCESS",
        calendarId,
      });
      
      return {success: true, message: "Médicaments supprimés avec succès", code: "SHARED_USER_CALENDAR_MEDICINES_DELETE_SUCCESS", medicinesData: rep.medicinesData};
    } else {
      log.error(rep.error, {
        origin: "SHARED_USER_CALENDAR_MEDICINES_DELETE_ERROR",
        calendarId,
      });
      return {success: false, error: "Erreur lors de la suppression des médicaments", code: "SHARED_USER_CALENDAR_MEDICINES_DELETE_ERROR", medicinesData: rep.medicinesData};
    }
  }, [updateSharedUserCalendarMedicines]);

  // Fonction pour récupérer les informations d’un utilisateur
  const fetchUserInfo = useCallback(async (userId) => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/user/info/${userId}`, {
        method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      log.info(data.message, {
        origin: "FETCH_USER_INFO_SUCCESS",
        userId,
      });
      return {success: true, message: data.message, code: data.code, data: data.user_data};
    } catch (err) {
      log.error(err.message || "Échec de récupération des informations de l'utilisateur", err, {
        origin: "FETCH_USER_INFO_ERROR",
        userId,
      });
      return {success: false, error: err.message, code: err.code};
    }
  }, []);
  

  const sharedProps = {
    personalCalendars: {
      fetchPersonalCalendars,
      fetchPersonalCalendarSchedule,
      fetchPersonalCalendarMedicines,
      fetchPersonalCalendarMedicineCount,
      addCalendar,
      renameCalendar,
      deleteCalendar,
      addPersonalCalendarMedicine,
      updatePersonalCalendarMedicines,
      deletePersonalCalendarMedicines,
      calendarsData,
      setCalendarsData,
      calendarEvents,
      setCalendarEvents,
    },
  
    sharedUserCalendars: {
      fetchSharedCalendars,
      fetchSharedUserCalendarSchedule,
      fetchSharedUserCalendarMedicines,
      fetchSharedUserCalendarMedicineCount,
      fetchSharedUsers,
      sendInvitation,
      acceptInvitation,
      rejectInvitation,
      updateSharedUserCalendarMedicines,
      deleteSharedUserCalendarMedicines,
      deleteSharedUser,
      deleteSharedCalendar,
      sharedCalendarsData,
      setSharedCalendarsData,
      sharedUserCalendarEvents,
      setSharedUserCalendarEvents,
    },
  
    tokenCalendars: {
      fetchTokens,
      fetchTokenCalendarSchedule,
      fetchTokenCalendarMedicines,
      createToken,
      updateTokenPermissions,
      updateTokenExpiration,
      updateRevokeToken,
      deleteToken,
      tokensList,
      setTokensList,
    },
  
    notifications: {
      fetchNotifications,
      readNotification,
      notificationsData,
      setNotificationsData,
    },
  };
  

  const resetAppData = () => {
    // EVENTS
    setCalendarEvents([]);
    
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