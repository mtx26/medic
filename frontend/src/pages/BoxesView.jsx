import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { useRealtimeBoxesSwitcher } from '../hooks/useRealtimeBoxesSwitcher';
import AlertSystem from '../components/AlertSystem';
import { getCalendarSourceMap } from '../utils/calendarSourceMap';
import { v4 as uuidv4 } from 'uuid';
import { fetchSuggestions } from '../utils/fetchSuggestions';
import ViewNoticeButton from '../components/PdfView';


function BoxesView({ personalCalendars, sharedUserCalendars, tokenCalendars }) {
  const location = useLocation();
  const params = useParams();

  const [boxes, setBoxes] = useState([]);
  const [loadingBoxes, setLoadingBoxes] = useState(undefined);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('');
  const [selectedModifyBox, setSelectedModifyBox] = useState(null);
  const [selectedDropBox, setSelectedDropBox] = useState({});
  const [modifyBoxName, setModifyBoxName] = useState({});
  const [modifyBoxCapacity, setModifyBoxCapacity] = useState({});
  const [modifyBoxStockAlertThreshold, setModifyBoxStockAlertThreshold] = useState({});
  const [modifyBoxStockQuantity, setModifyBoxStockQuantity] = useState({});
  const [boxConditions, setBoxConditions] = useState({});
  const [dose, setDose] = useState({});

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
      dose: dose[selectedModifyBox],
      box_capacity: modifyBoxCapacity[selectedModifyBox],
      stock_alert_threshold: modifyBoxStockAlertThreshold[selectedModifyBox],
      stock_quantity: modifyBoxStockQuantity[selectedModifyBox],
      conditions: Object.values(boxConditions[selectedModifyBox]).filter(condition => condition !== undefined)
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
      dose: boxes.find(box => box.id === boxId).dose,
      box_capacity: boxes.find(box => box.id === boxId).box_capacity,
      stock_alert_threshold: boxes.find(box => box.id === boxId).stock_alert_threshold,
      stock_quantity: boxes.find(box => box.id === boxId).box_capacity,
      conditions: boxes.find(box => box.id === boxId).conditions
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
      setSelectedDropBox((prev) => ({ ...prev, [res.boxId]: true }));
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
    if (boxes.length > 0) {
      setModifyBoxName(boxes.reduce((acc, box) => ({...acc, [box.id]: box.name}), {}))
      setDose(boxes.reduce((acc, box) => ({...acc, [box.id]: box.dose}), {}))
      setModifyBoxCapacity(boxes.reduce((acc, box) => ({...acc, [box.id]: box.box_capacity}), {}))
      setModifyBoxStockAlertThreshold(boxes.reduce((acc, box) => ({...acc, [box.id]: box.stock_alert_threshold}), {}))
      setModifyBoxStockQuantity(boxes.reduce((acc, box) => ({...acc, [box.id]: box.stock_quantity}), {}))
      setBoxConditions(boxes.reduce((acc, box) => ({...acc, [box.id]: box.conditions.reduce((acc, condition) => ({...acc, [condition.id]: condition}), {})}), {}))
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
        <h4 className="mb-3 fw-bold">
          <i className="bi bi-box-seam"></i> Boîtes de médicaments
        </h4>
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
                    modifyBoxName={modifyBoxName}
                    setModifyBoxCapacity={setModifyBoxCapacity} 
                    modifyBoxCapacity={modifyBoxCapacity}
                    setModifyBoxStockAlertThreshold={setModifyBoxStockAlertThreshold} 
                    modifyBoxStockAlertThreshold={modifyBoxStockAlertThreshold}
                    setModifyBoxStockQuantity={setModifyBoxStockQuantity}
                    modifyBoxStockQuantity={modifyBoxStockQuantity}
                    restockBox={restockBox}
                    deleteBox={deleteBox}
                    selectedDropBox={selectedDropBox}
                    setSelectedDropBox={setSelectedDropBox}
                    boxConditions={boxConditions}
                    setBoxConditions={setBoxConditions}
                    setDose={setDose}
                    dose={dose}
                  />
                </form>
              ) : (
                <BoxCard 
                  box={box} 
                  selectedModifyBox={selectedModifyBox} 
                  setSelectedModifyBox={setSelectedModifyBox} 
                  setModifyBoxName={setModifyBoxName} 
                  modifyBoxName={modifyBoxName}
                  setModifyBoxCapacity={setModifyBoxCapacity} 
                  modifyBoxCapacity={modifyBoxCapacity}
                  setModifyBoxStockAlertThreshold={setModifyBoxStockAlertThreshold} 
                  modifyBoxStockAlertThreshold={modifyBoxStockAlertThreshold}
                  setModifyBoxStockQuantity={setModifyBoxStockQuantity}
                  modifyBoxStockQuantity={modifyBoxStockQuantity}
                  restockBox={restockBox}
                  deleteBox={deleteBox}
                  selectedDropBox={selectedDropBox}
                  setSelectedDropBox={setSelectedDropBox}
                  boxConditions={boxConditions}
                  setBoxConditions={setBoxConditions}
                  setDose={setDose}
                  dose={dose}
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
      </div>
    </div>
  );
}

