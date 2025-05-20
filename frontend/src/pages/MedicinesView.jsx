// MedicamentsPage.jsx
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import AlertSystem from '../components/AlertSystem';
import { useRealtimeMedicinesSwitcher } from '../hooks/useRealtimeMedicinesSwitcher';
import { getCalendarSourceMap } from '../utils/calendarSourceMap';
import { useContext } from 'react';
import { UserContext } from '../contexts/UserContext';
import { formatToLocalISODate } from '../utils/dateUtils';

function MedicinesView({ personalCalendars, sharedUserCalendars, tokenCalendars }) {
  // 📍 Paramètres d'URL et navigation
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
  const [originalMedicinesData, setOriginalMedicinesData] = useState([]); // Liste des médicaments d'origine
  const [loadingMedicines, setLoadingMedicines] = useState(undefined); // État de chargement des médicaments
  const [highlightedField, setHighlightedField] = useState(null); // { id: string, field: string }
  const [groupedMedicines, setGroupedMedicines] = useState([]);

  const { authReady } = useContext(UserContext);

  // 🔄 Modifications
  const hasChanges = JSON.stringify(medicinesData) !== JSON.stringify(originalMedicinesData); // Détection des changements dans les médicaments
  

  let calendarType = 'personal';
  let calendarId = params.calendarId;
  let basePath = 'calendar';

  if (location.pathname.startsWith('/shared-user-calendar')) {
    calendarType = 'sharedUser';
    calendarId = params.calendarId;
    basePath = 'shared-user-calendar';
  }

  const calendarSource = getCalendarSourceMap(personalCalendars, sharedUserCalendars, tokenCalendars)[calendarType];

  // 🔄 Gestion de la sélection des médicaments
  const toggleSelection = (id) => {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // 🔄 Groupement des médicaments par nom
  const getGroupedMedicinesList = (medicines) => {
    const sorted = [...medicines].sort((a, b) =>
      a.name.toLowerCase().localeCompare(b.name.toLowerCase())
    );
  
    const result = [];
    let currentGroup = null;
  
    for (const med of sorted) {
      if (med.name !== currentGroup) {
        currentGroup = med.name;
        result.push({ type: "group", name: currentGroup, ids: [med.id] });
      } else {
        const lastItem = result.find(item => item.name === med.name);
        if (lastItem) {
          lastItem.ids.push(med.id);
        }
      }
      result.push({ type: "med", data: med });
    }

    setGroupedMedicines(result);
  };   

  // 🔄 Détection des modifications
  const isFieldChanged = (id, field) => {
    const original = originalMedicinesData.find(med => med.id === id);
    const current = medicinesData.find(med => med.id === id);
    if (!original || !current) return false;
    return JSON.stringify(original[field]) !== JSON.stringify(current[field]);
  };

  const isNewMed = (id) => {
    return !originalMedicinesData.some((med) => med.id === id);
  };  
  
  // 🔄 Gestion des modifications
  const handleMedChange = (id, field, value) => {
    const index = medicinesData.findIndex((med) => med.id === id);
    if (index === -1) return; // id introuvable, on ne fait rien
  
    const updated = [...medicinesData]; // copie du tableau
    const numericFields = ['tablet_count', 'interval_days'];
  
    if (field === 'time_of_day') {
      updated[index][field] = [value];
    } else if (numericFields.includes(field)) {
      updated[index][field] = value === '' ? '' : parseFloat(value);
    } else {
      updated[index][field] = value;
    }
  
    setMedicinesData(updated);
    setHighlightedField({ id, field });
  };
  
  // 🔄 Validation des médicaments
  const getMedFieldValidity = (med) => {
    if (!med || typeof med !== 'object') return {
      name: false,
      tablet_count: false,
      time_of_day: false,
      interval_days: false,
      start_date: false
    };
  
    return {
      name: typeof med.name === 'string' && med.name.trim() !== '',
      tablet_count: med.tablet_count !== '' &&
                    med.tablet_count !== null &&
                    !isNaN(parseFloat(med.tablet_count)),
      time_of_day: med.time_of_day !== '' &&
            med.time_of_day.length > 0 &&
            ['morning', 'noon', 'evening'].includes(med.time_of_day),
      interval_days: med.interval_days !== '' &&
                     med.interval_days !== null &&
                     !isNaN(parseInt(med.interval_days)),
      start_date: parseInt(med.interval_days) === 1 ||
                  (typeof med.start_date === 'string' && med.start_date.trim() !== '')
    };
  };

  const allMedsValid = medicinesData.length > 0 && medicinesData.every(
    (med) => {
      const validity = getMedFieldValidity(med);
      return Object.values(validity).every(Boolean);
    }
  );

  // 🔄 Enregistrement des modifications
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

  // 🔄 Suppression des médicaments
  const handleDelete = async () => {
    const rep = await calendarSource.deleteMedicines(calendarId, checked, medicinesData);
    if (rep.success) {
      setMedicinesData(rep.medicinesData);
      setChecked([]);
      setOriginalMedicinesData(JSON.parse(JSON.stringify(rep.originalMedicinesData)));
      setAlertMessage("✅ " + rep.message);
      setAlertType("success");
      getGroupedMedicinesList(rep.medicinesData);
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

  // 🔄 Gestion des médicaments en temps réel
  useRealtimeMedicinesSwitcher(
    calendarType,
    calendarId,
    setMedicinesData,
    setOriginalMedicinesData,
    setLoadingMedicines
  );  

  // 🔄 Gestion du rendu
  useEffect(() => {
    if (authReady && medicinesData.length > 0) {
      getGroupedMedicinesList(medicinesData);
    }
  }, [authReady, medicinesData]);

  // 🔄 Gestion du focus 
  useEffect(() => {
    if (highlightedField && highlightedField.id && highlightedField.field) {
      setTimeout(() => {
        const input = document.getElementById(`${highlightedField.field}-${highlightedField.id}`);
        if (input) {
          input.focus();
          input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        setHighlightedField(null);
      }, 100);
    }
  }, [highlightedField]);
  
  // 🔄 Gestion du chargement
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
        <div className="d-flex flex-column flex-md-row gap-2 mb-3 align-items-stretch align-items-md-center">

          {/* Ajouter */}
          <button 
            onClick={() => {
              const rep = calendarSource.addMedicine(medicinesData);
              if (rep.success) setMedicinesData(rep.medicinesData);
            }}
            className="btn btn-primary btn-sm w-100 w-md-auto"
            title="Ajouter un médicament"
          >
            <i className="bi bi-plus-lg me-1"></i> Ajouter
          </button>

          {/* Supprimer */}
          <button
            onClick={onDeleteClick}
            className="btn btn-danger btn-sm w-100 w-md-auto"
            disabled={checked.length === 0}
            title="Supprimer les médicaments sélectionnés"
          >
            <i className="bi bi-trash3 me-1"></i> Supprimer
          </button>

          {/* Enregistrer */}
          <button
            onClick={onSaveClick}
            className="btn btn-success btn-sm w-100 w-md-auto"
            disabled={!allMedsValid || !hasChanges}
            title="Enregistrer les modifications"
          >
            <i className="bi bi-pencil me-1"></i> Enregistrer
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

        {groupedMedicines.length === 0 ? (
          <div className="text-center mt-5 text-muted">❌ Aucun médicament n'a encore été ajouté pour ce calendrier.</div>
        ) : (
          <>
            {/* Checkbox */}
            <div className="mb-2">
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="check-all"
                  checked={checked.length === medicinesData.length}
                  onChange={() => {
                    if (checked.length === medicinesData.length) {
                      setChecked([]);
                    } else {
                      setChecked(medicinesData.map(med => med.id));
                    }
                  }}
                  title="Tout sélectionner"
                />
                <label htmlFor="check-all" className="form-check-label">
                  Tout sélectionner
                </label>
              </div>
            </div>

            <ul className="list-group striped-bootstrap">
                {groupedMedicines.map((item, index) => {
                  const validity = getMedFieldValidity(item.data);
                  if (item.type === "group") {
                    return (
                      <li key={`group-${index}`} className="list-group-item fw-bold bg-light">
                        <div className="d-flex justify-content-between align-items-center">
                          {/* Checkbox */}
                          <div className="d-flex align-items-center">
                            <div className="me-2">
                              <input
                                className="form-check-input"
                                type="checkbox"
                                checked={checked.some(id => item.ids.includes(id))}
                                onChange={() => {
                                  for (const id of item.ids) {
                                    toggleSelection(id);
                                  }
                                }}
                                id={`check-${item.ids}`}
                                title="Sélectionner le médicament"
                              />
                            </div>
                            <label htmlFor={`check-${item.ids}`}>{item.name}</label>
                          </div>

                          {/* Bouton "+" */}
                          <button
                            className="btn btn-success btn-sm"
                            title="Ajouter un médicament"
                            onClick={() => {
                              const rep = calendarSource.addMedicine(medicinesData, item.name);
                              if (rep.success) {
                                setMedicinesData(rep.medicinesData);
                                setHighlightedField({ id: rep.id, field: 'dose' });
                              }
                            }}
                          >
                            <i className="bi bi-plus-lg"></i>
                          </button>
                        </div>
                      </li>
                    );
                  } 
                  return (
                    <li
                      key={item.data.id}
                      id={`med-${item.data.id}`}
                      className={`list-group-item px-2 py-3 ${isNewMed(item.data.id) ? 'med-added' : ''}`}
                    >
                      <div className="row g-2 align-items-center" key={item.data.id}>
                        {/* Checkbox */}
                        <div className="col-2 col-md-1 d-flex justify-content-center">
                          <input
                            className="form-check-input mt-2"
                            type="checkbox"
                            checked={checked.includes(item.data.id)}
                            onChange={() => toggleSelection(item.data.id)}
                            id={`check-${item.data.id}`}
                            title="Sélectionner le médicament"
                          />
                        </div>

                        {/* Nom */}
                        <div className="col-10 col-md-2">
                          <div className="form-floating">
                            <input
                              type="text"
                              className={`form-control form-control-sm ${!validity.name ? 'is-invalid' : ''} ${isFieldChanged(item.data.id, 'name') ? 'field-changed' : ''}`}
                              id={`name-${item.data.id}`}
                              placeholder="Nom"
                              value={item.data?.name || ''}
                              onChange={(e) => handleMedChange(item.data.id, 'name', e.target.value)}
                              title="Nom du médicament"
                            />
                            <label htmlFor={`name-${item.data.id}`}>Nom</label>
                          </div>
                        </div>
                        {/* Dose */}
                        <div className="col-6 col-md-2">
                          <div className="form-floating">
                            <input
                              type="number"
                              className={`form-control form-control-sm ${isFieldChanged(item.data.id, 'dose') ? 'field-changed' : ''}`}
                              id={`dose-${item.data.id}`}
                              placeholder="Dose"
                              value={item.data?.dose || ''}
                              onChange={(e) => handleMedChange(item.data.id, 'dose', e.target.value)}
                              title="Dose en mg"
                            />
                            <label htmlFor={`dose-${item.data.id}`}>Dose (mg)</label>
                          </div>
                        </div>
                        {/* Comprimés */}
                        <div className="col-6 col-md-2">
                          <div className="form-floating">
                            <input
                              type="number"
                              step="0.25"
                              className={`form-control form-control-sm ${!validity.tablet_count ? 'is-invalid' : ''} ${isFieldChanged(item.data.id, 'tablet_count') ? 'field-changed' : ''}`}
                              id={`comps-${item.data.id}`}
                              placeholder="Comprimés"
                              value={item.data?.tablet_count || ''}
                              onChange={(e) => handleMedChange(item.data.id, 'tablet_count', e.target.value)}
                              title="Nombre de comprimés"
                            />
                            <label htmlFor={`comps-${item.data.id}`}>Comprimés</label>
                          </div>
                        </div>

                        {/* Moment */}
                        <div className="col-6 col-md-2">
                          <div className="form-floating">
                            <select
                              className="form-select form-select-sm"
                              id={`moment-${item.data.id}`}
                              value={item.data?.time_of_day[0] || ''}
                              onChange={(e) => handleMedChange(item.data.id, 'time_of_day', e.target.value)}
                            >
                              <option value="" disabled hidden>Choisir</option>
                              <option value="morning">Matin</option>
                              <option value="noon">Midi</option>
                              <option value="evening">Soir</option>
                            </select>
                            <label htmlFor={`moment-${item.data.id}`}>Moment</label>
                          </div>
                        </div>

                        {/* Intervalle */}
                        <div className="col-6 col-md-1">
                          <div className="form-floating">
                            <input
                              type="number"
                              className={`form-control form-control-sm ${!validity.interval_days ? 'is-invalid' : ''} ${isFieldChanged(item.data.id, 'interval_days') ? 'field-changed' : ''}`}
                              id={`interval-${item.data.id}`}
                              placeholder="Intervalle"
                              value={item.data?.interval_days || ''}
                              onChange={(e) => handleMedChange(item.data.id, 'interval_days', e.target.value)}
                              title="Intervalle en jours"
                            />
                            <label htmlFor={`interval-${item.data.id}`}>Intervalle</label>
                          </div>
                        </div>

                        {/* Date de début */}
                        <div className="col-6 col-md-2">
                          <div className="form-floating">
                            <input
                              type="date"
                              className={`form-control form-control-sm ${!validity.start_date ? 'is-invalid' : ''} ${isFieldChanged(item.data.id, 'start_date') ? 'field-changed' : ''}`}
                              id={`start-${item.data.id}`}
                              placeholder="Date de début"
                              value={item.data?.start_date ? formatToLocalISODate(item.data?.start_date) : ''}
                              onChange={(e) => handleMedChange(item.data.id, 'start_date', e.target.value)}
                              title="Date de début"
                            />
                            <label htmlFor={`start-${item.data.id}`}>Date de début</label>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
            </ul>
          </>
        )}

      </div>
    </div>
  );
}

export default MedicinesView;