// CalendarPage.jsx
import React, { useEffect, useContext, useRef, useState, useMemo } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { UserContext } from '../contexts/UserContext';
import HoveredUserProfile from '../components/HoveredUserProfile';
import { formatToLocalISODate } from "../utils/dateUtils";
import { getCalendarSourceMap } from "../utils/calendarSourceMap"
import ShareCalendarModal from '../components/ShareCalendarModal';
import AlertSystem from '../components/AlertSystem';
import isEqual from "lodash/isEqual";
import bootstrap5Plugin from '@fullcalendar/bootstrap5';
import 'bootstrap/dist/css/bootstrap.css';
import DateModal from '../components/DateModal';
import WeekCalendarSelector from '../components/WeekCalendarSelector';
import WeeklyEventContent from '../components/WeeklyEventContent';


function CalendarPage({ personalCalendars, sharedUserCalendars, tokenCalendars }) {

  // 📍 Paramètres d'URL et navigation
  const navigate = useNavigate(); // Hook de navigation
  const location = useLocation();
  const params = useParams();

  // 🔐 Contexte d'authentification
  const { authReady, currentUser } = useContext(UserContext); // Contexte de l'utilisateur connecté
  
  const calendarRef = useRef(null);
  const [selectedDate, setSelectedDate] = useState(formatToLocalISODate(new Date())); // Date sélectionnée
  const [eventsForDay, setEventsForDay] = useState([]); // Événements filtrés pour un jour spécifique
  const [calendarEvents, setCalendarEvents] = useState([]); // Événements du calendrier
  const [calendarTable, setCalendarTable] = useState([]); // Événements du calendrier
  const [calendarName, setCalendarName] = useState(''); // Nom du calendrier
  const [ownerUser, setOwnerUser] = useState(null); // Utilisateur propriétaire du calendrier
  const [alertType, setAlertType] = useState(''); // Type d'alerte
  const [alertMessage, setAlertMessage] = useState(''); // Message d'alerte
  const [existingShareToken, setExistingShareToken] = useState(null); // Token existant
  const [sharedUsersData, setSharedUsersData] = useState([]); // Utilisateurs partageant le calendrier

  // 🔄 Références et chargement
  const dateModalRef = useRef(null);
  const shareModalRef = useRef(null); // Référence vers le modal (pour gestion focus/fermeture)
  const [loading, setLoading] = useState(undefined); // État de chargement du calendrier
  
  const [startDate, setStartDate] = useState(formatToLocalISODate(new Date()));
  
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const days_map = {
    "Mon": "Lun",
    "Tue": "Mar",
    "Wed": "Mer",
    "Thu": "Jeu",
    "Fri": "Ven",
    "Sat": "Sam",
    "Sun": "Dim"
  }
  const moment_map = {
    "morning": "Matin",
    "noon": "Midi",
    "evening": "Soir"
  }

  let calendarType = 'personal';
  let calendarId = params.calendarId;
  let basePath = 'calendar';

  if (location.pathname.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
    calendarId = params.calendarId;
    basePath = 'shared-user-calendar';
  } else if (location.pathname.startsWith('/shared-token-calendar')) {
    calendarType = 'token';
    calendarId = params.sharedToken;
    basePath = 'shared-token-calendar';
  }

  const calendarSource = getCalendarSourceMap(personalCalendars, sharedUserCalendars, tokenCalendars)[calendarType];

  const onSelectDate = (isoDate) => {
    setSelectedDate(isoDate);
    setEventsForDay(calendarEvents.filter(e => e.start.startsWith(isoDate)));
  }

  // Fonction pour gérer le clic sur une date
  const handleDateClick = (info) => {
    const clickedDate = info.dateStr;
    setSelectedDate(clickedDate);
    dateModalRef.current?.open();
  }; 

  // Fonction pour naviguer vers la date suivante ou precedente
  const navigateDay = (direction) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    const newDate = formatToLocalISODate(current);
    setSelectedDate(newDate);
  };
  
  // Fonction pour charger le calendrier lorsque l'utilisateur est connecté
  useEffect(() => {
    if (!authReady || !calendarId) return;
    const load = async () => {
      if (calendarType === 'token' || currentUser) {
        const rep = await calendarSource.fetchSchedule(calendarId);
        if (rep.success) {
          if (!isEqual(rep.schedule, calendarEvents)) {
            setCalendarEvents(rep.schedule);
          }
          if (!isEqual(rep.table, calendarTable)) {
            setCalendarTable(rep.table);
          }
          if (!isEqual(rep.calendarName, calendarName)) {
            setCalendarName(rep.calendarName);
          }
        }
        setLoading(!rep.success);
      } else {
        setLoading(true);
      }
    };

    load();
  }, [authReady, currentUser, calendarId, calendarType, calendarSource.fetchSchedule]);


  useEffect(() => {
    if (!selectedDate || !calendarEvents.length) return;
    const filtered = calendarEvents.filter((event) => event.start.startsWith(selectedDate));
    setEventsForDay(filtered);
  }, [selectedDate, calendarEvents]);

  const memoizedEvents = useMemo(() => {
    return calendarEvents.map((event) => ({
      title: `${event.title} ${event.dose != null ? `${event.dose} mg` : ""} (${event.tablet_count})`,
      start: event.start,
      color: event.color,
    }));
  }, [calendarEvents]);  

  useEffect(() => {
    if (!currentUser || !calendarId) return;

    if (calendarType === 'sharedUser') {
      if (calendarSource.calendarsData.find((calendar) => calendar.id === calendarId)) {
        const owner_user = calendarSource.calendarsData.find((calendar) => calendar.id === calendarId);
        setOwnerUser({
          email: owner_user.owner_email,
          display_name: owner_user.owner_name,
          photo_url: owner_user.owner_photo_url
        });
      }
    }
  }, [calendarType, calendarSource.calendarsData, calendarId, currentUser]);

  if ( loading === undefined && calendarId) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <output className="spinner-border text-primary">
          <span className="visually-hidden">Chargement du calendrier partagé...</span>
        </output>
      </div>
    );
  }
  
  if ( loading === true && calendarId) {
    return (
      <div className="alert alert-danger text-center mt-5" role="alert">
        ❌ Ce lien de calendrier partagé est invalide ou a expiré.
      </div>
    );
  }
  
  

  return (
    <div>
      {calendarType === 'personal' && (
        // Modal pour partager un calendrier
        <ShareCalendarModal
          ref={shareModalRef}
          calendarId={calendarId}
          calendarName={calendarName}
          existingShareToken={existingShareToken}
          sharedUsersData={sharedUsersData}
          tokenCalendars={tokenCalendars}
          sharedUserCalendars={sharedUserCalendars}
          setAlertType={setAlertType}
          setAlertMessage={setAlertMessage}
        />
      )}
      
      <div className="card shadow-sm mb-4">
        <div className="card-body">

          {/* Titre et alerte */}
          <div className="mb-3">
            <h3 className="card-title">{calendarName}</h3>

            <AlertSystem
              type={alertType}
              message={alertMessage}
              onClose={() => {
                setAlertMessage("");
              }}
            />


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

          {/* Boutons de navigation et partage */}
          <div className="d-flex flex-wrap  align-items-left gap-2 mb-3">

            {/* Boutons de navigation */}
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

            {/* Bouton pour partager le calendrier */}
            {calendarType === 'personal' && (
              <button
                type="button"
                className="btn btn-outline-warning"
                title="Partager"
                onClick={async () => {
                  setExistingShareToken(null);
                  const token = await tokenCalendars.tokensList.find(
                    (t) => t.calendar_id === calendarId && !t.revoked && t.owner_uid === currentUser.uid
                  );
                  const rep = await sharedUserCalendars.fetchSharedUsers(calendarId);
                  if (rep.success) {
                    setSharedUsersData(rep.users);
                  }
                  setExistingShareToken(token || null);
                  shareModalRef.current?.open();
                }}
              >
                <i className="bi bi-box-arrow-up"></i>
              </button>
            )}

          </div>
        </div>
      </div>

      {/* Régénérer le calendrier */}
      {calendarTable.length > 0 && (
        <WeekCalendarSelector
          selectedDate={startDate}
          onWeekSelect={async (monday) => {
            const isoDate = formatToLocalISODate(monday);
            setStartDate(isoDate);
            const rep = await calendarSource.fetchSchedule(calendarId, isoDate);
            if (rep.success) {
              setCalendarEvents(rep.schedule);
              setCalendarTable(rep.table);
              calendarRef.current?.getApi().gotoDate(isoDate);
              onSelectDate(isoDate);
            }
          }}
        />
      )}

      {calendarTable.length > 0 ? (
        <>
          {/* Tableau hebdomadaire */}
          <div className="mb-5">
            <h4 className="mb-4"><i className="bi bi-table"></i> Tableau hebdomadaire</h4>
            {calendarTable.map((table, index) => (
              <div className="card border border-secondary-subtle mb-4" key={index}>
                <div className="card-header bg-light fw-semibold text-dark">
                  <i className="bi bi-capsule me-2"></i>{table.title} {table.dose != null ? `${table.dose} mg` : ""}
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered text-center align-middle mb-0 table-striped">
                      <thead className="table-light">
                        <tr>
                          <th>Moment</th>
                          {days.map((day) => (
                            <th key={day}>{days_map[day]}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(table.cells).map(([moment, momentsObj]) => (
                          <tr key={moment}>
                            <td style={{ minWidth: "70px" }}>
                              <strong>{moment_map[moment]}</strong>
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
          
          {/* Calendrier mensuel */}
          <div className='d-none d-md-block'>
            <h4 className="mb-4"><i className="bi bi-calendar-week"></i> Calendrier mensuel</h4>
            <div className="alert alert-info mt-4 mb-4" role="alert">
              <i className="bi bi-pin-angle-fill"></i>
              <span> Cliquez sur un jour du calendrier pour voir les médicaments associés dans une fenêtre.</span>
            </div>
            <div className="card shadow-sm">
              <div className="card-body">
                <FullCalendar
                  ref={calendarRef}
                  plugins={[dayGridPlugin, interactionPlugin, bootstrap5Plugin]}
                  initialView="dayGridWeek"
                  themeSystem="bootstrap5"
                  events={memoizedEvents}
                  headerToolbar={{
                    left: '',
                    center: '',
                    right: ''
                  }}
                  locale={frLocale}
                  firstDay={1}
                  dateClick={handleDateClick}
                  height={400}

                  // click sur les événements
                  eventClick={(info) => {
                    const clickedDate = info.event.startStr.slice(0, 10); // format YYYY-MM-DD
                    handleDateClick({ dateStr: clickedDate });
                  }}
                  buttonText={{
                    today: 'Aujourd’hui',
                    month: 'Mois',
                    week: 'Semaine',
                    day: 'Jour'
                  }}   
                />
              </div>
            </div>
          </div>


          {/* Modal pour afficher les médicaments d'une date */}
          <DateModal
            ref={dateModalRef}
            selectedDate={selectedDate}
            eventsForDay={eventsForDay}
            onNext={() => navigateDay(1)}
            onPrev={() => navigateDay(-1)}
            onSelectDate={onSelectDate}
          />


          {/* Calendrier - Vue mobile uniquement */}
          <div className='d-block d-md-none'>

            <h4 className="mb-4">
              <i className="bi bi-calendar-week"></i> Calendrier mensuel
            </h4>

            <div className="card shadow-sm">
              <div className="card-body">
                <WeeklyEventContent
                  ifModal={false}
                  selectedDate={selectedDate}
                  eventsForDay={eventsForDay}
                  onSelectDate={onSelectDate}
                  onNext={() => navigateDay(1)}
                  onPrev={() => navigateDay(-1)}
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="alert alert-info mt-4 mb-0" role="alert">
          <i className="bi bi-pin-angle-fill"></i>
          <span> Aucun médicament prévu pour le moment.</span>
        </div>
      )}

    </div>
  );
}

export default CalendarPage;