function BoxCard({ 
  box, 
  selectedModifyBox, 
  setSelectedModifyBox, 
  setModifyBoxName, 
  modifyBoxName,
  setModifyBoxCapacity, 
  modifyBoxCapacity,
  setModifyBoxStockAlertThreshold, 
  modifyBoxStockAlertThreshold,
  setModifyBoxStockQuantity,
  modifyBoxStockQuantity,
  restockBox,
  deleteBox,
  selectedDropBox,
  setSelectedDropBox,
  boxConditions,
  setBoxConditions,
  setDose,
  dose,
}) {
  const editable = selectedModifyBox === box.id;
  const timeOfDayMap = {
    'morning': 'Matin',
    'noon': 'Midi',
    'evening': 'Soir'
  }

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
            <InputDropdown
              name={box.name}
              dose={dose[box.id]}
              onChangeName={(newName) => setModifyBoxName({ ...modifyBoxName, [box.id]: newName })}
              onChangeDose={(newDose) => setDose({ ...dose, [box.id]: newDose })}
              onChangeBoxCapacity={(newBoxCapacity) => setModifyBoxCapacity({ ...modifyBoxCapacity, [box.id]: newBoxCapacity })}
              onChangeStockQuantity={(newStockQuantity) => setModifyBoxStockQuantity({ ...modifyBoxStockQuantity, [box.id]: newStockQuantity })}
              fetchSuggestions={fetchSuggestions}
            />
          ) : (
            modifyBoxName[box.id] + (dose[box.id] > 0 ? " (" + dose[box.id] + " mg)" : "")
          )}
        </h5>

        <div className="d-flex mb-2 gap-2">
          <BoxField 
            type="number"
            label="Capacité de la boîte" 
            value={modifyBoxCapacity[box.id]} 
            editable={editable} 
            onChange={(e) => setModifyBoxCapacity({...modifyBoxCapacity, [box.id]: e.target.value})} 
          />
          <BoxField 
            type="number"
            label="Seuil d’alerte" 
            value={modifyBoxStockAlertThreshold[box.id]} 
            editable={editable} 
            onChange={(e) => setModifyBoxStockAlertThreshold({...modifyBoxStockAlertThreshold, [box.id]: e.target.value})} 
          />
        </div>
        <div className="d-flex mb-2 gap-2 align-items-center">
          <BoxField 
            type="number"
            label="Quantité restante" 
            value={modifyBoxStockQuantity[box.id]} 
            editable={editable} 
            onChange={(e) => setModifyBoxStockQuantity({...modifyBoxStockQuantity, [box.id]: e.target.value})} 
          />
          {(!selectedModifyBox || selectedModifyBox !== box.id) && (
            <>
              <div className="w-50">
                <button 
                  className="btn btn-outline-success"
                  onClick={() => restockBox(box.id)}
                  aria-label="Réstockage"
                  title="Réstockage"
                >
                  <i className="bi bi-plus-circle"></i> Réstockage
                </button>
              </div>
            </>
          )}
        </div>

        {(!selectedModifyBox || selectedModifyBox !== box.id) && (
          <div className='d-flex mb-2 gap-2 align-items-center'>
            <div className='w-50'>
              <StockBadge box={box} />
            </div>
            <div className='w-50'>
              <ViewNoticeButton url={box.url_notice_fr} />
            </div>
          </div>
        )}


        <div className="mt-4 mb-2">
          <hr className="border-dark mb-0" />
          <h5 className="w-100">
            <button 
              className="btn w-100 text-start d-flex justify-content-between align-items-center border-0 bg-transparent px-0 pb-0 mb-0"
              type="button"
              title="Conditions de prise"
              aria-label="Conditions de prise"
              onClick={() => {
                if (selectedDropBox[box.id] === true) {
                  setSelectedDropBox((prev) => ({ ...prev, [box.id]: false }));
                } else {
                  setSelectedDropBox((prev) => ({ ...prev, [box.id]: true }));
                }
              }}
            >
              <span>Conditions de prise</span>
              <i className={`bi bi-chevron-${selectedDropBox[box.id] === true ? 'up' : 'down'}`}></i>
            </button>
          </h5>

          {selectedDropBox[box.id] === true && (
            <div className="mt-2">
              {editable ? (
                <>
                  {Object.values(boxConditions[box.id] || {}).filter(condition => condition !== undefined).map((condition) => (
                      <div key={condition.id}>
                        <div className="mb-2 p-3 border rounded bg-light">
                          <label htmlFor="tablet_count">Nombre de comprimés</label>
                          <input 
                            type="number" 
                            className="form-control form-control-sm" 
                            defaultValue={condition.tablet_count}
                            title="Nombre de comprimés"
                            aria-label="Nombre de comprimés"
                            min={0}
                            step={0.25}
                            onChange={(e) => setBoxConditions(prev => ({...prev, [box.id]: {...prev[box.id], [condition.id]: {...prev[box.id][condition.id], tablet_count: e.target.value}}}))}
                          />
                          <label htmlFor="time_of_day">Heure de prise</label>
                          <select 
                            className="form-control form-control-sm" 
                            defaultValue={condition.time_of_day}
                            title="Heure de prise"
                            aria-label="Heure de prise"
                            onChange={(e) => setBoxConditions(prev => ({...prev, [box.id]: {...prev[box.id], [condition.id]: {...prev[box.id][condition.id], time_of_day: e.target.value}}}))}
                          >
                            <option value="morning">Matin</option>
                            <option value="noon">Midi</option>
                            <option value="evening">Soir</option>
                          </select>
                          <label htmlFor="interval_days">Intervalle de jours</label>
                          <input 
                            type="number" 
                            className="form-control form-control-sm" 
                            defaultValue={condition.interval_days}
                            title="Intervalle de jours"
                            aria-label="Intervalle de jours"
                            min={0}
                            step={1}
                            onChange={(e) => setBoxConditions(prev => ({...prev, [box.id]: {...prev[box.id], [condition.id]: {...prev[box.id][condition.id], interval_days: e.target.value}}}))}
                          />
                          <label htmlFor="start_date">Date de début</label>
                          <input 
                            type="date" 
                            className="form-control form-control-sm" 
                            title="Date de début"
                            aria-label="Date de début"
                            defaultValue={condition.start_date ? new Date(condition.start_date).toISOString().split('T')[0] : ''} 
                            onChange={(e) => setBoxConditions(prev => ({...prev, [box.id]: {...prev[box.id], [condition.id]: {...prev[box.id][condition.id], start_date: e.target.value}}}))}
                          />
                          <button 
                            type="button" 
                            className="btn btn-danger btn-sm mt-2"
                            onClick={() => setBoxConditions(prev => ({...prev, [box.id]: {...prev[box.id], [condition.id]: undefined}}))}
                            title="Supprimer"
                            aria-label="Supprimer"
                          >
                            <i className="bi bi-trash"></i> Supprimer
                          </button>
                        </div>
                      </div>
                    ))
                  }

                  <button 
                    type="button" 
                    className="btn btn-outline-dark w-100"
                    onClick={() => {
                      const id = uuidv4();
                      setBoxConditions(prev => ({...prev, [box.id]: {...prev[box.id], [id]: { id, tablet_count: 1, interval_days: 1, start_date: null, time_of_day: 'morning' }}}));
                      setSelectedModifyBox(box.id);
                    }}
                  >
                    <i className="bi bi-plus-lg me-2"></i>
                    Ajouter une condition
                  </button>
                </>
              ) : (
                Object.values(box.conditions).filter(condition => condition !== undefined).length > 0 ? (
                  Object.values(box.conditions).filter(condition => condition !== undefined).map((condition) => (
                    <div className="mb-2 p-3 border rounded bg-light" key={condition.id}>
                      <strong>
                        {condition.tablet_count} {condition.tablet_count > 1 ? "comprimés" : "comprimé"}
                      </strong> tous les <strong>
                        {condition.interval_days} {condition.interval_days > 1 ? "jours" : "jour"}
                      </strong> chaque <strong>
                        {timeOfDayMap[condition.time_of_day]}
                      </strong><br />
                      {condition.interval_days > 1 && <small className="text-muted">À partir du {new Date(condition.start_date).toLocaleDateString()}</small>}
                    </div>
                  ))
                ) : (
                  <div className="border rounded bg-light d-flex justify-content-start align-items-center p-2 mb-2">
                    <p className="text-muted mb-0">Aucune condition de prise</p>
                  </div>
                )
              )}
            </div>
          )}
        </div>

        {selectedModifyBox && selectedModifyBox === box.id && (
          <>
            <hr />
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
                  setModifyBoxName({...modifyBoxName, [box.id]: box.name});
                  setModifyBoxCapacity({...modifyBoxCapacity, [box.id]: box.box_capacity});
                  setModifyBoxStockAlertThreshold({...modifyBoxStockAlertThreshold, [box.id]: box.stock_alert_threshold});
                  setModifyBoxStockQuantity({...modifyBoxStockQuantity, [box.id]: box.stock_quantity});
                  setBoxConditions({...boxConditions, [box.id]: box.conditions.reduce((acc, condition) => ({ ...acc, [condition.id]: condition }), {})});
                  setDose({...dose, [box.id]: box.dose});
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
          </>
        )}
      </div>

    </div>
  );
}

