import React, { useEffect, useContext, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { getCalendarSourceMap } from '../utils/calendarSourceMap';
import AlertSystem from '../components/AlertSystem';
import isEqual from 'lodash/isEqual';
import OrientationWrapper from '../components/OrientationWrapper';

function PillboxPage({
  personalCalendars,
  sharedUserCalendars,
  tokenCalendars,
}) {
  // 📍 Paramètres d'URL et navigation
  const location = useLocation();
  const params = useParams();

  // 🔐 Contexte d'authentification
  const { userInfo } = useContext(UserContext); // Contexte de l'utilisateur connecté

  const [calendarTable, setCalendarTable] = useState([]); // Événements du calendrier
  const [alertType, setAlertType] = useState(''); // Type d'alerte
  const [alertMessage, setAlertMessage] = useState(''); // Message d'alerte
  const [loading, setLoading] = useState(undefined); // État de chargement du calendrier
  const [selectedMedIndex, setSelectedMedIndex] = useState(0);
  const [orderedMeds, setOrderedMeds] = useState([]);
  const navigate = useNavigate();
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const days_map = {
    Mon: 'Lundi',
    Tue: 'Mardi',
    Wed: 'Mercredi',
    Thu: 'Jeudi',
    Fri: 'Vendredi',
    Sat: 'Samedi',
    Sun: 'Dimanche',
  };
  const pill_count = {
    0.25: "0.25",
    0.5: "0.50",
    0.75: "0.75",
    1: "1.00",
  };
  const time_order = ['morning', 'noon', 'evening'];
  const moment_map = {
    morning: 'Matin',
    noon: 'Midi',
    evening: 'Soir',
  };

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

  const calendarSource = getCalendarSourceMap(
    personalCalendars,
    sharedUserCalendars,
    tokenCalendars
  )[calendarType];

  const handleNextMed = () => {
    setSelectedMedIndex((prev) =>
      prev + 1 < orderedMeds.length ? prev + 1 : 0
    );
  };

  const handlePreviousMed = () => {
    setSelectedMedIndex((prev) => (prev > 0 ? prev - 1 : prev));
  };
  

  // Fonction pour charger le calendrier lorsque l'utilisateur est connecté ou que le calendrier est un token
  useEffect(() => {
    if (!calendarId) return;
    if (calendarType === 'personal' || calendarType === 'sharedUser') {
      if (!userInfo) {
        setLoading(undefined);
        return;
      }
      if (!userInfo) {
        setLoading(undefined);
        return;
      }
    }
    const load = async () => {
      const rep = await calendarSource.fetchSchedule(calendarId);
      if (rep.success) {
        if (!isEqual(rep.table, calendarTable)) {
          setCalendarTable(rep.table);
        }
        setLoading(!rep.success);
      }
    };

    load();
  }, [calendarId, calendarSource.fetchSchedule, userInfo]);

  useEffect(() => {
    const allMeds = time_order.flatMap((moment) => {
      const meds = calendarTable[moment] || [];
      return meds
        .slice()
        .sort((a, b) => a.title.localeCompare(b.title))
        .map((med) => ({ ...med, moment }));
    });
    setOrderedMeds(allMeds);
    setSelectedMedIndex(0);
  }, [calendarTable]);

  if (loading === undefined && calendarId) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: '60vh' }}
      >
        <div className="spinner-border text-primary">
          <span className="visually-hidden">Chargement du calendrier...</span>
        </div>
      </div>
    );
  }

  if (loading === true && calendarId) {
    return (
      <div className="alert alert-danger text-center mt-5" role="alert">
        ❌ Ce lien de calendrier partagé est invalide ou a expiré.
      </div>
    );
  }

  return (
<OrientationWrapper>
  <div className="container-fluid text-center">

    {orderedMeds.length > 0 && (
      <>
        {/* Moment */}
        <div className="bg-white text-primary border rounded-top px-3 py-2">
          <h4 className="mb-0"><strong>{moment_map[orderedMeds[selectedMedIndex].moment]}</strong></h4>
        </div>

        {/* Médicament */}
        <div className="bg-primary text-white px-3 py-3 rounded-bottom mb-4">
          <h4 className="mb-0"><strong>{orderedMeds[selectedMedIndex].title}</strong></h4>
        </div>

        {/* Pilulier */}
        <div className="row row-cols-7 g-3 align-items-stretch text-center">
          {days.map((day) => (
            <div key={day} className="col">
              <div className="d-flex flex-column h-100">
                <h6 className="mb-2">{days_map[day]}</h6>
                <div className="border rounded bg-light p-2 flex-grow-1 d-flex align-items-center justify-content-center">
                  {orderedMeds[selectedMedIndex].cells[day] !== undefined && (
                    <img
                      src={`/icons/pills/${pill_count[orderedMeds[selectedMedIndex].cells[day]]}_pills.svg`}
                      alt="Pills"
                      className="img-fluid"
                      style={{ maxWidth: "100px", height: "auto" }}
                    />

                  )}
                </div>
              </div>
            </div>
          ))}
        </div>



        <div className="d-flex gap-3 justify-content-between text-center">
          {/* Bouton précédent */}
          <button 
            className="btn btn-outline-primary mt-4" 
            onClick={handlePreviousMed}
            disabled={selectedMedIndex === 0}
          >
            <i className="bi bi-arrow-left"></i> Précédent
          </button>

          {/* Bouton suivant, midi ou soir ou Terminé */}
          {selectedMedIndex < orderedMeds.length - 1 ? (
            <>
              {(() => {
                const currentMoment = orderedMeds[selectedMedIndex].moment;
                const nextMoment = orderedMeds[selectedMedIndex + 1].moment;

                if (currentMoment === nextMoment) {
                  return (
                    <button
                      className="btn btn-outline-primary mt-4"
                      onClick={handleNextMed}
                    >
                      Suivant <i className="bi bi-arrow-right"></i>
                    </button>
                  );
                } else {
                  return (
                    <button
                      className="btn btn-success mt-4"
                      onClick={handleNextMed}
                    >
                      {moment_map[nextMoment]} <i className="bi bi-arrow-right"></i>
                    </button>
                  );
                }
              })()}
            </>
          ) : (
            <button
              className="btn btn-success mt-4"
              onClick={() => navigate(`/${basePath}/${calendarId}`)}
            >
              <i className="bi bi-check-circle"></i> Terminé
            </button>
          )}
        </div>
      </>
    )}


    {orderedMeds.length === 0 && (
      <p className="mt-5">Aucun médicament à afficher.</p>
    )}
  </div>
</OrientationWrapper>


);
}

export default PillboxPage;
