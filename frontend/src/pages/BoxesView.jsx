import React, { useState, useEffect } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useRealtimeBoxesSwitcher } from '../hooks/useRealtimeBoxesSwitcher';
import AlertSystem from '../components/AlertSystem';
import { getCalendarSourceMap } from '../utils/calendarSourceMap';

function BoxesView({ personalCalendars, sharedUserCalendars, tokenCalendars }) {
  const location = useLocation();
  const params = useParams();

  const [boxes, setBoxes] = useState([]);
  const [loadingBoxes, setLoadingBoxes] = useState(undefined);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [alertBoxId, setAlertBoxId] = useState(null);
  const [selectedModifyBox, setSelectedModifyBox] = useState(null);
  const [modifyBoxName, setModifyBoxName] = useState({});
  const [modifyBoxCapacity, setModifyBoxCapacity] = useState({});
  const [modifyBoxStockAlertThreshold, setModifyBoxStockAlertThreshold] = useState({});
  const [modifyBoxStockQuantity, setModifyBoxStockQuantity] = useState({});

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

  useRealtimeBoxesSwitcher(
    calendarType,
    calendarId,
    setBoxes,
    setLoadingBoxes
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const box = {
      name: modifyBoxName[selectedModifyBox.id],
      box_capacity: modifyBoxCapacity[selectedModifyBox.id],
      stock_alert_threshold: modifyBoxStockAlertThreshold[selectedModifyBox.id],
      stock_quantity: modifyBoxStockQuantity[selectedModifyBox.id]
    }
    const res = await calendarSource.updateBox(calendarId, selectedModifyBox.id, box);
    if (res.success) {
      setAlertMessage("✅ " + res.message);
      setAlertType('success');
    } else {
      setAlertMessage("❌ " + res.error);
      setAlertType('danger');
    }
    setAlertBoxId(selectedModifyBox.id);
    setSelectedModifyBox(null);
  };

  const restockBox = async (boxId) => {
    const box = {
      name: boxes.find(box => box.id === boxId).name,
      box_capacity: boxes.find(box => box.id === boxId).box_capacity,
      stock_alert_threshold: boxes.find(box => box.id === boxId).stock_alert_threshold,
      stock_quantity: boxes.find(box => box.id === boxId).box_capacity
    }
    const res = await calendarSource.updateBox(calendarId, boxId, box);
    if (res.success) {
      setAlertMessage("✅ " + res.message);
      setAlertType('success');
    } else {
      setAlertMessage("❌ " + res.error);
      setAlertType('danger');
    }
    setAlertBoxId(boxId);
  }

  useEffect(() => {
    if (Array.isArray(boxes) && boxes.length > 0) {
      for (const box of boxes) {
        setModifyBoxName((prev) => ({ ...prev, [box.id]: box.name }));
        setModifyBoxCapacity((prev) => ({ ...prev, [box.id]: box.box_capacity }));
        setModifyBoxStockAlertThreshold((prev) => ({ ...prev, [box.id]: box.stock_alert_threshold }));
        setModifyBoxStockQuantity((prev) => ({ ...prev, [box.id]: box.stock_quantity }));
      }
    }
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

        <div className="row">
          {boxes.map((box) => (

            <div className="col-12 col-md-6 mb-3" key={box.id}>
              {selectedModifyBox && selectedModifyBox.id === box.id ? (
                <form onSubmit={handleSubmit}>
                  <BoxCard 
                    box={box} 
                    selectedModifyBox={selectedModifyBox} 
                    setSelectedModifyBox={setSelectedModifyBox}
                    setModifyBoxName={setModifyBoxName}
                    setModifyBoxCapacity={setModifyBoxCapacity}
                    setModifyBoxStockAlertThreshold={setModifyBoxStockAlertThreshold}
                    setModifyBoxStockQuantity={setModifyBoxStockQuantity}
                    alertBoxId={alertBoxId}
                    setAlertBoxId={setAlertBoxId}
                    alertType={alertType}
                    setAlertType={setAlertType}
                    alertMessage={alertMessage}
                    setAlertMessage={setAlertMessage}
                    restockBox={restockBox}
                  />
                </form>
              ) : (
                <BoxCard 
                  box={box} 
                  selectedModifyBox={selectedModifyBox} 
                  setSelectedModifyBox={setSelectedModifyBox} 
                  setModifyBoxName={setModifyBoxName}
                  setModifyBoxCapacity={setModifyBoxCapacity}
                  setModifyBoxStockAlertThreshold={setModifyBoxStockAlertThreshold}
                  setModifyBoxStockQuantity={setModifyBoxStockQuantity}
                  alertBoxId={alertBoxId}
                  setAlertBoxId={setAlertBoxId}
                  alertType={alertType}
                  setAlertType={setAlertType}
                  alertMessage={alertMessage}
                  setAlertMessage={setAlertMessage}
                  restockBox={restockBox}
                />
              )}
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

function BoxCard({ 
  box, 
  selectedModifyBox, 
  setSelectedModifyBox, 
  setModifyBoxName, 
  setModifyBoxCapacity, 
  setModifyBoxStockAlertThreshold, 
  setModifyBoxStockQuantity,
  setAlertBoxId,
  setAlertType,
  setAlertMessage,
  alertBoxId,
  alertType,
  alertMessage,
  restockBox
}) {
  return (
    <div className={`card h-100 shadow-sm border ${
      box.stock_quantity <= 0
        ? 'border-danger'
        : box.stock_quantity <= box.stock_alert_threshold
        ? 'border-warning'
        : '' }`}>
      {alertBoxId === box.id && (
        <AlertSystem
          type={alertType}
          message={alertMessage}
          onClose={() => {
            setAlertMessage('');
            setAlertBoxId(null);
            setAlertType('');
          }}
        />
      )}
      <div className="card-body position-relative">
        <div className="position-absolute top-0 end-0 m-2">
          {!selectedModifyBox && (
            <button 
              type="button"
              className="btn btn-secondary btn-sm rounded-circle"
              onClick={() => setSelectedModifyBox(box)}>
              <i className="bi bi-pencil"></i>
            </button>
          )}
        </div>

        <h5 className="card-title fs-semibold mb-1">
          {selectedModifyBox && selectedModifyBox.id === box.id ? (
            <input
              type="text"
              className="form-control form-control-sm"
              defaultValue={box.name}
              onChange={(e) => {
                setModifyBoxName((prev) => ({ ...prev, [box.id]: e.target.value }));
              }}
              required
            />
          ) : (
            box.name
          )}
        </h5>

        <div className="d-flex mb-2 gap-2">
          <div className="w-50">
            <small className="text-muted">Capacité de la boîte</small><br />
            {selectedModifyBox && selectedModifyBox.id === box.id ? (
              <input
                type="number"
                className="form-control form-control-sm w-75"
                defaultValue={box.box_capacity}
                onChange={(e) => {
                  setModifyBoxCapacity((prev) => ({ ...prev, [box.id]: e.target.value }));
                }}
                required
              />
            ) : (
              <strong>{box.box_capacity}</strong>
            )}
          </div>
          <div className="w-50">
            <small className="text-muted">Seuil d’alerte</small><br />
            {selectedModifyBox && selectedModifyBox.id === box.id ? (
              <input
                type="number"
                className="form-control form-control-sm w-75"
                defaultValue={box.stock_alert_threshold}
                onChange={(e) => {
                  setModifyBoxStockAlertThreshold((prev) => ({ ...prev, [box.id]: e.target.value }));
                }}
                required
              />
            ) : (
              <strong>{box.stock_alert_threshold}</strong>
            )}
          </div>
        </div>
        <div className="d-flex mb-2 gap-2 align-items-center">
          <div className="w-50">
          <small className="text-muted">Quantité restante</small><br />
            {selectedModifyBox && selectedModifyBox.id === box.id ? (
              <input
                type="number"
                className="form-control form-control-sm w-75"
                defaultValue={box.stock_quantity}
                onChange={(e) => {
                  setModifyBoxStockQuantity((prev) => ({ ...prev, [box.id]: e.target.value }));
                }}
                required
              />
            ) : (
              <strong>{box.stock_quantity}</strong>
            )}
          </div>
          {!selectedModifyBox && (
            <div className="w-50">
              <button 
                className="btn btn-outline-success"
                onClick={() => {
                  restockBox(box.id);
                }}
              >
                <i className="bi bi-plus-circle"></i> Réstockage
              </button>
            </div>
          )}
        </div>

        {!selectedModifyBox && (
          <>
            {box.stock_quantity > 0 && box.stock_quantity > box.stock_alert_threshold && (
              <span className="badge bg-success"><i className="bi bi-check-circle"></i> Stock élevé</span>
            )}
            {box.stock_quantity > 0 && box.stock_quantity <= box.stock_alert_threshold && (
              <span className="badge bg-warning"><i className="bi bi-exclamation-triangle"></i> Stock bas</span>
            )}
            {box.stock_quantity <= 0 && (
              <span className="badge bg-danger"><i className="bi bi-exclamation-triangle"></i> Stock épuisé</span>
            )}
          </>
        )}
        {selectedModifyBox && selectedModifyBox.id === box.id && (
          <div className="d-flex gap-2">
            <button 
              type="submit"
              className="btn btn-success btn-sm"
            >
              <i className="bi bi-save"></i> Enregistrer
            </button>
            <button 
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSelectedModifyBox(null);
                setModifyBoxName('');
                setModifyBoxCapacity(0);
                setModifyBoxStockAlertThreshold(0);
                setModifyBoxStockQuantity(0);
              }}>
              <i className="bi bi-x"></i> Annuler
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

export default BoxesView;