function BoxField({ type, label, value, editable, onChange }) {
  return (
    <div className="w-50">
      <small className="text-muted">{label}</small><br />
      {editable ? (
        <input
          type={type}
          aria-label={label}
          className="form-control form-control-sm w-75"
          defaultValue={value}
          value={value}
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

function InputDropdown({ name, dose, onChangeName, onChangeDose, onChangeBoxCapacity, onChangeStockQuantity, fetchSuggestions }) {
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef();

  const handleInputChange = async (e) => {
    const val = e.target.value;
    onChangeName(val);

    if (val.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    const data = await fetchSuggestions(val);
    setSuggestions(data);
    setShowDropdown(true);
  };

  const handleSelect = (item) => {
    const onlyNumbers = parseInt(item.dose.replace(/\D/g, ""));
    onChangeName(item.name);
    onChangeDose(onlyNumbers);
    onChangeBoxCapacity(item.conditionnement);
    onChangeStockQuantity(item.conditionnement);
    setShowDropdown(false);
    setSuggestions([]);
    inputRef.current.value = item.name;
  };

  return (
    <div className="position-relative w-100 d-flex gap-2">
      <div className="w-50">
        <small className="text-muted">Nom</small><br />
        <input
          ref={inputRef}
          type="text"
          className="form-control form-control-sm"
          defaultValue={name}
          onChange={handleInputChange}
          onBlur={() => setTimeout(() => setShowDropdown(false), 150)}
          placeholder="Commencez à taper..."
        />
      </div>
      <BoxField
        type="number"
        label="Dose"
        value={dose}
        editable={true}
        onChange={(e) => onChangeDose(parseInt(e.target.value))}
      />
      {showDropdown && suggestions.length > 0 && (
        <ul className="dropdown-menu show position-absolute top-100 start-0 w-100" style={{ maxHeight: 200, overflowY: "auto" }}>
          {suggestions.map((item, i) => (
            <li key={i}>
              <button
                type="button"
                className="dropdown-item text-wrap"
                onClick={() => handleSelect(item)}
              >
                {item.name} - {item.dose} - {item.conditionnement} {item.forme_pharmaceutique}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}


export default BoxesView;