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

  if (loadingMedicines === undefined && sharedToken) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <output className="spinner-border text-primary">
          <span className="visually-hidden">Chargement des médicaments...</span>
        </output>
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

      {medicinesData.length === 0 ? (
        <div className="text-center mt-5 text-muted">
          ❌ Aucun médicament n’a encore été ajouté pour ce calendrier.
        </div>
      ) : (
        <ul className="list-group mt-3">
          {medicinesData.map((med, index) => (
            <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <strong>{med.name}</strong> 
                <div className="text-muted small">
                  {med.tablet_count} comprimé(s) - {med.time[0] === "morning" ? "Matin" : "Soir"} - Tous les {med.interval_days} jour(s)
                  {med.start_date && ` à partir du ${med.start_date}`}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default MedicinesList;
