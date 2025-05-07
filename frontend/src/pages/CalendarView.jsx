// CalendarPage.jsx
import React, { useEffect, useContext, useRef, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { UserContext } from '../contexts/UserContext';
import HoveredUserProfile from '../components/HoveredUserProfile';

function CalendarPage({ personalCalendars, sharedUserCalendars, tokenCalendars }) {

  // 📍 Paramètres d'URL et navigation
  const navigate = useNavigate(); // Hook de navigation
  const location = useLocation();
  const params = useParams();

  // 🔐 Contexte d'authentification
  const { authReady, currentUser } = useContext(UserContext); // Contexte de l'utilisateur connecté
  
  const [selectedDate, setSelectedDate] = useState(''); // Date sélectionnée
  const [eventsForDay, setEventsForDay] = useState([]); // Événements filtrés pour un jour spécifique
  const [calendarEvents, setCalendarEvents] = useState([]); // Événements du calendrier
  const [calendarTable, setCalendarTable] = useState([]); // Événements du calendrier
  const [calendarName, setCalendarName] = useState(''); // Nom du calendrier
  const [ownerUser, setOwnerUser] = useState(null); // Utilisateur propriétaire du calendrier

  // 🔄 Références et chargement
  const modalRef = useRef(null); // Référence vers le modal (pour gestion focus/fermeture)
  const [loadingCalendar, setLoadingCalendar] = useState(undefined); // État de chargement du calendrier
  const [loadingTable, setLoadingTable] = useState(undefined); // État de chargement du tableau
  const [startDate, setStartDate] = useState();

  const calendarSourceMap = {
    personal: {
      fetchSchedule: personalCalendars.fetchPersonalCalendarSchedule,
      calendarsData: personalCalendars.calendarsData,
      setCalendarsData: personalCalendars.setCalendarsData,
    },
    sharedUser: {
      fetchSchedule: sharedUserCalendars.fetchSharedUserCalendarSchedule,
      calendarsData: sharedUserCalendars.sharedCalendarsData,
      setCalendarsData: sharedUserCalendars.setSharedCalendarsData,
    },
    token: {
      fetchSchedule: tokenCalendars.fetchTokenCalendarSchedule,
      calendarsData: null,
      setCalendarsData: null,
    }
  };

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

  // Fonction pour gérer le clic sur une date
  const handleDateClick = (info) => {
    const clickedDate = info.dateStr;
    setSelectedDate(clickedDate);
    setEventsForDay(calendarEvents.filter((event) => event.start.startsWith(clickedDate)));
    const modal = new window.bootstrap.Modal(modalRef.current);
    modal.show();
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
    if (!authReady || !calendarId) return;
    const load = async () => {
      if (calendarType === 'token' || currentUser) {
        const rep = await calendarSource.fetchSchedule(calendarId);
        if (rep.success) {
          setCalendarEvents(rep.schedule);
          setCalendarName(rep.calendarName);
        }
        setLoadingCalendar(!rep.success);
      } else {
        setLoadingCalendar(true);
      }
    };

    load();
  }, [authReady, currentUser, calendarId]);


  //map juste 7 fois
  const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
  const hours = { 8: "Matin", 12: "Midi", 18: "Soir" };

  useEffect(() => {
    if (!loadingCalendar) {
      const result = [];
      const daysVus = new Set();
  
      for (const event of calendarEvents) {
        const date = new Date(event.start);
        // jour qui commence par lundi
        const day = days[(date.getDay() + 6) % 7];
        const moment = hours[date.getHours()];
        if (!moment) continue;
  
        if (!daysVus.has(day) && daysVus.size >= 7) continue;
        daysVus.add(day);
  
        const title = event.title;
        const dose = event.dose;
  
        let med = result.find((r) => r.title === title);
        if (!med) {
          med = {
            title: title,
            cells: {}
          };
          result.push(med);
        }
        if (!med.cells[moment]) {
          med.cells[moment] = {};
        }
  
        med.cells[moment][day] = dose;
      }
      // trier les moments par ordre alphabétique
      const sortedResult =  result.sort((a, b) => a.title.localeCompare(b.title));
  
      setCalendarTable(sortedResult);
      setLoadingTable(false);
    }
  }, [calendarEvents, loadingCalendar]);
  
  const memoizedEvents = useMemo(() => {
    return calendarEvents.map((event) => ({
      title: `${event.title} (${event.dose})`,
      start: event.start,
      color: event.color,
    }));
  }, [calendarEvents]);

  useEffect(() => {
    if (!currentUser || !calendarId) return;

    if (calendarType === 'sharedUser') {
      if (calendarSource.calendarsData.find((calendar) => calendar.calendar_id === calendarId)) {
        const owner_user = calendarSource.calendarsData.find((calendar) => calendar.calendar_id === calendarId);
        setOwnerUser({
          email: owner_user.owner_email,
          display_name: owner_user.owner_name,
          photo_url: owner_user.owner_photo_url
        });
      }
    }
  }, [calendarType, calendarSource.calendarsData, calendarId]);

  if (loadingCalendar === undefined || loadingTable === undefined && calendarId) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement du calendrier partagé...</span>
        </div>
      </div>
    );
  }
  
  if (loadingCalendar === true && calendarId) {
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
          <div className="mb-3">
            <h3 className="card-title">{calendarName}</h3>

            {calendarType === 'sharedUser' && (
              <div className="badge bg-info mb-3">
                Calendrier partagé par 
                {" "}

              {ownerUser ? (
                <>
                  <HoveredUserProfile 
                    user={{
                      email: ownerUser.email,
                      display_name: ownerUser.display_name,
                      photo_url: ownerUser.photo_url
                    }}
                    trigger={
                      <span>
                        {ownerUser.display_name}
                      </span>
                    }
                  />
                </>
              ) : (
                "un utilisateur"
              )}
              </div>
            )}
            {calendarType === 'token' && (
              <div className="badge bg-info mb-3">Accès via lien de partage public</div>
            )}
          </div>
          <div className="d-flex flex-wrap  align-items-left gap-2 mb-3">
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(`/calendars`)}
            >
              <i className="bi bi-calendar-date"></i>
              <span> Calendriers</span>
            </button>
            <button
              className="btn btn-outline-secondary"
              onClick={() => navigate(`/${basePath}/${calendarId}/medicines`)}
            >
              <i className="bi bi-capsule"></i>
              <span> Médicaments</span>
            </button>
          </div>
        </div>
      </div>
      {calendarTable.length > 0 ? (
        <>
          <div>
            <h4 className="mb-4">
              <i className="bi bi-calendar-week"></i> Tableau hebdomadaire
            </h4>
            {calendarTable.map((table, index) => (
              <div className="card border border-secondary-subtle mb-4" key={index}>
                <div className="card-header bg-light fw-semibold text-dark">
                  <i className="bi bi-capsule me-2"></i>{table.title}
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered text-center align-middle mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Moment</th>
                          {days.map((day) => (
                            <th key={day}>{day}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(table.cells).map(([moment, momentsObj]) => (
                          <tr key={moment}>
                            <td style={{ minWidth: "70px" }}>
                              <strong>{moment}</strong>
                            </td>
                            {days.map((day) => (
                              <td key={day}>
                                {momentsObj[day] && (
                                  <span className="text-muted small px-2 py-1 rounded d-inline-block">
                                    {momentsObj[day]}
                                  </span>
                                )}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}
          </div>


          <div className="card shadow-sm mb-4">
            <div className="card-body">
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
            events={memoizedEvents}
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
              const startOfWeek = new Date(today);
              startOfWeek.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 1);
              const endOfWeek = new Date(startOfWeek);
              endOfWeek.setDate(startOfWeek.getDate() + 7);
            
              const cellDate = new Date(info.date.toDateString());
            
              const isToday =
                cellDate.getFullYear() === today.getFullYear() &&
                cellDate.getMonth() === today.getMonth() &&
                cellDate.getDate() === today.getDate();
            
              if (!isToday && cellDate >= startOfWeek && cellDate <= endOfWeek) {
                info.el.classList.add('highlight-week'); // ✅ Plus performant
              }
            }}
          />
        </>
      ) : (
        <div className="alert alert-info mt-4 mb-0" role="alert">
          <i className="bi bi-pin-angle-fill"></i>
          <span> Aucun médicament prévu pour le moment.</span>
        </div>
      )}

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
                          {`${event.title} (${event.dose})`}
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