import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useRealtimeTokenMedicines } from '../hooks/useRealtimeMedicines';

function MedicinesList() {
  // 📍 Paramètres d’URL et navigation
  const { sharedToken } = useParams(); // Récupération du token de partage depuis l'URL
  const navigate = useNavigate(); // Hook de navigation

  // ✅ État de récupération des médicaments partagés
  const [loadingMedicines, setLoadingMedicines] = useState(undefined);
  const [medicinesData, setMedicinesData] = useState([]); // Liste des médicaments du calendrier partagé

  useRealtimeTokenMedicines(sharedToken, setMedicinesData, setLoadingMedicines);

  const groupMedicinesByName = (medicines) => {
    return medicines.reduce((acc, med) => {
      acc[med.name] = acc[med.name] || [];
      acc[med.name].push(med);
      return acc;
    }, {});
  };

  if (loadingMedicines === undefined && sharedToken) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: '60vh' }}
      >
        <div className="spinner-border text-primary">
          <span className="visually-hidden">Chargement des médicaments...</span>
        </div>
      </div>
    );
  }

  if (loadingMedicines === false && sharedToken) {
    return (
      <div className="alert alert-danger text-center mt-5" role="alert">
        ❌ Ce lien de calendrier partagé est invalide ou a expiré.
      </div>
    );
  }

  const groupedMedicines = medicinesData
    ? groupMedicinesByName(medicinesData)
    : {};

  return (
    <div className="container mt-4">
      <button
        className="btn btn-outline-primary mb-3"
        onClick={() => navigate(`/shared-token-calendar/${sharedToken}`)}
      >
        <i className="bi bi-calendar-date"></i>
        <span> Retour au calendrier</span>
      </button>

      <h4>
        <i className="bi bi-capsule"></i>
        <span> Liste des médicaments</span>
      </h4>

      {Object.keys(groupedMedicines).length === 0 ? (
        <div className="text-center mt-5 text-muted">
          ❌ Aucun médicament n’a encore été ajouté pour ce calendrier.
        </div>
      ) : (
        <ul className="list-group mt-3">
          {Object.keys(groupedMedicines).map((key, index) => (
            <li key={index} className="list-group-item align-items-center">
              <strong>
                {key}{' '}
                {groupedMedicines[key][0].dose != null
                  ? `${groupedMedicines[key][0].dose} mg`
                  : ''}
              </strong>
              {groupedMedicines[key].map((med, index) => (
                <div key={index} className="text-muted small">
                  {med.time_of_day[0] === 'morning' ? 'Matin' : 'Soir'} -{' '}
                  {med.tablet_count} comprimé(s) - Tous les {med.interval_days}{' '}
                  jour(s)
                  {med.start_date &&
                    ` à partir du ${new Date(med.start_date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}`}
                </div>
              ))}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MedicinesList;
