// CalendarPage.jsx
import React, { useEffect, useContext, useRef, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { AuthContext } from '../contexts/LoginContext';
function CalendarPage({ personalCalendars, sharedUserCalendars, tokenCalendars }) {

  // 📍 Paramètres d’URL et navigation
  const navigate = useNavigate(); // Hook de navigation

  // 🔐 Contexte d'authentification
  const { authReady, currentUser } = useContext(AuthContext); // Contexte de l'utilisateur connecté
  
  const [selectedDate, setSelectedDate] = useState(''); // Date sélectionnée
  const [eventsForDay, setEventsForDay] = useState([]); // Événements filtrés pour un jour spécifique
  const [calendarEvents, setCalendarEvents] = useState([]); // Événements du calendrier
  // 🔄 Références et chargement
  const modalRef = useRef(null); // Référence vers le modal (pour gestion focus/fermeture)
  const [loadingCalendar, setLoadingCalendar] = useState(undefined); // État de chargement du calendrier
  const [startDate, setStartDate] = useState();

  const calendarSourceMap = {
    personal: {
      fetchCalendars: personalCalendars.fetchPersonalCalendars,
      fetchSchedule: personalCalendars.fetchPersonalCalendarSchedule,
      calendarsData: personalCalendars.calendarsData,
      setCalendarsData: personalCalendars.setCalendarsData,
    },
    sharedUser: {
      fetchCalendars: sharedUserCalendars.fetchSharedCalendars,
      fetchSchedule: sharedUserCalendars.fetchSharedUserCalendarSchedule,
      calendarsData: sharedUserCalendars.sharedCalendarsData,
      setCalendarsData: sharedUserCalendars.setSharedCalendarsData,
    },
    token: {
      fetchCalendars: tokenCalendars.fetchTokens,
      fetchSchedule: tokenCalendars.fetchTokenCalendarSchedule,
      calendarsData: null,
      setCalendarsData: null,
    }
  };
  

  const location = useLocation();
  const params = useParams();

  let calendarType = 'personal';
  let calendarId = params.calendarId;
  let basePath = 'calendars';

  if (location.pathname.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
    calendarId = params.calendarId;
    basePath = 'shared-user-calendar';
  } else if (location.pathname.startsWith('/shared-token-calendar')) {
    calendarType = 'token';
    calendarId = params.sharedToken;
    basePath = 'shared-token-calendar';
  }

  const calendarSource = calendarSourceMap[calendarType];

  const currentCalendar = Array.isArray(calendarSource.calendarsData)
  ? calendarSource.calendarsData.find(c => c.calendar_id === calendarId)
  : null;

  // Fonction pour gérer le clic sur une date
  const handleDateClick = (info) => {
    const clickedDate = info.dateStr;
    setSelectedDate(clickedDate);
    setEventsForDay(calendarEvents.filter((event) => event.start.startsWith(clickedDate)));
    const modal = new window.bootstrap.Modal(modalRef.current);
    modal.show();
    
    modalRef.current.addEventListener('shown.bs.modal', () => {
      modalRef.current.querySelector('button')?.focus();
    }, { once: true });
    
  };

  // Fonction pour naviguer vers la date suivante ou precedente
  const navigateDay = (direction) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    const newDate = current.toISOString().slice(0, 10);
    setSelectedDate(newDate);
    setEventsForDay(calendarEvents.filter((event) => event.start.startsWith(newDate)));
  };
  
  // Fonction pour charger le calendrier lorsque l'utilisateur est connecté
  useEffect(() => {
    if (authReady && currentUser && calendarId) {
      const load = async () => {
        setCalendarEvents([]); // reset
        setLoadingCalendar(undefined); // relancer le spinner
  
        const rep = await calendarSource.fetchSchedule(calendarId);
        if (rep.success) {
          setCalendarEvents(rep.schedule);
        }
        setLoadingCalendar(rep.success);
      };
      load();
    }
  }, [authReady, currentUser, calendarId]);
  
  

  if (loadingCalendar === undefined && calendarId) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement du calendrier partagé...</span>
        </div>
      </div>
    );
  }
  
  if (loadingCalendar === false && calendarId) {
    return (
      <div className="alert alert-danger text-center mt-5" role="alert">
        ❌ Ce lien de calendrier partagé est invalide ou a expiré.
      </div>
    );
  }
  
  

  return (
    <div>

      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h3 className="card-title mb-4">{currentCalendar?.calendar_name || 'Nom introuvable'}</h3>
          {/* Ligne 1 : Boutons d'action */}
          <div className="d-flex flex-wrap  align-items-left gap-2 mb-3">
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(`/calendars/`)}
            >
              <i className="bi bi-calendar-date"></i>
              <span> Retour aux calendriers</span>
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(`/${basePath}/${calendarId}/medicines`)}
            >
              <i className="bi bi-capsule"></i>
              <span> Liste des médicaments</span>
            </button>
          </div>

          {/* Ligne 2 : Sélection date + bouton charger */}
          <div className="d-flex flex-wrap align-items-end  gap-3">
            <div style={{ minWidth: "220px" }}>
              <label htmlFor="datePicker" className="form-label fw-semibold">
                <i className="bi bi-calendar-date"></i>
                <span> Date de début :</span>
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
                onClick={async () => {
                  const rep = await calendarSource.fetchSchedule(calendarId, startDate);
                  if (rep.success) {
                    setCalendarEvents(rep.schedule);
                  }
                }}                
                className="btn btn-outline-primary"
              >
                <i className="bi bi-arrow-repeat"></i>
                <span> Charger le calendrier</span>
              </button>
            </div>
          </div>

          <div className="alert alert-info mt-4 mb-0" role="alert">
            <i className="bi bi-pin-angle-fill"></i>
            <span> Cliquez sur un jour du calendrier pour voir les médicaments associés dans une fenêtre.</span>
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

      {/* Modal pour afficher les médicaments d'une date */}
      <div className="modal fade" ref={modalRef} tabIndex="-1" id="dateModal">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                <i className="bi bi-calendar-date"></i>
                <span> {new Date(selectedDate).toLocaleDateString('fr-FR', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
                </span>
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
                            {new Date(event.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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