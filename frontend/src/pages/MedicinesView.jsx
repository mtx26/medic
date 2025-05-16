// MedicamentsPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import AlertSystem from '../components/AlertSystem';
import { useRealtimeMedicinesSwitcher } from '../hooks/useRealtimeMedicinesSwitcher';
import { getCalendarSourceMap } from '../utils/calendarSourceMap';
import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';


function MedicinesView({ personalCalendars, sharedUserCalendars, tokenCalendars }) {
  // 📍 Paramètres d’URL et navigation
  const navigate = useNavigate(); // Hook de navigation
  const location = useLocation();
  const params = useParams();

  // ⚠️ Alertes et confirmations
  const [alertType, setAlertType] = useState(""); // État pour le type d'alerte
  const [alertMessage, setAlertMessage] = useState(""); // État pour le message d'alerte
  const [onConfirmAction, setOnConfirmAction] = useState(null); // État pour l'action à confirmer

  // 📦 Données & interface
  const [checked, setChecked] = useState([]); // Médicaments cochés pour suppression
  const [medicinesData, setMedicinesData] = useState([]); // Liste des médicaments du calendrier actif
  const [originalMedicinesData, setOriginalMedicinesData] = useState([]); // Liste des médicaments d’origine
  const [loadingMedicines, setLoadingMedicines] = useState(undefined); // État de chargement des médicaments
  const [highlightedId, setHighlightedId] = useState(null); // État pour l'élément mis en évidence dans la liste
  const lastMedRef = useRef(null); // Référence vers le dernier médicament affiché

  const { authReady } = useContext(UserContext);

  // 🔄 Modifications
  const hasChanges = JSON.stringify(medicinesData) !== JSON.stringify(originalMedicinesData); // Détection des changements dans les médicaments
  

  let calendarType = 'personal';
  let calendarId = params.calendarId;
  let basePath = 'calendars';

  if (location.pathname.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
    calendarId = params.calendarId;
    basePath = 'shared-user-calendar';
  }

  const calendarSource = getCalendarSourceMap(personalCalendars, sharedUserCalendars, tokenCalendars)[calendarType];

  const toggleSelection = (id) => {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleMedChange = (id, field, value) => {
    const index = medicinesData.findIndex((med) => med.id === id);
    if (index === -1) return; // id introuvable, on ne fait rien
  
    const updated = [...medicinesData]; // copie du tableau
    const numericFields = ['tablet_count', 'interval_days'];
  
    if (field === 'time') {
      updated[index][field] = [value];
    } else if (numericFields.includes(field)) {
      updated[index][field] = value === '' ? '' : parseFloat(value);
    } else {
      updated[index][field] = value;
    }
  
    setMedicinesData(updated);
  };
  

  const isMedValid = (med) => {
    const hasName = typeof med.name === 'string' && med.name.trim() !== '';
  
    const hasTabletCount =
      med.tablet_count !== '' &&
      med.tablet_count !== null &&
      !isNaN(parseFloat(med.tablet_count));
  
    const hasValidTime =
      Array.isArray(med.time) &&
      med.time.length > 0 &&
      ['morning', 'noon', 'evening'].includes(med.time[0]);
  
    const hasInterval =
      med.interval_days !== '' &&
      med.interval_days !== null &&
      !isNaN(parseInt(med.interval_days));
  
    const hasValidStartDate =
      parseInt(med.interval_days) === 1 ||
      (typeof med.start_date === 'string' && med.start_date.trim() !== '');
  
    return hasName && hasTabletCount && hasValidTime && hasInterval && hasValidStartDate;
  };  

  const allMedsValid = medicinesData.length > 0 && medicinesData.every(isMedValid);

  const handleSave = async () => {
    const rep = await calendarSource.updateMedicines(calendarId, medicinesData);
    if (rep.success) {
      setAlertMessage("✅ " + rep.message);
      setAlertType("success");
      setMedicinesData(rep.medicinesData);
      setOriginalMedicinesData(JSON.parse(JSON.stringify(rep.originalMedicinesData)));
    } else {
      setAlertMessage("❌ " + rep.error);
      setAlertType("danger");
      setMedicinesData(JSON.parse(JSON.stringify(originalMedicinesData)));
    }
    setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 2000);
    setOnConfirmAction(null);
  };
  
  const onSaveClick = () => {
    setAlertType("confirm-safe");
    setAlertMessage("✅ Enregistrer les modifications ?");
    setOnConfirmAction(() => handleSave);
  };

  const handleDelete = async () => {
    const rep = await calendarSource.deleteMedicines(calendarId, checked, medicinesData);
    if (rep.success) {
      setMedicinesData(rep.medicinesData);
      setChecked([]);
      setOriginalMedicinesData(JSON.parse(JSON.stringify(rep.originalMedicinesData)));
      setAlertMessage("✅ " + rep.message);
      setAlertType("success");
    } else {
      setAlertMessage("❌ " + rep.error);
      setAlertType("danger");
      setMedicinesData(JSON.parse(JSON.stringify(originalMedicinesData)));
    }
    setTimeout(() => {
      setAlertMessage("");
      setAlertType("");
    }, 2000);
    setOnConfirmAction(null);
  };
  
  const onDeleteClick = () => {
    setAlertType("confirm-danger");
    setAlertMessage("❌ Supprimer les médicaments ?");
    setOnConfirmAction(() => handleDelete);
  };  

  useRealtimeMedicinesSwitcher(
    calendarType,
    calendarId,
    setMedicinesData,
    setOriginalMedicinesData,
    setLoadingMedicines
  );  

  if (loadingMedicines === undefined) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <output className="spinner-border text-primary">
          <span className="visually-hidden">Chargement des médicaments...</span>
        </output>
      </div>
    );
  }
  
  if (loadingMedicines === false) {
    return (
      <div className="text-center mt-5">
        ❌ Ce lien de calendrier partagé est invalide ou a expiré.
      </div>
    );
  }
  

  return (
    <div className="container d-flex justify-content-center">
      <div className="card p-3 shadow-sm w-100">
        <div className="d-flex justify-content-start mb-3">
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate(`/${basePath}/${calendarId}`)}
            title="Retour au calendrier"
          >
            <i className="bi bi-calendar-date"></i>
            <span> Retour au calendrier</span>
          </button>
        </div>
        <h4 className="mt-3">
          <i className="bi bi-capsule"></i>
          <span> Liste des médicaments</span>
        </h4>

        <div className="d-flex flex-wrap gap-2 my-3">
          <button 
            onClick={() => {
              const rep = calendarSource.addMedicine(medicinesData);
              if (rep.success) {
                setMedicinesData(rep.medicinesData);
              }
              setHighlightedId(rep.id);
              setTimeout(() => setHighlightedId(null), 2000);
              setTimeout(() => lastMedRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }}
            className="btn btn-outline-primary"
            title="Ajouter un médicament"
          >
            <i className="bi bi-plus-lg"></i>
            <span> Ajouter un médicament</span>
          </button>

          <button
            onClick={onDeleteClick}
            className="btn btn-outline-danger"
            disabled={checked.length === 0}
            title="Supprimer les médicaments sélectionnés"
          >
            <i className="bi bi-trash3"></i>
            <span> Supprimer sélectionnés</span>
          </button>

          <button
            onClick={onSaveClick}
            className="btn btn-outline-success"
            disabled={!allMedsValid || !hasChanges}
            title="Modifier les médicaments"
          >
            <i className="bi bi-pencil"></i>
            <span> Modifier les médicaments</span>
          </button>
        </div>

        <AlertSystem
          type={alertType}
          message={alertMessage}
          onClose={() => {
            setAlertMessage("");
            setOnConfirmAction(null);
          }}
          onConfirm={() => {
            if (onConfirmAction) onConfirmAction();
          }}
        />

        {medicinesData.length === 0 ? (
          <div className="text-center mt-5 text-muted">❌ Aucun médicament n’a encore été ajouté pour ce calendrier.</div>
        ) : (
          <ul className="list-group striped-bootstrap">
              {medicinesData.map((med) => (
                <li
                key={med.id}
                ref={med.id === highlightedId ? lastMedRef : null}
                className={`list-group-item px-2 py-3 ${med.id === highlightedId ? 'highlighted-med' : ''}`}
              >
                <div className="row g-2 align-items-center">
                  {/* Checkbox */}
                  <div className="col-2 col-md-1 d-flex justify-content-center">
                    <input
                      className="form-check-input mt-2"
                      type="checkbox"
                      checked={checked.includes(med.id)}
                      onChange={() => toggleSelection(med.id)}
                      id={`check-${med.id}`}
                    />
                  </div>

                  {/* Nom */}
                  <div className="col-10 col-md-3">
                    <div className="form-floating">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        id={`name-${med.id}`}
                        placeholder="Nom"
                        value={med?.name || ''}
                        onChange={(e) => handleMedChange(med.id, 'name', e.target.value)}
                      />
                      <label htmlFor={`name-${med.id}`}>Nom</label>
                    </div>
                  </div>

                  {/* Comprimés */}
                  <div className="col-6 col-md-2">
                    <div className="form-floating">
                      <input
                        type="number"
                        step="0.25"
                        className="form-control form-control-sm"
                        id={`comps-${med.id}`}
                        placeholder="Comprimés"
                        value={med?.tablet_count ?? ''}
                        onChange={(e) => handleMedChange(med.id, 'tablet_count', e.target.value)}
                      />
                      <label htmlFor={`comps-${med.id}`}>Comprimés</label>
                    </div>
                  </div>

                  {/* Moment */}
                  <div className="col-6 col-md-2">
                    <div className="form-floating">
                      <select
                        className="form-select form-select-sm"
                        id={`moment-${med.id}`}
                        value={med?.time[0] || ''}
                        onChange={(e) => handleMedChange(med.id, 'time', e.target.value)}
                      >
                        <option value="" disabled hidden>Choisir</option>
                        <option value="morning">Matin</option>
                        <option value="noon">Midi</option>
                        <option value="evening">Soir</option>
                      </select>
                      <label htmlFor={`moment-${med.id}`}>Moment</label>
                    </div>
                  </div>

                  {/* Intervalle */}
                  <div className="col-6 col-md-2">
                    <div className="form-floating">
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        id={`interval-${med.id}`}
                        placeholder="Intervalle"
                        value={med?.interval_days ?? ''}
                        onChange={(e) => handleMedChange(med.id, 'interval_days', e.target.value)}
                      />
                      <label htmlFor={`interval-${med.id}`}>Intervalle</label>
                    </div>
                  </div>

                  {/* Date de début */}
                  <div className="col-6 col-md-2">
                    <div className="form-floating">
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        id={`start-${med.id}`}
                        placeholder="Date de début"
                        value={med?.start_date || ''}
                        onChange={(e) => handleMedChange(med.id, 'start_date', e.target.value)}
                      />
                      <label htmlFor={`start-${med.id}`}>Date de début</label>
                    </div>
                  </div>
                </div>

              </li>
            ))}
          </ul>
        )}

      </div>
    </div>
  );
}

export default MedicinesView;