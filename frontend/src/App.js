import React, { useState, useEffect, useRef } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/Header';
import AppRoutes from './routes/AppRouter';

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
  const API_URL = process.env.REACT_APP_API_URL;

  const getMeds = () => {
    fetch(`${API_URL}/get_pils`)
      .then((res) => res.json())
      .then(setMeds)
      .catch((err) => console.error('Erreur de récupération des médicaments :', err));
  };
  
  useEffect(() => {
    getMeds();
  }, []);

  const getCalendar = () => {
    fetch(`${API_URL}/calendar?startTime=${startDate}`)
      .then((res) => res.json())
      .then((data) => {
        setRawEvents(data);
        setCalendarEvents(data.map(e => ({
          title: e.title,
          start: e.date,
          color: e.color,
        })));
      })
      .catch((err) => console.error('Erreur de récupération du calendrier :', err));
  };

  const handleMedChange = (index, field, value) => {
    const updated = [...meds];
    if (field === 'time') updated[index][field] = [value];
    else if (['tablet_count', 'interval_days'].includes(field)) updated[index][field] = value === '' ? '' : parseFloat(value);
    else updated[index][field] = value;
    setMeds(updated);
  };

  const handleSubmit = () => {
    fetch(`${API_URL}/update_pils`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(meds),
    })
      .then((res) => res.json())
      .then(() => {
        setAlertMessage("✅ Médicaments mis à jour.");
        setAlertType("success");
        getMeds();
        getCalendar()
      })
      .catch((err) => console.error("Erreur update:", err));
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

  return (
    <Router>
      <Navbar />
      <div className="container mt-4">
        <AppRoutes sharedProps={sharedProps} />
      </div>
    </Router>
  );
}

export default App;
