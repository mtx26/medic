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
import { auth } from '../services/firebase';


function CalendarPage({ personalCalendars, sharedUserCalendars, tokenCalendars }) {

  // 📍 Paramètres d'URL et navigation
  const navigate = useNavigate(); // Hook de navigation
  const location = useLocation();
  const params = useParams();

  // 🔐 Contexte d'authentification
  const { userInfo } = useContext(UserContext); // Contexte de l'utilisateur connecté
  
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

  // Fonction pour naviguer vers une date
  const onSelectDate = (isoDate) => {
    setSelectedDate(isoDate);
    setEventsForDay(calendarEvents.filter(e => e.start.startsWith(isoDate)));
  }


  // Fonction pour naviguer vers la semaine suivante ou precedente
  const onWeekSelect = async (monday) => {
    const isoDate = formatToLocalISODate(monday);
    setStartDate(isoDate);
    const rep = await calendarSource.fetchSchedule(calendarId, isoDate);
    if (rep.success) {
      setCalendarEvents(rep.schedule);
      setCalendarTable(rep.table);
      calendarRef.current?.getApi().gotoDate(isoDate);
      onSelectDate(isoDate);
    }
  }


  // Fonction pour gérer le clic sur une date
  const handleDateClick = (info) => {
    const clickedDate = info.dateStr;
    setSelectedDate(clickedDate);
    dateModalRef.current?.open();
  }; 


  // Fonction pour partager le calendrier
  const handleShareCalendarClick = async () => {
    setExistingShareToken(null);
    const token = await tokenCalendars.tokensList.find(
      (t) => t.calendar_id === calendarId && !t.revoked && t.owner_uid === userInfo.uid
    );
    const rep = await sharedUserCalendars.fetchSharedUsers(calendarId);
    if (rep.success) {
      setSharedUsersData(rep.users);
    }
    setExistingShareToken(token || null);
    shareModalRef.current?.open();
  }


  // Fonction pour naviguer vers la date suivante ou precedente
  const navigateDay = (direction) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + direction);
    const newDate = formatToLocalISODate(current);
    setSelectedDate(newDate);
  };
  
  
  // Fonction pour charger le calendrier lorsque l'utilisateur est connecté
  useEffect(() => {
    if (!calendarId) return;
    if (calendarType === 'personal' || calendarType === 'sharedUser') {
      if (!userInfo) {
        setLoading(undefined);
        return;
      }
      if (!auth?.currentUser) {
        setLoading(undefined);
        return;
      }
    }
    const load = async () => {
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
        setLoading(!rep.success);
      }
    };

    load();
  }, [calendarId, calendarSource.fetchSchedule, userInfo, auth?.currentUser]);


  // 📍 Filtrage des événements pour un jour spécifique
  useEffect(() => {
    if (!selectedDate || !calendarEvents.length) return;
    const filtered = calendarEvents.filter((event) => event.start.startsWith(selectedDate));
    setEventsForDay(filtered);
  }, [selectedDate, calendarEvents]);


  // 📍 Mémoisation des événements pour le calendrier
  const memoizedEvents = useMemo(() => {
    return calendarEvents.map((event) => ({
      title: `${event.title} ${event.dose != null ? `${event.dose} mg` : ""} (${event.tablet_count})`,
      start: event.start,
      color: event.color,
    }));
  }, [calendarEvents]);  

  
  // 📍 Récupération des informations de l'utilisateur propriétaire du calendrier
  useEffect(() => {
    if (!userInfo || !calendarId) return;
    if (calendarType === 'sharedUser') {
      if ( calendarSource.calendarsData && calendarSource.calendarsData.find((calendar) => calendar.id === calendarId)) {
        const owner_user = calendarSource.calendarsData.find((calendar) => calendar.id === calendarId);
        setOwnerUser({
          email: owner_user.owner_email,
          display_name: owner_user.owner_name,
          photo_url: owner_user.owner_photo_url
        });
      }
    }
  }, [calendarType, calendarSource.calendarsData, calendarId, userInfo]);


  if ( loading === undefined && calendarId) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary">
          <span className="visually-hidden">Chargement du calendrier...</span>
        </div>
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
  <>
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

    <h3 className="mb-5 fw-bold">
      <i className="bi bi-calendar-week"></i> Calendrier
    </h3>
    <div className="container">
      <div className="row justify-content-center">

        <div className="col-12 col-lg-4 mb-4">
          <div className="mb-3">

            {/* Alert system */}
            <AlertSystem
              type={alertType}
              message={alertMessage}
              onClose={() => {
                setAlertMessage("");
              }}
            />

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
                  className="btn btn-outline-warning"
                  title="Partager"
                  onClick={handleShareCalendarClick}
                >
                  <i className="bi bi-box-arrow-up"></i>
                </button>
              )}

            </div>
          </div>

          {/* Bouton pour naviguer vers la semaine suivante ou precedente */}
          {Object.keys(calendarTable).filter((key) => calendarTable[key].length > 0).length > 0 && (
            <div className="mb-2">
              <h4 className="mb-3 fw-bold">
                <i className="bi bi-calendar-date"></i> Semaine de référence
              </h4>
              <WeekCalendarSelector
                selectedDate={startDate}
                onWeekSelect={onWeekSelect}
              />
            </div>
          )}
        </div>

        {/* Tableau hebdomadaire */}
        {Object.keys(calendarTable).filter((key) => calendarTable[key].length > 0).length > 0 && (
          <div className="col-12 col-lg-8 mb-4">
            <div className="mb-2">
              <h4 className="mb-3 fw-bold">
                <i className="bi bi-table"></i> Tableau hebdomadaire
              </h4>
              {/*trier matin, midi, soir et supprimer les moments non présents*/}
              {Object.keys(calendarTable).sort((a, b) => {
                const order = ['morning', 'noon', 'evening'];
                return order.indexOf(a) - order.indexOf(b);
              }).filter((moment) => calendarTable[moment].length > 0).map((moment, index) => (
                <div key={moment}>
                  <h5 className="mb-3 fw-semibold">
                    <i className="bi bi-clock-fill"></i> {moment_map[moment]}
                  </h5>
                  {calendarTable[moment].map((table, index) => (
                    <div className="card border border-secondary-subtle mb-2 shadow-sm" key={index}>
                      <div className="card-header bg-light fw-semibold text-dark">
                        <i className="bi bi-capsule me-2"></i>{table.title} {table.dose != null ? `${table.dose} mg` : ""}
                      </div>
                      <div className="card-body p-0">
                        <div className="table-responsive">
                          <table className="table table-sm table-bordered text-center align-middle mb-0 table-striped">
                            <thead className="table-light">
                              <tr>
                                {days.map((day) => (
                                  <th key={day}>{days_map[day]}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                {days.map((day) => (
                                  <td key={day}>
                                    {table.cells[day] && (
                                      <span className="text-muted small px-2 py-1 rounded d-inline-block">
                                        {table.cells[day]}
                                      </span>
                                    )}
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  ))}
                  {index < Object.keys(calendarTable).filter((key) => calendarTable[key].length > 0).length - 1 && (
                    <hr className="mt-4 shadow-sm" />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
    {Object.keys(calendarTable).filter((key) => calendarTable[key].length > 0).length > 0 ? (
      <>
        {/* Calendrier mensuel */}
        <div className='container d-none d-md-block'>
          <h4 className="mb-3 fw-bold">
            <i className="bi bi-calendar-week"></i> Calendrier par semaine
          </h4>
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
          
          {/* Modal pour afficher les médicaments d'une date */}
          <DateModal
            ref={dateModalRef}
            selectedDate={selectedDate}
            eventsForDay={eventsForDay}
            onNext={() => navigateDay(1)}
            onPrev={() => navigateDay(-1)}
            onSelectDate={onSelectDate}
          />
        </div>

        {/* Calendrier - Vue mobile uniquement */}
        <div className='d-block d-md-none'>

          <h4 className="mb-3 fw-bold">
            <i className="bi bi-calendar-week"></i> Calendrier journalier
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
  </>
  );
}

export default CalendarPage;