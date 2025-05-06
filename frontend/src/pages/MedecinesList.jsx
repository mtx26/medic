import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

function MedicinesList({ tokenCalendars }) {
  // 📍 Paramètres d’URL et navigation
  const { sharedToken } = useParams(); // Récupération du token de partage depuis l'URL
  const navigate = useNavigate(); // Hook de navigation

  // ✅ État de récupération des médicaments partagés
  const [successFetchSharedTokenMedicines, setSuccessFetchSharedTokenMedicines] = useState(); // État du succès de la récupération des médicaments partagés
  const [medicinesData, setMedicinesData] = useState([]); // Liste des médicaments du calendrier partagé
  
  // Fonction pour charger le calendrier lorsque l'utilisateur est connecté
  useEffect(() => {
    const fetchShared = async () => {
      if (sharedToken) {
        const rep = await tokenCalendars.fetchTokenCalendarMedicines(sharedToken);
        if (rep.success) {
          setMedicinesData(rep.medicinesData);
        }
        setSuccessFetchSharedTokenMedicines(rep.success);
      }
    };
  
    fetchShared();
  }, [sharedToken]);

  if (successFetchSharedTokenMedicines === undefined && sharedToken) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '60vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement des médicaments...</span>
        </div>
      </div>
    );
  }
  
  if (successFetchSharedTokenMedicines === false && sharedToken) {
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
