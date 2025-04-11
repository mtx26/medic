import React, { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';

function Home() {
  const [rawEvents, setRawEvents] = useState([]); // Données telles qu'elles viennent du backend
  const [calendarEvents, setCalendarEvents] = useState([]); // Pour FullCalendar
  const [selectedDate, setSelectedDate] = useState('');
  const [eventsForDay, setEventsForDay] = useState([]); // Pour la modale
  const modalRef = useRef(null);

  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const API_URL = process.env.REACT_APP_API_URL;

  const getCalendar = () => {
    fetch(`${API_URL}/calendar?startTime=${startDate}`)
      .then((res) => res.json())
      .then((data) => {
        setRawEvents(data);

        // Adapter pour FullCalendar : date => start
        const formatted = data.map((e) => ({
          title: e.title,
          start: e.date,
          color: e.color
        }));

        setCalendarEvents(formatted);
      })
      .catch((error) => {
        console.error('Erreur lors du fetch :', error);
      });
  };

  const handleDateClick = (info) => {
    const clickedDate = info.dateStr;
    setSelectedDate(clickedDate);

    // Filtrer les événements du jour cliqué
    const eventsOfDay = rawEvents.filter((event) =>
      event.date.startsWith(clickedDate)
    );
    setEventsForDay(eventsOfDay);

    // Afficher la modale
    const modal = new window.bootstrap.Modal(modalRef.current);
    modal.show();
  };

  return (
    <div className="container mt-4">
      <h1>Accueil</h1>

      <div className="mb-3">
        <label className="form-label">
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
          <button onClick={getCalendar} className="btn btn-primary mt-2">
            Charger le calendrier
          </button>
        </label>
      </div>
      <div className="alert alert-info" role="alert">
        📌 Cliquez sur un jour du calendrier pour voir les médicaments associés dans une fenêtre.
      </div>

      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={calendarEvents}
        locale={frLocale}
        firstDay={1}
        dateClick={handleDateClick}
        height="auto"
      />

      {/* Modal Bootstrap */}
      <div className="modal fade" ref={modalRef} tabIndex="-1" id="dateModal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">📅 {selectedDate}</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Fermer"
              ></button>
            </div>
            <div className="modal-body">
              {eventsForDay.length > 0 ? (
                <ul className="list-group">
                  {eventsForDay.map((event, index) => (
                    <li
                      key={index}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      {event.title}
                      <span
                        className="badge"
                        style={{
                          backgroundColor: event.color,
                          color: 'white',
                        }}
                      >
                        {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted text-center">Aucun événement ce jour-là.</p>
              )}
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
