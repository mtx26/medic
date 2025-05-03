// MedicamentsPage.jsx
import React, { useEffect, useState, useContext, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../contexts/LoginContext';
import AlertSystem from '../components/AlertSystem';

function MedicamentsPage({ medicines, calendars }) {
  // 📍 Paramètres d’URL et navigation
  const { calendarId } = useParams(); // Récupération du nom du calendrier depuis l'URL
  const navigate = useNavigate(); // Hook de navigation

  // 🔐 Contexte d'authentification
  const { authReady, currentUser } = useContext(AuthContext); // Contexte de l'utilisateur connecté

  // ⚠️ Alertes et confirmations
  const [alertType, setAlertType] = useState(""); // État pour le type d'alerte
  const [alertMessage, setAlertMessage] = useState(""); // État pour le message d'alerte
  const [onConfirmAction, setOnConfirmAction] = useState(null); // État pour l'action à confirmer

  // 📦 Données & interface
  const [loadingMedicines, setLoadingMedicines] = useState(); // État de chargement des médicaments
  const [highlightedIndex, setHighlightedIndex] = useState(null); // État pour l'élément mis en évidence dans la liste
  const lastMedRef = useRef(null); // Référence vers le dernier médicament affiché

  // 🔄 Modifications
  const hasChanges = JSON.stringify(medicines.medicinesData) !== JSON.stringify(medicines.originalMedicinesData); // Détection des changements dans les médicaments

  const toggleSelection = (index) => {
    medicines.setChecked((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handleMedChange = (index, field, value) => {
    const updated = [...medicines.medicinesData];
    const numericFields = ['tablet_count', 'interval_days'];
  
    if (field === 'time') {
      updated[index][field] = [value];
    } else if (numericFields.includes(field)) {
      updated[index][field] = value === '' ? '' : parseFloat(value);
    } else {
      updated[index][field] = value;
    }
  
    medicines.setMedicinesData(updated);
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
  
  

  const allMedsValid = medicines.medicinesData.length > 0 && medicines.medicinesData.every(isMedValid);

  useEffect(() => {
    const load = async () => {
      if (authReady && currentUser && calendarId) {
        calendars.setCalendarsData([]);
        await calendars.fetchCalendars();
        const success = await medicines.fetchCalendarMedicines(calendarId);
        setLoadingMedicines(success);
      }
    };
    load();
  }, [authReady, currentUser, calendarId]);


  if (loadingMedicines === undefined && calendarId) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement des médicaments...</span>
        </div>
      </div>
    );
  }

  if (loadingMedicines === false && calendarId) {
    return <div className="text-center mt-5">❌ Calendrier non trouvé</div>;
  }

  return (
    <div className="container d-flex justify-content-center">
      <div className="card p-3 shadow-sm w-100">
        <div className="d-flex justify-content-start mb-3">
          <button
            className="btn btn-outline-primary"
            onClick={() => navigate(`/calendars/${calendarId}`)}
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
              medicines.addMedicine();
              setHighlightedIndex(medicines.medicinesData.length);
              setTimeout(() => setHighlightedIndex(null), 2000);
              setTimeout(() => lastMedRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
            }}
            className="btn btn-outline-primary"
            title="Ajouter un médicament"
          >
            <i className="bi bi-plus-lg"></i>
            <span> Ajouter un médicament</span>
          </button>

          <button
            onClick={() => {
              setAlertType("confirm-danger");
              setAlertMessage("❌ Confirmez-vous la suppression des médicaments sélectionnés ?");
              setOnConfirmAction(() => async () => {
                const success = await medicines.deleteSelectedMedicines(calendarId);
                if (success) {
                  setAlertMessage("✅ Médicaments supprimés.");
                  setAlertType("success");
                } else {
                  setAlertMessage("❌ Erreur lors de la suppression.");
                  setAlertType("danger");
                }
                setTimeout(() => {
                  setAlertMessage("");
                  setAlertType("");
                }, 2000);
                setOnConfirmAction(null);
              });
            }}
            className="btn btn-outline-danger"
            disabled={medicines.checked.length === 0}
            title="Supprimer les médicaments sélectionnés"
          >
            <i className="bi bi-trash3"></i>
            <span> Supprimer sélectionnés</span>
          </button>

          <button
            onClick={() => {
              setAlertType("confirm-safe");
              setAlertMessage("✅ Enregistrer les modifications de médicaments ?");
              setOnConfirmAction(() => {
                const success = medicines.updateMedicines(medicines.medicinesData, calendarId);
                if (success) {
                  setAlertMessage("✅ Modifications enregistrées.");
                  setAlertType("success");
                } else {
                  setAlertMessage("❌ Erreur lors de l'enregistrement des modifications.");
                  setAlertType("danger");
                }
                setTimeout(() => {
                  setAlertMessage("");
                  setAlertType("");
                }, 2000);
                setOnConfirmAction(null);
              });
            }}
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

        <ul className="list-group">
          {medicines.medicinesData.length === 0 ? (
            <div className="text-center mt-5 text-muted">❌ Aucun médicament n’a encore été ajouté pour ce calendrier.</div>
          ) : (
            medicines.medicinesData.map((med, index) => (
              <li
                key={index}
                ref={index === medicines.medicinesData.length - 1 ? lastMedRef : null}
                className={`list-group-item px-2 py-3 ${index === highlightedIndex ? 'highlighted-med' : ''}`}
              >
                <div className="row g-2 align-items-center">
                  {/* Checkbox */}
                  <div className="col-2 col-md-1 d-flex justify-content-center">
                    <input
                      className="form-check-input mt-2"
                      type="checkbox"
                      checked={medicines.checked.includes(index)}
                      onChange={() => toggleSelection(index)}
                      id={`check-${index}`}
                    />
                  </div>

                  {/* Nom */}
                  <div className="col-10 col-md-3">
                    <div className="form-floating">
                      <input
                        type="text"
                        className="form-control form-control-sm"
                        id={`name-${index}`}
                        placeholder="Nom"
                        value={med?.name || ''}
                        onChange={(e) => handleMedChange(index, 'name', e.target.value)}
                      />
                      <label htmlFor={`name-${index}`}>Nom</label>
                    </div>
                  </div>

                  {/* Comprimés */}
                  <div className="col-6 col-md-2">
                    <div className="form-floating">
                      <input
                        type="number"
                        step="0.25"
                        className="form-control form-control-sm"
                        id={`comps-${index}`}
                        placeholder="Comprimés"
                        value={med?.tablet_count ?? ''}
                        onChange={(e) => handleMedChange(index, 'tablet_count', e.target.value)}
                      />
                      <label htmlFor={`comps-${index}`}>Comprimés</label>
                    </div>
                  </div>

                  {/* Moment */}
                  <div className="col-6 col-md-2">
                    <div className="form-floating">
                      <select
                        className="form-select form-select-sm"
                        id={`moment-${index}`}
                        value={med?.time[0] || ''}
                        onChange={(e) => handleMedChange(index, 'time', e.target.value)}
                      >
                        <option value="" disabled hidden>Choisir</option>
                        <option value="morning">Matin</option>
                        <option value="noon">Midi</option>
                        <option value="evening">Soir</option>
                      </select>
                      <label htmlFor={`moment-${index}`}>Moment</label>
                    </div>
                  </div>

                  {/* Intervalle */}
                  <div className="col-6 col-md-2">
                    <div className="form-floating">
                      <input
                        type="number"
                        className="form-control form-control-sm"
                        id={`interval-${index}`}
                        placeholder="Intervalle"
                        value={med?.interval_days ?? ''}
                        onChange={(e) => handleMedChange(index, 'interval_days', e.target.value)}
                      />
                      <label htmlFor={`interval-${index}`}>Intervalle</label>
                    </div>
                  </div>

                  {/* Date de début */}
                  <div className="col-6 col-md-2">
                    <div className="form-floating">
                      <input
                        type="date"
                        className="form-control form-control-sm"
                        id={`start-${index}`}
                        placeholder="Date de début"
                        value={med?.start_date || ''}
                        onChange={(e) => handleMedChange(index, 'start_date', e.target.value)}
                      />
                      <label htmlFor={`start-${index}`}>Date de début</label>
                    </div>
                  </div>
                </div>

              </li>
            ))
          )}
        </ul>

      </div>
    </div>
  );
}

export default MedicamentsPage;