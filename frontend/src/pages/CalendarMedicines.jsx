// MedicamentsPage.jsx
import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useContext } from "react";
import { AuthContext } from "../contexts/LoginContext";
import { useNavigate } from 'react-router-dom';
import AlertSystem from "../components/AlertSystem";
import { useState } from 'react';



function MedicamentsPage({
  meds,
  selectedToDelete,
  setSelectedToDelete,
  handleMedChange,
  updateMeds,
  deleteSelectedMeds,
  addMed,
  fetchCalendarsMedecines,
  calendars,
}) {
  const { nameCalendar } = useParams();
  const { authReady, login } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [alertType, setAlertType] = useState("");
  const [alertMessage, setAlertMessage] = useState("");
  const [onConfirmAction, setOnConfirmAction] = useState(null);



  const toggleSelection = (index) => {
    setSelectedToDelete((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const isMedValid = (med) => {
    const hasValidStartDate = med.interval_days === 1 || (typeof med.start_date === 'string' && med.start_date.trim() !== '');
  
    return (
      typeof med.name === 'string' && med.name.trim() !== '' &&
      !isNaN(parseFloat(med.tablet_count)) &&
      Array.isArray(med.time) && med.time.length > 0 && ['morning', 'evening'].includes(med.time[0]) &&
      !isNaN(parseInt(med.interval_days)) &&
      hasValidStartDate
    );
  };

  const allMedsValid = meds.length > 0 && meds.every(isMedValid);
  
  
  useEffect(() => {
    if (authReady && login) {
      fetchCalendarsMedecines(nameCalendar)
    }
  }, [authReady, login]);


if (calendars.length === 0) {
  return <div className="text-center mt-5">⏳ Chargement du calendrier...</div>;
}


if (!calendars.includes(nameCalendar)) {
  return <div className="text-center mt-5 text-danger">❌ Ce calendrier n'existe pas.</div>;
};

  


  return (
    <div className="container mt-4">
      <button
        className="btn btn-outline-primary"
        onClick={() => navigate(`/calendars/${nameCalendar}`)}
      >
        🗂 List des calendriers
      </button>
      <h3>💊 Liste des médicaments</h3>

      <div className="d-flex flex-wrap gap-2 my-3">
        <button onClick={addMed} className="btn btn-primary btn-sm">
          ➕ Ajouter un médicament
        </button>
        <button
          onClick={() => {
            setAlertType("confirm-danger");
            setAlertMessage("❌ Confirmez-vous la suppression des médicaments sélectionnés ?");
            setOnConfirmAction(() => deleteSelectedMeds);
          }}
          className="btn btn-danger btn-sm"
          disabled={selectedToDelete.length === 0}
        >
          🗑️ Supprimer sélectionnés
        </button>

        <button
          onClick={() => {
            setAlertType("confirm-safe");
            setAlertMessage("✅ Enregistrer les modifications de médicaments ?");
            setOnConfirmAction(() => () => updateMeds(nameCalendar) );
          }}
          className="btn btn-success btn-sm"
          disabled={!allMedsValid}
        >
          💾 Modifier les médicaments
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
        {meds.length === 0 ? (
          <div className="text-center mt-5">⏳ Chargement des médicaments...</div>
        ) : (
          meds.map((med, index) => (
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
          ))
        )}
      </ul>
    </div>
  );
}

export default MedicamentsPage;