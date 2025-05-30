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
      name: modifyBoxName[selectedModifyBox],
      box_capacity: modifyBoxCapacity[selectedModifyBox],
      stock_alert_threshold: modifyBoxStockAlertThreshold[selectedModifyBox],
      stock_quantity: modifyBoxStockQuantity[selectedModifyBox]
    }
    const res = await calendarSource.updateBox(calendarId, selectedModifyBox, box);
    if (res.success) {
      setAlertMessage("✅ " + res.message);
      setAlertType('success');
    } else {
      setAlertMessage("❌ " + res.error);
      setAlertType('danger');
    }
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
  }

  const addBox = async () => {
    const res = await calendarSource.createBox(calendarId, 'Nouvelle boîte');
    if (res.success) {
      setSelectedModifyBox(res.boxId);
    }
  }

  const deleteBox = async (boxId) => {
    const res = await calendarSource.deleteBox(calendarId, boxId);
    if (res.success) {
      setAlertMessage("✅ " + res.message);
      setAlertType('success');
    } else {
      setAlertMessage("❌ " + res.error);
      setAlertType('danger');
    }
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
        <div className="spinner-border text-primary" role="status">
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
          onClose={() => {
            setAlertMessage('');
            setAlertType('');
          }}
        />
        <div className="row row-cols-1 row-cols-md-2 g-4">
          {boxes.map((box) => (

            <div className="col-12 col-md-6 mb-3" key={box.id}>
              {selectedModifyBox && selectedModifyBox === box.id ? (
                <form onSubmit={handleSubmit}>
                  <BoxCard 
                    box={box} 
                    selectedModifyBox={selectedModifyBox} 
                    setSelectedModifyBox={setSelectedModifyBox}
                    setModifyBoxName={setModifyBoxName}
                    setModifyBoxCapacity={setModifyBoxCapacity}
                    setModifyBoxStockAlertThreshold={setModifyBoxStockAlertThreshold}
                    setModifyBoxStockQuantity={setModifyBoxStockQuantity}
                    restockBox={restockBox}
                    deleteBox={deleteBox}
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
                  restockBox={restockBox}
                  deleteBox={deleteBox}
                />
              )}
            </div>
          ))}
          <div className="col-12 col-md-6 mb-3">
            <button
              type="button"
              onClick={() => addBox()}
              className="btn p-0 border-0 bg-transparent text-start h-100 w-100"
              style={{ cursor: 'pointer' }}
              aria-label="Ajouter une boîte"
              title="Ajouter une boîte"
            >
              <div className="card h-100 shadow-sm border border-success">
                <div className="card-body d-flex flex-column justify-content-center align-items-center">
                  <i className="bi bi-plus-circle text-success fs-1"></i>
                </div>
              </div>
            </button>
          </div>
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
  restockBox,
  deleteBox
}) {
  const editable = selectedModifyBox === box.id;

  return (
    <div className={`card h-100 shadow-sm border ${ box.box_capacity === 0
      ? ''
      : box.stock_quantity <= 0
        ? 'border-danger'
        : box.stock_quantity <= box.stock_alert_threshold
        ? 'border-warning'
        : '' }`}>
      <div className="card-body position-relative">
        <div className="position-absolute top-0 end-0 m-2">
          {(!selectedModifyBox || selectedModifyBox !== box.id) && (
            <button 
              type="button"
              className="btn btn-secondary btn-sm rounded-circle"
              onClick={() => setSelectedModifyBox(box.id)}
              aria-label="Modifier le nom de la boîte"
              title="Modifier le nom de la boîte"
            >
              <i className="bi bi-pencil"></i>
            </button>
          )}
        </div>

        <h5 className="card-title fs-semibold mb-1">
          {selectedModifyBox && selectedModifyBox === box.id ? (
            <input
              type="text"
              aria-label="Nom de la boîte"
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
          <BoxField 
            label="Capacité de la boîte" 
            value={box.box_capacity} 
            editable={editable} 
            onChange={(e) => setModifyBoxCapacity((prev) => ({ ...prev, [box.id]: e.target.value }))} 
          />
          <BoxField 
            label="Seuil d’alerte" 
            value={box.stock_alert_threshold} 
            editable={editable} 
            onChange={(e) => setModifyBoxStockAlertThreshold((prev) => ({ ...prev, [box.id]: e.target.value }))} 
          />
        </div>
        <div className="d-flex mb-2 gap-2 align-items-center">
          <BoxField 
            label="Quantité restante" 
            value={box.stock_quantity} 
            editable={editable} 
            onChange={(e) => setModifyBoxStockQuantity((prev) => ({ ...prev, [box.id]: e.target.value }))} 
          />
          {(!selectedModifyBox || selectedModifyBox !== box.id) && (
            <div className="w-50">
              <button 
                className="btn btn-outline-success"
                onClick={() => {
                  restockBox(box.id);
                }}
                aria-label="Réstockage"
                title="Réstockage"
              >
                <i className="bi bi-plus-circle"></i> Réstockage
              </button>
            </div>
          )}
        </div>

        {(!selectedModifyBox || selectedModifyBox !== box.id) && (
          <StockBadge box={box} />
        )}
        {selectedModifyBox && selectedModifyBox === box.id && (
          <div className="d-flex gap-2">
            <button 
              type="submit"
              className="btn btn-success btn-sm"
              aria-label="Enregistrer"
              title="Enregistrer"
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
              }}
              aria-label="Annuler"
              title="Annuler"
            >
              <i className="bi bi-x"></i> Annuler
            </button>
            <button 
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => {
                deleteBox(box.id);
              }}
              aria-label="Supprimer"
              title="Supprimer"
            >
              <i className="bi bi-trash"></i> Supprimer
            </button>
          </div>
        )}
      </div>

    </div>
  );
}

function BoxField({ label, value, editable, onChange }) {
  return (
    <div className="w-50">
      <small className="text-muted">{label}</small><br />
      {editable ? (
        <input
          type="number"
          aria-label={label}
          className="form-control form-control-sm w-75"
          defaultValue={value}
          onChange={onChange}
          required
        />
      ) : (
        <strong>{value}</strong>
      )}
    </div>
  );
}

function StockBadge({ box }) {
  if (box.box_capacity === 0) return null;

  if (box.stock_quantity <= 0) {
    return <span className="badge bg-danger"><i className="bi bi-exclamation-triangle" /> Stock épuisé</span>;
  }

  if (box.stock_quantity <= box.stock_alert_threshold) {
    return <span className="badge bg-warning"><i className="bi bi-exclamation-triangle" /> Stock bas</span>;
  }

  return <span className="badge bg-success"><i className="bi bi-check-circle" /> Stock élevé</span>;
}



export default BoxesView;