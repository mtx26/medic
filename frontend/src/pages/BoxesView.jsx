import React, { useState, useContext, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { UserContext } from '../contexts/UserContext';
import { useRealtimeBoxesSwitcher } from '../hooks/useRealtimeBoxesSwitcher';
import AlertSystem from '../components/AlertSystem';

function BoxesView({ personalCalendars, sharedUserCalendars, tokenCalendars }) {
  const { userInfo } = useContext(UserContext);
  const location = useLocation();
  const params = useParams();

  const [boxes, setBoxes] = useState([]);
  const [originalBoxes, setOriginalBoxes] = useState([]);
  const [loadingBoxes, setLoadingBoxes] = useState(undefined);
  const [calendarName, setCalendarName] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [selectedModifyBox, setSelectedModifyBox] = useState(null);

  let calendarType = 'personal';
  let calendarId = params.calendarId;

  if (location.pathname.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
    calendarId = params.calendarId;
  } else if (location.pathname.startsWith('/shared-token-calendar')) {
    calendarType = 'token';
    calendarId = params.sharedToken;
  }

  useRealtimeBoxesSwitcher(
    calendarType,
    calendarId,
    setBoxes,
    setOriginalBoxes,
    setLoadingBoxes
  );

  useEffect(() => {
    console.log(boxes);
  }, [boxes]);

  if (loadingBoxes === undefined) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary">
          <span className="visually-hidden">Chargement des médicaments...</span>
        </div>
      </div>
    );
  }

  if (loadingBoxes === false) {
    return (
      <div className="alert alert-danger text-center mt-5" role="alert">
        ❌ Ce lien de calendrier partagé est invalide ou a expiré.
      </div>
    );
  }

  return (
    <div className="container align-items-center d-flex flex-column gap-3">
      <div className="p-1 w-100" style={{ maxWidth: '800px' }}>
        <h4 className="mb-3 fw-bold">Boîtes de médicaments</h4>
        <AlertSystem
          type={alertType}
          message={alertMessage}
          onClose={() => setAlertMessage('')}
        />

        <div className="row">
          {boxes.map((box) => (
            <div className="col-12 col-md-6 col-lg-4 mb-3" key={box.id}>
              <div className={`card h-100 shadow-sm border ${
                box.stock_quantity <= 0
                  ? 'border-danger'
                  : box.stock_quantity <= box.stock_alert_threshold
                  ? 'border-warning'
                  : '' }`}>
                <div className="card-body">
                  <h5 className="align-self-center card-title fs-semibold mb-1">{box.name}</h5>
                  <div className="position-absolute top-0 end-0 m-2">
                    <button 
                      className="btn btn-secondary btn-sm rounded-circle"
                      onClick={() => {
                        setSelectedModifyBox(box);
                      }}>
                      <i className="bi bi-pencil"></i>
                    </button>
                  </div>
                  <div className="d-flex justify-content-between mb-2">
                    <div>
                      <small className="text-muted">Quantité restante</small><br />
                      <strong>{box.stock_quantity}</strong>
                    </div>
                    <div>
                      <small className="text-muted">Seuil d’alerte</small><br />
                      <strong>{box.stock_alert_threshold}</strong>
                    </div>
                  </div>
                  {box.stock_quantity > 0 && box.stock_quantity > box.stock_alert_threshold && (
                    <span className="badge bg-success"><i className="bi bi-check-circle"></i> Stock élevé</span>
                  )}
                  {box.stock_quantity > 0 && box.stock_quantity <= box.stock_alert_threshold && (
                    <span className="badge bg-warning"><i className="bi bi-exclamation-triangle"></i> Stock bas</span>
                  )}
                  {box.stock_quantity <= 0 && (
                    <span className="badge bg-danger"><i className="bi bi-exclamation-triangle"></i> Stock épuisé</span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {boxes.length === 0 && (
          <div className="alert alert-info text-center">
            Aucune boîte de médicament enregistrée pour ce calendrier.
          </div>
        )}
      </div>
    </div>
  );
}

export default BoxesView;