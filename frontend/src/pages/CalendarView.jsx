// CalendarPage.jsx
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { useNavigate } from 'react-router-dom';
import { useParams } from 'react-router-dom';
import { use, useEffect } from 'react';
import { useContext, useRef } from "react";
import { AuthContext } from "../contexts/LoginContext";

function CalendarPage({
  rawEvents, setRawEvents,
  calendarEvents, setCalendarEvents,
  selectedDate,
  setSelectedDate,
  eventsForDay,
  setEventsForDay,
  startDate,
  setStartDate,
  getCalendar,
  calendars,
}) {
  const modalRef = useRef(null);
  const { nameCalendar } = useParams();

  const navigate = useNavigate();
  const { authReady, login } = useContext(AuthContext);

  const handleDateClick = (info) => {
    const clickedDate = info.dateStr;
    setSelectedDate(clickedDate);
    setEventsForDay(rawEvents.filter((event) => event.date.startsWith(clickedDate)));
    new window.bootstrap.Modal(modalRef.current).show();
  };

  const navigateDay = (direction) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    const newDate = current.toISOString().slice(0, 10);
    setSelectedDate(newDate);
    setEventsForDay(rawEvents.filter((event) => event.date.startsWith(newDate)));
  };
  useEffect(() => {
    setRawEvents([]);
    setCalendarEvents([]);
  }, [nameCalendar, setRawEvents, setCalendarEvents]);
  
  useEffect(() => {
    if (authReady && login) {
      getCalendar(nameCalendar)
    }
  }, [authReady, login]);

  
  if (!calendars || calendars.length === 0) {
    return <div className="text-center mt-5">⏳ Chargement du calendrier...</div>;
  }
  
  if (!calendars.includes(nameCalendar)) {
    return <div className="text-center mt-5 text-danger">❌ Ce calendrier n'existe pas.</div>;
  }
  
  
  
  

  return (
    <div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          {/* Ligne 1 : Boutons d'action */}
          <div className="d-flex flex-wrap  align-items-left gap-2 mb-3">
            <button
              className="btn btn-outline-primary"
              onClick={() => navigate('/calendars')}
            >
              🗂 Liste des calendriers
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(`/calendars/${nameCalendar}/medicines`)}
            >
              🧪 Liste des médicaments
            </button>
          </div>

          {/* Ligne 2 : Sélection date + bouton charger */}
          <div className="d-flex flex-wrap align-items-end  gap-3">
            <div style={{ minWidth: "220px" }}>
              <label htmlFor="datePicker" className="form-label fw-semibold">
                📅 Date de début :
              </label>
              <input
                id="datePicker"
                type="date"
                className="form-control"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div>
              <button
                onClick={() => getCalendar(nameCalendar, startDate)}
                className="btn btn-outline-primary"
              >
                🔄 Charger le calendrier
              </button>
            </div>
          </div>

          <div className="alert alert-info mt-4 mb-0" role="alert">
            📌 Cliquez sur un jour du calendrier pour voir les médicaments associés dans une fenêtre.
          </div>
        </div>
      </div>


      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={calendarEvents}
        locale={frLocale}
        firstDay={1}
        dateClick={handleDateClick}
        height="auto"

        // click sur les événements
        eventClick={(info) => {
          const clickedDate = info.event.startStr.slice(0, 10); // format YYYY-MM-DD
          handleDateClick({ dateStr: clickedDate });
        }}

        // semaine actuelle en vert clair
        dayCellDidMount={(info) => {
          const today = new Date();
      
          // Trouver le lundi (début de la semaine)
          const startOfWeek = new Date(today);
          startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 1);
      
          // Trouver le dimanche (fin de la semaine)
          const endOfWeek = new Date(startOfWeek);
          endOfWeek.setDate(startOfWeek.getDate() + 7);
      
          // Comparer avec la date de la cellule
          const cellDate = new Date(info.date.toDateString()); // nettoyage heure
      
          const isToday =
          cellDate.getFullYear() === today.getFullYear() &&
          cellDate.getMonth() === today.getMonth() &&
          cellDate.getDate() === today.getDate();
    
          if (!isToday && cellDate >= startOfWeek && cellDate <= endOfWeek) {
            info.el.style.backgroundColor = '#d0f5d8'; // vert clair
          }
        }}

        
      />

      <div className="modal fade" ref={modalRef} tabIndex="-1" id="dateModal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                📅 {new Date(selectedDate).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div className="modal-body">
              <div className="d-flex justify-content-between align-items-center">
                <button className="btn btn-outline-secondary btn-sm" onClick={() => navigateDay(-1)}>⬅</button>
                <div className="flex-grow-1 mx-3">
                  {eventsForDay.length > 0 ? (
                    <ul className="list-group">
                      {eventsForDay.map((event, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                          {event.title}
                          <span className="badge" style={{ backgroundColor: event.color, color: 'white' }}>
                            {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-muted text-center mb-0">Aucun événement ce jour-là.</p>
                  )}
                </div>
                <button className="btn btn-outline-secondary btn-sm" onClick={() => navigateDay(1)}>➡</button>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                Fermer
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CalendarPage;