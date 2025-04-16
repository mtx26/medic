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

  const modalRef = useRef(null);

  
  const { authReady, login } = useContext(AuthContext);

  const fetchUserMedicines = async () => {
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`${API_URL}/api/medicines`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) throw new Error("Erreur HTTP lors de la récupération des médicaments");
    const data = await res.json();
    return data.medicines ?? [];
  };

  const getMeds = async () => {
    try {
      const medsFromDB = await fetchUserMedicines();
      setMeds(medsFromDB);
      log.info("Médicaments récupérés avec succès");
    } catch (err) {
      log.error("Erreur de récupération des médicaments :", err.message);
    }
  };

  const getCalendar = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        log.warn("Utilisateur non connecté, calendrier non chargé.");
        return;
      }
  
      const token = await user.getIdToken();
  
      const res = await fetch(`${API_URL}/api/calendar?startTime=${startDate}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      if (!res.ok) throw new Error("Erreur HTTP");
  
      const data = await res.json();
  
      setRawEvents(data);
      setCalendarEvents(data.map(e => ({
        title: e.title,
        start: e.date,
        color: e.color,
      })));
  
      log.info("Calendrier récupéré avec succès");
    } catch (err) {
      log.error("Erreur de récupération du calendrier :", err.message);
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

      if (!res.ok) throw new Error("Erreur HTTP");

      setAlertMessage("✅ Médicaments mis à jour.");
      setAlertType("success");
      getMeds();
      getCalendar();

      log.info("Médicaments mis à jour avec succès");
    } catch (err) {
      log.error("Erreur de mise à jour des médicaments :", err.message);
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
