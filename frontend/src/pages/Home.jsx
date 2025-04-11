import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import frLocale from '@fullcalendar/core/locales/fr';

function Home() {
  const [events, setEvents] = useState([]);
  const [startDate, setStartDate] = useState(() => {
    return new Date().toISOString().slice(0, 10);
  });
  const API_URL = process.env.REACT_APP_API_URL;

  function getCalendar() {
    fetch(`${API_URL}/calendar?startTime=${startDate}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
      .then(res => res.json())
      .then(data => {
        console.log("Données reçues :", data);
        setEvents(data);
      })
      .catch(error => {
        console.error("Erreur lors du fetch :", error);
      });
  }

  return (
    <div>
      <h1>Accueil</h1>
      <p>Bienvenue sur la page d'accueil !</p>

      <label>
        StartTime :&nbsp;
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
      </label>

      <button onClick={getCalendar} className="ml-2 px-3 py-1 bg-blue-500 text-white rounded">
        Charger le calendrier
      </button>

      <div className="p-4 mt-4">
        <FullCalendar
          plugins={[dayGridPlugin]}
          initialView="dayGridMonth"
          events={events}
          height="auto"
          locale={frLocale}
          firstDay={1}
        />
      </div>
    </div>
  );
}

export default Home;
