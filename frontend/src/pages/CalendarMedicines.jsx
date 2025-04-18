// MedicamentsPage.jsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useContext } from "react";
import { AuthContext } from "../contexts/LoginContext";


function MedicamentsPage({
  meds,
  selectedToDelete,
  setSelectedToDelete,
  confirmDeleteVisible,
  setConfirmDeleteVisible,
  alertMessage,
  setAlertMessage,
  alertType,
  handleMedChange,
  updateMeds,
  deleteSelectedMeds,
  addMed,
  fetchCalendarsMedecines,
}) {
  const { nameCalendar } = useParams();

   const { authReady, login } = useContext(AuthContext);


  const toggleSelection = (index) => {
    setSelectedToDelete((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };
  
  useEffect(() => {
    if (authReady && login) {
      fetchCalendarsMedecines(nameCalendar)
    }
  }, [authReady, login]);

  if (!meds) {
    return <div className="text-center mt-5">⏳ Chargement des médicaments...</div>;
  };
  


  return (
    <div className="container mt-4">
      <h3>💊 Liste des médicaments</h3>

      <div className="d-flex flex-wrap gap-2 my-3">
        <button onClick={addMed} className="btn btn-primary btn-sm">
          ➕ Ajouter un médicament
        </button>
        <button
          onClick={() => setConfirmDeleteVisible(true)}
          className="btn btn-danger btn-sm"
          disabled={selectedToDelete.length === 0}
        >
          🗑️ Supprimer sélectionnés
        </button>
        <button onClick={ () => updateMeds(nameCalendar)} className="btn btn-success btn-sm">
          💾 Modifier les médicaments
        </button>
      </div>

      {confirmDeleteVisible && (
        <div className="alert alert-danger d-flex justify-content-between align-items-center mt-3" role="alert">
          ⚠️ Confirmez-vous la suppression des médicaments sélectionnés ?
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => {
                deleteSelectedMeds();
                setConfirmDeleteVisible(false);
              }}
            >
              Oui, supprimer
            </button>
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={() => setConfirmDeleteVisible(false)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {alertMessage && (
        <div className={`alert alert-${alertType} alert-dismissible fade show`} role="alert">
          {alertMessage}
          <button type="button" className="btn-close" data-bs-dismiss="alert" onClick={() => setAlertMessage('')}></button>
        </div>
      )}

      <ul className="list-group">
        {meds.map((med, index) => (
          <li key={index} className="list-group-item px-2 py-3">
            <div className="d-flex flex-wrap align-items-center gap-2">
              <div className="form-check" style={{ width: '40px' }}>
                <input
                  className="form-check-input mt-2"
                  type="checkbox"
                  checked={selectedToDelete.includes(index)}
                  onChange={() => toggleSelection(index)}
                  id={`check-${index}`}
                />
              </div>

              <div className="form-floating" style={{ maxWidth: '150px' }}>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  id={`name-${index}`}
                  placeholder="Nom"
                  value={med.name}
                  onChange={(e) => handleMedChange(index, 'name', e.target.value)}
                />
                <label htmlFor={`name-${index}`}>Nom</label>
              </div>

              <div className="form-floating" style={{ maxWidth: '100px' }}>
                <input
                  type="number"
                  step="0.25"
                  className="form-control form-control-sm"
                  id={`comps-${index}`}
                  placeholder="Comprimés"
                  value={med.tablet_count ?? ''}
                  onChange={(e) => handleMedChange(index, 'tablet_count', e.target.value)}
                />
                <label htmlFor={`comps-${index}`}>Comprimés</label>
              </div>

              <div className="form-floating" style={{ maxWidth: '110px' }}>
                <select
                  className="form-select form-select-sm"
                  id={`moment-${index}`}
                  value={med.time[0]}
                  onChange={(e) => handleMedChange(index, 'time', e.target.value)}
                >
                  <option value="" disabled hidden>Choisir</option>
                  <option value="morning">Matin</option>
                  <option value="evening">Soir</option>
                </select>
                <label htmlFor={`moment-${index}`}>Moment</label>
              </div>

              <div className="form-floating" style={{ maxWidth: '100px' }}>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  id={`interval-${index}`}
                  placeholder="Intervalle"
                  value={med.interval_days ?? ''}
                  onChange={(e) => handleMedChange(index, 'interval_days', e.target.value)}
                />
                <label htmlFor={`interval-${index}`}>Intervalle</label>
              </div>

              <div className="form-floating" style={{ maxWidth: '160px' }}>
                <input
                  type="date"
                  className="form-control form-control-sm"
                  id={`start-${index}`}
                  placeholder="Date de début"
                  value={med.start_date || ''}
                  onChange={(e) => handleMedChange(index, 'start_date', e.target.value)}
                />
                <label htmlFor={`start-${index}`}>Date de début</label>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default MedicamentsPage;