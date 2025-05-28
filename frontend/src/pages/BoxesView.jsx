import React, { useEffect, useState, useContext } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { getCalendarSourceMap } from '../utils/calendarSourceMap';
import AlertSystem from '../components/AlertSystem';

function MedicineBoxesView({ personalCalendars, sharedUserCalendars, tokenCalendars }) {
  const { userInfo } = useContext(UserContext);
  const location = useLocation();
  const params = useParams();

  const [boxes, setBoxes] = useState([]);
  const [calendarName, setCalendarName] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [loading, setLoading] = useState(true);

  let calendarType = 'personal';
  let calendarId = params.calendarId;

  if (location.pathname.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
    calendarId = params.calendarId;
  } else if (location.pathname.startsWith('/shared-token-calendar')) {
    calendarType = 'token';
    calendarId = params.sharedToken;
  }

  const calendarSource = getCalendarSourceMap(personalCalendars, sharedUserCalendars, tokenCalendars)[calendarType];

  useEffect(() => {
    const fetchBoxes = async () => {
      const rep = await calendarSource.fetchMedicineBoxes(calendarId);
      if (rep.success) {
        setBoxes(rep.boxes);
        setCalendarName(rep.calendarName);
      } else {
        setAlertType('danger');
        setAlertMessage(rep.message || 'Erreur lors du chargement des boîtes.');
      }
      setLoading(false);
    };

    if (userInfo && calendarId) fetchBoxes();
  }, [calendarId, calendarSource, userInfo]);

  if (loading) {
    return <div className="text-center mt-5">Chargement...</div>;
  }

  return (
    <div>
      <div className="card shadow-sm mb-4">
        <div className="card-body">
          <h3 className="card-title">{calendarName} - Boîtes de médicaments</h3>
          <AlertSystem
            type={alertType}
            message={alertMessage}
            onClose={() => setAlertMessage('')}
          />
        </div>
      </div>

      <div className="row">
        {boxes.map((box) => (
          <div className="col-md-6 col-lg-4 mb-4" key={box.id}>
            <div
              className={`card shadow-sm h-100 ${box.stock_quantity <= 0 ? 'border-danger' : box.stock_quantity <= box.stock_alert_threshold ? 'border-warning' : ''}`}
            >
              <div className="card-body">
                <h5 className="card-title">{box.name}</h5>
                <p className="card-text">
                  Quantité restante : <strong>{box.stock_quantity}</strong><br />
                  Seuil d’alerte : {box.stock_alert_threshold}<br />
                  Médicaments : <br />
                  <ul>
                    {box.medicines.map((med) => (
                      <li key={med.id}>{med.name} {med.dose && `- ${med.dose}mg`}</li>
                    ))}
                  </ul>
                </p>
                {(box.stock_quantity <= 0 || box.stock_quantity <= box.stock_alert_threshold) && (
                  <span className="badge bg-danger">⚠ Stock bas</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {boxes.length === 0 && (
        <div className="alert alert-info text-center">Aucune boîte de médicament enregistrée pour ce calendrier.</div>
      )}
    </div>
  );
}

export default MedicineBoxesView;
