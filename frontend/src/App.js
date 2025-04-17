// App.js
import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/Header';
import AppRoutes from './routes/AppRouter';
import { log } from './utils/logger';
import { UserProvider } from "./contexts/UserContext";
import { AuthProvider } from "./contexts/LoginContext";
import { auth } from "./services/firebase";
import { useContext } from "react";
import { AuthContext } from "./contexts/LoginContext";

const API_URL = process.env.REACT_APP_API_URL;

function App() {
  const [rawEvents, setRawEvents] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [eventsForDay, setEventsForDay] = useState([]);
  const [meds, setMeds] = useState([]);
  const [selectedToDelete, setSelectedToDelete] = useState([]);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [confirmDeleteVisible, setConfirmDeleteVisible] = useState(false);
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [calendars, setCalendars] = useState([]);
  const modalRef = useRef(null);
  const { authReady, login } = useContext(AuthContext);

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
      setCalendars(data.calendars ?? []);
    } catch (err) {
      log.error("Échec de récupération des calendriers", err, {
        id: "CALENDARS_FETCH_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
    }
  };

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
    } catch (err) {
      log.error("Échec de création du calendrier", err, {
        id: "CALENDAR_CREATE_FAIL",
        origin: "App.js",
        calendarName,
        stack: err.stack,
      });
    }
  };

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

  const fetchUserMedicines = async () => {
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`${API_URL}/api/medicines`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) throw new Error("Erreur HTTP GET /api/medicines");
    const data = await res.json();
    return data.medicines ?? [];
  };

  const getMeds = async () => {
    try {
      const medsFromDB = await fetchUserMedicines();
      setMeds(medsFromDB);
      log.info("Médicaments récupérés avec succès", {
        id: "MED_FETCH_SUCCESS",
        origin: "App.js",
        count: medsFromDB?.length,
      });
    } catch (err) {
      log.error("Échec de récupération des médicaments", err, {
        id: "MED_FETCH_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
    }
  };

  const getCalendar = async (nameCalendar) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        log.warn("Utilisateur non connecté, calendrier non chargé.", {
          id: "USER_NOT_AUTHENTICATED",
          origin: "App.js",
        });
        return;
      }
      const token = await user.getIdToken();
      const res = await fetch(`${API_URL}/api/getcalendar?startTime=${startDate}&nameCalendar=${nameCalendar}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error("Erreur HTTP GET /api/calendar");
      const data = await res.json();
      setRawEvents(data);
      setCalendarEvents(data.map(e => ({ title: e.title, start: e.date, color: e.color })));
      log.info("Calendrier récupéré avec succès", {
        id: "CALENDAR_FETCH_SUCCESS",
        origin: "App.js",
        eventCount: data?.length,
        calendarName: nameCalendar,
      });
    } catch (err) {
      log.error("Échec de récupération du calendrier", err, {
        id: "CALENDAR_FETCH_FAIL",
        origin: "App.js",
        calendarName: nameCalendar,
        startDate,
        stack: err.stack,
      });
    }
  };

  const handleMedChange = (index, field, value) => {
    const updated = [...meds];
    const numericFields = ['tablet_count', 'interval_days'];
    if (field === 'time') {
      updated[index][field] = [value];
    } else if (numericFields.includes(field)) {
      updated[index][field] = value === '' ? '' : parseFloat(value);
    } else {
      updated[index][field] = value;
    }
    setMeds(updated);
  };

  const handleSubmit = async () => {
    try {
      const token = await auth.currentUser.getIdToken();
      const res = await fetch(`${API_URL}/api/medicines`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ medicines: meds }),
      });
      if (!res.ok) throw new Error("Erreur HTTP POST /api/medicines");
      setAlertMessage("✅ Médicaments mis à jour.");
      setAlertType("success");
      getMeds();
      log.info("Médicaments mis à jour avec succès", {
        id: "MED_UPDATE_SUCCESS",
        origin: "App.js",
        count: meds?.length,
      });
    } catch (err) {
      log.error("Échec de mise à jour des médicaments", err, {
        id: "MED_UPDATE_FAIL",
        origin: "App.js",
        stack: err.stack,
      });
    }
  };

  const deleteSelectedMeds = () => {
    setMeds(meds.filter((_, i) => !selectedToDelete.includes(i)));
    setSelectedToDelete([]);
  };

  const addMed = () => {
    setMeds([
      ...meds,
      { name: '', tablet_count: 1, time: [''], interval_days: 1, start_date: '' },
    ]);
  };

  const sharedProps = {
    rawEvents, setRawEvents,
    calendarEvents, setCalendarEvents,
    selectedDate, setSelectedDate,
    eventsForDay, setEventsForDay,
    meds, setMeds,
    selectedToDelete, setSelectedToDelete,
    alertMessage, setAlertMessage,
    alertType, setAlertType,
    confirmDeleteVisible, setConfirmDeleteVisible,
    startDate, setStartDate,
    modalRef,
    getCalendar,
    handleMedChange,
    handleSubmit,
    deleteSelectedMeds,
    addMed,
    fetchCalendars,
    calendars,
    addCalendar,
    deleteCalendar,
    RenameCalendar,
    getMedicineCount,
  };

  useEffect(() => {
    if (authReady && login) {
      getMeds();
      getCalendar();
    }
  }, [authReady, login]);

  return (
    <AuthProvider>
      <UserProvider>
        <Router>
          <Navbar />
          <div className="container mt-4">
            <AppRoutes sharedProps={sharedProps} />
          </div>
        </Router>
      </UserProvider>
    </AuthProvider>
  );
}

export default App;